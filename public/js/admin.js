// public/js/admin.js
// Admin panel – handles login, vegetable CRUD, dashboard stats.
// Password is sent with every API request (not stored in localStorage
// for security; only in memory for the duration of the session).

'use strict';

let adminPassword = '';  // Set after login; cleared on logout
let editingId     = null; // Currently editing vegetable ID

// ─────────────────────────────────────────────
// LOGIN / LOGOUT
// ─────────────────────────────────────────────
async function doLogin() {
  const pwd    = document.getElementById('login-pwd').value.trim();
  const msgEl  = document.getElementById('login-msg');

  if (!pwd) {
    showLoginMsg('Please enter the password.', 'error'); return;
  }

  msgEl.style.display = 'none';

  try {
    const res  = await fetch('/api/admin/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pwd }),
    });
    const json = await res.json();

    if (json.success) {
      adminPassword = pwd;
      document.getElementById('login-gate').style.display  = 'none';
      document.getElementById('admin-app').style.display   = 'block';
      loadDashboard();
    } else {
      showLoginMsg('❌ Wrong password. Try again.', 'error');
    }
  } catch {
    showLoginMsg('⚠️ Could not connect to server.', 'error');
  }
}

function doLogout() {
  adminPassword = '';
  document.getElementById('login-gate').style.display = 'flex';
  document.getElementById('admin-app').style.display  = 'none';
  document.getElementById('login-pwd').value          = '';
}

function showLoginMsg(text, type) {
  const el = document.getElementById('login-msg');
  el.textContent   = text;
  el.className     = `msg-box msg-${type}`;
  el.style.display = 'block';
}

// ─────────────────────────────────────────────
// SIDEBAR NAVIGATION
// ─────────────────────────────────────────────
function showSection(name) {
  document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.sidebar-item').forEach(b => b.classList.remove('active'));

  document.getElementById(`section-${name}`).classList.add('active');
  const btn = [...document.querySelectorAll('.sidebar-item')]
    .find(b => b.getAttribute('onclick') && b.getAttribute('onclick').includes(`'${name}'`));
  if (btn) btn.classList.add('active');

  if (name === 'dashboard') loadDashboard();
  if (name === 'vegetables') loadManageTable();
  if (name === 'add') resetForm();
}

// ─────────────────────────────────────────────
// TOAST
// ─────────────────────────────────────────────
function showToast(msg, type = 'success') {
  const t = document.getElementById('admin-toast');
  if (!t) return;
  t.textContent = msg;
  t.className = `toast toast-${type} show`;
  setTimeout(() => { t.className = 'toast'; }, 3500);
}

