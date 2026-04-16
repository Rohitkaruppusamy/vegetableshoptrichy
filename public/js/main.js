// public/js/main.js
// Handles the main shop page:
//  - Fetch vegetables from the API
//  - Render vegetable cards
//  - WhatsApp ordering
//  - Delivery charge estimation
//  - Cart stored in sessionStorage

'use strict';

// ─────────────────────────────────────────────
// EMOJI MAP – maps vegetable names to emojis
// ─────────────────────────────────────────────
const VEG_EMOJIS = {
  'tomato': '🍅', 'onion': '🧅', 'potato': '🥔', 'carrot': '🥕',
  'beans': '🫘', 'cabbage': '🥬', 'cauliflower': '🥦', 'brinjal': '🍆',
  'eggplant': '🍆', 'cucumber': '🥒', 'ladies finger': '🌶️',
  'okra': '🌶️', 'capsicum': '🫑', 'beetroot': '🍠', 'radish': '🌱',
  'spinach': '🥬', 'peas': '🟢', 'corn': '🌽', 'garlic': '🧄',
  'ginger': '🫚', 'drumstick': '🌿', 'bitter gourd': '🥒',
  'snake gourd': '🥒', 'ash gourd': '🥒', 'ridge gourd': '🥒',
  'pumpkin': '🎃', 'colocasia': '🍃', 'yam': '🍠', 'sweet potato': '🍠',
  'raw banana': '🍌', 'plantain': '🍌', 'raw mango': '🥭',
};

function getEmoji(name) {
  const key = (name || '').toLowerCase();
  for (const [k, v] of Object.entries(VEG_EMOJIS)) {
    if (key.includes(k)) return v;
  }
  return '🥦';
}

// ─────────────────────────────────────────────
// FORMAT DATE
// ─────────────────────────────────────────────
function formatDate(dateStr) {
  if (!dateStr) return 'Unknown';
  try {
    const d = new Date(dateStr);
    if (isNaN(d)) return dateStr;
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch { return dateStr; }
}

// ─────────────────────────────────────────────
// TOAST NOTIFICATION
// ─────────────────────────────────────────────
function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.className = `toast toast-${type} show`;
  setTimeout(() => { t.className = 'toast'; }, 3500);
}

// ─────────────────────────────────────────────
// LOAD VEGETABLES FROM API
// ─────────────────────────────────────────────
async function loadVegetables() {
  const grid    = document.getElementById('veg-grid');
  const loading = document.getElementById('veg-loading');
  const error   = document.getElementById('veg-error');

  // Show loading state
  loading.style.display = 'flex';
  grid.style.display    = 'none';
  error.style.display   = 'none';

  try {
    const res  = await fetch('/api/vegetables');
    const json = await res.json();

    if (!json.success) throw new Error(json.message);

    renderVegetables(json.data);
    loading.style.display = 'none';
    grid.style.display    = 'grid';

    // Show refresh time
    const el = document.getElementById('last-refresh');
    if (el) el.textContent = 'Updated ' + new Date().toLocaleTimeString('en-IN');

  } catch (err) {
    console.error('Failed to load vegetables:', err);
    loading.style.display = 'none';
    error.style.display   = 'flex';
  }
}

// ─────────────────────────────────────────────
// RENDER VEGETABLE CARDS
// ─────────────────────────────────────────────
function renderVegetables(vegs) {
  const grid = document.getElementById('veg-grid');
  grid.innerHTML = '';

  if (!vegs || vegs.length === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1;">
        <div class="empty-icon">🥦</div>
        <p style="font-weight:600;">No vegetables listed yet.</p>
        <p style="font-size:14px;margin-top:8px;color:var(--text-muted);">Check back soon!</p>
      </div>`;
    return;
  }

  vegs.forEach(veg => {
    const card = document.createElement('div');
    card.className = 'veg-card';
    const isAvailable = veg.stock !== 'Out of Stock';
    const stockClass  = isAvailable ? 'stock-available' : 'stock-out';
    const stockLabel  = veg.stock || 'Available';

    card.innerHTML = `
      <div class="veg-card-header">
        <span class="veg-emoji">${getEmoji(veg.name)}</span>
        <div class="veg-name">${escHtml(veg.name)}</div>
        ${veg.name_ta ? `<div class="veg-name-ta">${escHtml(veg.name_ta)}</div>` : ''}
      </div>
      <div class="veg-card-body">
        <div class="price-row">
          <span class="price-amount">₹${parseFloat(veg.price).toFixed(0)}</span>
          <span class="price-unit">/ kg</span>
        </div>
        <div>
          <span class="stock-badge ${stockClass}">${escHtml(stockLabel)}</span>
        </div>
        <div class="updated-text">🕐 Updated: ${formatDate(veg.updated_at)}</div>
        <select class="qty-select" id="qty-${veg.id}" ${!isAvailable ? 'disabled' : ''}>
          ${[1,2,3,4,5,6,7,8,9,10].map(n => `<option value="${n}">${n} kg</option>`).join('')}
        </select>
      </div>
      <div class="veg-card-footer">
        <button
          class="btn-wa-card"
          onclick="orderWhatsApp(${veg.id}, '${escHtml(veg.name)}', ${veg.price})"
          ${!isAvailable ? 'disabled style="opacity:.5;cursor:not-allowed;"' : ''}
        >
          💬 Order via WhatsApp
        </button>
      </div>
    `;
    grid.appendChild(card);
  });
}

// ─────────────────────────────────────────────
// WHATSAPP ORDER (single item)
// ─────────────────────────────────────────────
function orderWhatsApp(vegId, vegName, pricePerKg) {
  const qtySelect = document.getElementById(`qty-${vegId}`);
  const qty = qtySelect ? parseInt(qtySelect.value) : 1;
  const total = (qty * pricePerKg).toFixed(0);

  const msg =
    `🌿 *PA KA Vegetables – New Order*\n\n` +
    `🥦 Item: ${vegName}\n` +
    `⚖️ Quantity: ${qty} kg\n` +
    `💰 Price: ₹${parseFloat(pricePerKg).toFixed(0)}/kg\n` +
    `🧾 Total: ₹${total}\n\n` +
    `📍 Gandhi Market, Trichy\n` +
    `⚠️ Please share your delivery address.\n\n` +
    `Thank you! 🙏`;

  const url = `https://wa.me/919789460493?text=${encodeURIComponent(msg)}`;
  window.open(url, '_blank');
  showToast('Opening WhatsApp…');
}

// ─────────────────────────────────────────────
// DELIVERY CHARGE ESTIMATION
// Based on distance from Gandhi Market, Trichy.
// Formula: free up to 5km, then ₹5/km up to 30km, ₹8/km beyond.
// ─────────────────────────────────────────────
function calculateDeliveryCharge(km) {
  km = parseFloat(km);
  if (isNaN(km) || km < 0) return null;
  if (km === 0) return 0;
  if (km <= 5)  return 0;        // Free within 5 km
  if (km <= 30) return Math.round((km - 5) * 5);   // ₹5/km from 5–30km
  return Math.round(25 * 5 + (km - 30) * 8);       // ₹8/km beyond 30km
}

function estimateDelivery() {
  const input  = document.getElementById('dist-input');
  const result = document.getElementById('delivery-result');
  const km     = parseFloat(input.value);

  if (!input.value || isNaN(km) || km < 0) {
    result.style.display = 'block';
    result.textContent   = '⚠️ Please enter a valid distance.';
    result.style.color   = 'var(--red)';
    return;
  }

  const charge = calculateDeliveryCharge(km);
  result.style.display = 'block';
  result.style.color   = 'var(--g-dark)';

  if (charge === 0) {
    result.innerHTML = `✅ <strong>Free delivery!</strong> You're within the free delivery zone (≤ 5 km).`;
  } else if (km <= 30) {
    result.innerHTML = `🚚 Estimated delivery charge: <strong>₹${charge}</strong> for ${km} km.`;
  } else {
    result.innerHTML = `🚚 Estimated delivery charge: <strong>₹${charge}</strong> for ${km} km. <em>(Long distance)</em>`;
  }
}

// ─────────────────────────────────────────────
// UTILITY – escape HTML to prevent XSS
// ─────────────────────────────────────────────
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
// INIT
// ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', loadVegetables);