// ─────────────────────────────────────────────
// FETCH VEGETABLES (authenticated)
// ─────────────────────────────────────────────
async function fetchVegs() {
  const res  = await fetch('/api/admin/all', {
    headers: { 'x-admin-password': adminPassword },
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message);
  return json.data;
}

// ─────────────────────────────────────────────
// DASHBOARD
// ─────────────────────────────────────────────
async function loadDashboard() {
  try {
    const vegs = await fetchVegs();

    const total     = vegs.length;
    const available = vegs.filter(v => v.stock === 'Available').length;
    const outStock  = vegs.filter(v => v.stock === 'Out of Stock').length;
    const avgPrice  = total ? (vegs.reduce((s, v) => s + v.price, 0) / total).toFixed(0) : 0;

    document.getElementById('stat-total').textContent     = total;
    document.getElementById('stat-available').textContent = available;
    document.getElementById('stat-out').textContent       = outStock;
    document.getElementById('stat-avg').textContent       = `₹${avgPrice}`;

    const tbody = document.getElementById('dash-tbody');
    tbody.innerHTML = vegs.map(v => `
      <tr>
        <td><strong>${escHtml(v.name)}</strong>${v.name_ta ? `<br><small style="color:var(--text-muted)">${escHtml(v.name_ta)}</small>` : ''}</td>
        <td><strong style="color:var(--g-main)">₹${parseFloat(v.price).toFixed(0)}</strong>/kg</td>
        <td>${stockBadge(v.stock)}</td>
        <td style="font-size:12px;color:var(--text-muted)">${formatDate(v.updated_at)}</td>
      </tr>
    `).join('');
  } catch (err) {
    console.error(err);
    showToast('Failed to load dashboard data', 'error');
  }
}

// ─────────────────────────────────────────────
// MANAGE VEGETABLES TABLE
// ─────────────────────────────────────────────
async function loadManageTable() {
  try {
    const vegs = await fetchVegs();
    const tbody = document.getElementById('veg-manage-tbody');

    if (!vegs.length) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:24px;color:var(--text-muted);">No vegetables yet. Add one!</td></tr>`;
      return;
    }

    tbody.innerHTML = vegs.map(v => `
      <tr>
        <td style="color:var(--text-muted);font-size:12px;">#${v.id}</td>
        <td><strong>${escHtml(v.name)}</strong></td>
        <td style="font-family:'Noto Sans Tamil',sans-serif;">${escHtml(v.name_ta || '–')}</td>
        <td><strong style="color:var(--g-main)">₹${parseFloat(v.price).toFixed(2)}</strong></td>
        <td>${stockBadge(v.stock)}</td>
        <td style="font-size:12px;color:var(--text-muted);">${formatDate(v.updated_at)}</td>
        <td style="display:flex;gap:6px;flex-wrap:wrap;">
          <button class="btn btn-sm btn-green" onclick="openEditModal(${v.id})">✏️ Edit</button>
          <button class="btn btn-sm btn-danger" onclick="deleteVeg(${v.id}, '${escHtml(v.name)}')">🗑️ Delete</button>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    console.error(err);
    showToast('Failed to load vegetables', 'error');
  }
}

// ─────────────────────────────────────────────
// ADD / EDIT VEGETABLE FORM
// ─────────────────────────────────────────────
async function submitVegetable(e) {
  e.preventDefault();
  const msgEl   = document.getElementById('add-msg');
  msgEl.style.display = 'none';

  const id      = document.getElementById('edit-id').value;
  const name    = document.getElementById('f-name').value.trim();
  const name_ta = document.getElementById('f-name-ta').value.trim();
  const price   = document.getElementById('f-price').value;
  const stock   = document.getElementById('f-stock').value;

  if (!name || !price) {
    showMsg(msgEl, 'Name and price are required.', 'error'); return;
  }

  try {
    let url, method, body;

    if (id) {
      // UPDATE existing
      url    = '/api/admin/update';
      method = 'PUT';
      body   = { password: adminPassword, id: parseInt(id), name, name_ta, price: parseFloat(price), stock };
    } else {
      // ADD new
      url    = '/api/admin/add';
      method = 'POST';
      body   = { password: adminPassword, name, name_ta, price: parseFloat(price), stock };
    }

    const res  = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const json = await res.json();

    if (json.success) {
      showMsg(msgEl, `✅ ${json.message}`, 'success');
      showToast(json.message);
      resetForm();
    } else {
      showMsg(msgEl, `❌ ${json.message}`, 'error');
    }
  } catch (err) {
    showMsg(msgEl, '⚠️ Network error. Try again.', 'error');
  }
}

function resetForm() {
  document.getElementById('edit-id').value    = '';
  document.getElementById('f-name').value     = '';
  document.getElementById('f-name-ta').value  = '';
  document.getElementById('f-price').value    = '';
  document.getElementById('f-stock').value    = 'Available';
  document.getElementById('add-form-title').textContent = 'Add New Vegetable';
  document.getElementById('add-form-desc').textContent  = 'Fill in the details to add a vegetable to the price list.';
  document.getElementById('submit-btn-text').textContent = '➕ Add Vegetable';
  document.getElementById('add-msg').style.display = 'none';
}

// ─────────────────────────────────────────────
// EDIT MODAL
// ─────────────────────────────────────────────
async function openEditModal(id) {
  try {
    const vegs = await fetchVegs();
    const veg  = vegs.find(v => v.id === id);
    if (!veg) return showToast('Vegetable not found', 'error');

    document.getElementById('modal-id').value      = veg.id;
    document.getElementById('modal-name').value    = veg.name;
    document.getElementById('modal-name-ta').value = veg.name_ta || '';
    document.getElementById('modal-price').value   = veg.price;
    document.getElementById('modal-stock').value   = veg.stock;
    document.getElementById('modal-msg').style.display = 'none';

    document.getElementById('edit-modal').style.display = 'flex';
  } catch {
    showToast('Could not load vegetable data', 'error');
  }
}

function closeModal() {
  document.getElementById('edit-modal').style.display = 'none';
}

async function saveEdit() {
  const msgEl   = document.getElementById('modal-msg');
  const id      = document.getElementById('modal-id').value;
  const name    = document.getElementById('modal-name').value.trim();
  const name_ta = document.getElementById('modal-name-ta').value.trim();
  const price   = document.getElementById('modal-price').value;
  const stock   = document.getElementById('modal-stock').value;

  if (!name || !price) {
    showMsg(msgEl, 'Name and price are required.', 'error'); return;
  }

  try {
    const res  = await fetch('/api/admin/update', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: adminPassword, id: parseInt(id), name, name_ta, price: parseFloat(price), stock }),
    });
    const json = await res.json();

    if (json.success) {
      showToast('✅ ' + json.message);
      closeModal();
      loadManageTable();
      loadDashboard();
    } else {
      showMsg(msgEl, '❌ ' + json.message, 'error');
    }
  } catch {
    showMsg(msgEl, '⚠️ Network error.', 'error');
  }
}

// ─────────────────────────────────────────────
// DELETE VEGETABLE
// ─────────────────────────────────────────────
async function deleteVeg(id, name) {
  if (!confirm(`Are you sure you want to delete "${name}"? This cannot be undone.`)) return;

  try {
    const res  = await fetch('/api/admin/delete', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: adminPassword, id }),
    });
    const json = await res.json();

    if (json.success) {
      showToast('🗑️ ' + json.message);
      loadManageTable();
      loadDashboard();
    } else {
      showToast('❌ ' + json.message, 'error');
    }
  } catch {
    showToast('⚠️ Network error.', 'error');
  }
}

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
function showMsg(el, text, type) {
  el.textContent   = text;
  el.className     = `msg-box msg-${type}`;
  el.style.display = 'block';
}

function stockBadge(stock) {
  const cls = stock === 'Available' ? 'stock-available' : stock === 'Out of Stock' ? 'stock-out' : '';
  return `<span class="stock-badge ${cls}">${escHtml(stock || 'Unknown')}</span>`;
}

function formatDate(dateStr) {
  if (!dateStr) return '–';
  try {
    const d = new Date(dateStr);
    if (isNaN(d)) return dateStr;
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch { return dateStr; }
}

function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ─────────────────────────────────────────────
// CLOSE MODAL ON BACKDROP CLICK
// ─────────────────────────────────────────────
document.getElementById('edit-modal').addEventListener('click', function(e) {
  if (e.target === this) closeModal();
});
