// public/js/order.js
// Handles the /order page:
//  - Reads cart from sessionStorage
//  - Renders order summary
//  - Calculates delivery estimate
//  - Sends full WhatsApp confirmation

'use strict';

let deliveryCharge = 0;

// ─────────────────────────────────────────────
// DELIVERY CALCULATION (same formula as main.js)
// ─────────────────────────────────────────────
function calculateDeliveryCharge(km) {
  km = parseFloat(km);
  if (isNaN(km) || km < 0) return null;
  if (km === 0) return 0;
  if (km <= 5)  return 0;
  if (km <= 30) return Math.round((km - 5) * 5);
  return Math.round(25 * 5 + (km - 30) * 8);
}

// ─────────────────────────────────────────────
// TOAST
// ─────────────────────────────────────────────
function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.className = `toast toast-${type} show`;
  setTimeout(() => { t.className = 'toast'; }, 3500);
}

// ─────────────────────────────────────────────
// LOAD AND RENDER ORDER from sessionStorage
// ─────────────────────────────────────────────
function loadOrder() {
  const raw   = sessionStorage.getItem('paka_cart');
  const items = raw ? JSON.parse(raw) : [];

  const emptyDiv  = document.getElementById('empty-cart');
  const orderDiv  = document.getElementById('order-content');

  if (!items || items.length === 0) {
    emptyDiv.style.display  = 'flex';
    emptyDiv.style.flexDirection = 'column';
    emptyDiv.style.alignItems    = 'center';
    orderDiv.style.display  = 'none';
    return;
  }

  emptyDiv.style.display = 'none';
  orderDiv.style.display = 'block';

  renderItems(items);
}

function renderItems(items) {
  const tbody   = document.getElementById('order-items');
  const subtotalEl = document.getElementById('order-subtotal');
  const grandEl    = document.getElementById('order-grand-total');

  let subtotal = 0;
  tbody.innerHTML = '';

  items.forEach(item => {
    const lineTotal = item.price * item.qty;
    subtotal += lineTotal;

    const row = document.createElement('div');
    row.className = 'order-item';
    row.innerHTML = `
      <div>
        <div class="order-item-name">${escHtml(item.name)}</div>
        <div class="order-item-detail">₹${item.price}/kg × ${item.qty} kg</div>
      </div>
      <div class="order-item-total">₹${lineTotal.toFixed(0)}</div>
    `;
    tbody.appendChild(row);
  });

  subtotalEl.textContent     = `₹${subtotal.toFixed(0)}`;
  grandEl.textContent        = `₹${(subtotal + deliveryCharge).toFixed(0)}`;
  window._orderSubtotal      = subtotal;
  window._orderItems         = items;
}

// ─────────────────────────────────────────────
// DELIVERY CALCULATION ON ORDER PAGE
// ─────────────────────────────────────────────
function calcOrderDelivery() {
  const input  = document.getElementById('order-dist');
  const result = document.getElementById('order-delivery-result');
  const grandEl = document.getElementById('order-grand-total');
  const km     = parseFloat(input.value);

  if (!input.value || isNaN(km) || km < 0) {
    result.textContent = '⚠️ Enter a valid distance.';
    result.style.color = 'var(--red)';
    return;
  }

  deliveryCharge = calculateDeliveryCharge(km) || 0;
  const subtotal = window._orderSubtotal || 0;

  result.style.color = 'var(--g-dark)';
  if (deliveryCharge === 0) {
    result.innerHTML = `✅ Free delivery! (within 5 km)`;
  } else {
    result.innerHTML = `🚚 Delivery charge: ₹${deliveryCharge} for ${km} km`;
  }

  grandEl.textContent = `₹${(subtotal + deliveryCharge).toFixed(0)}`;
}

// ─────────────────────────────────────────────
// CONFIRM ORDER VIA WHATSAPP
// ─────────────────────────────────────────────
function confirmOrderWhatsApp() {
  const name    = document.getElementById('cust-name').value.trim();
  const phone   = document.getElementById('cust-phone').value.trim();
  const address = document.getElementById('cust-address').value.trim();
  const note    = document.getElementById('cust-note').value.trim();

  if (!name || !phone || !address) {
    showToast('⚠️ Please fill in Name, Phone, and Address.', 'error');
    return;
  }

  const items    = window._orderItems || [];
  const subtotal = window._orderSubtotal || 0;
  const grand    = subtotal + deliveryCharge;

  let itemLines = items.map(i =>
    `   • ${i.name}: ${i.qty} kg × ₹${i.price} = ₹${(i.qty * i.price).toFixed(0)}`
  ).join('\n');

  const msg =
    `🌿 *PA KA Vegetables – Order Confirmation*\n\n` +
    `👤 Name: ${name}\n` +
    `📞 Phone: ${phone}\n` +
    `📍 Address: ${address}\n` +
    (note ? `📝 Note: ${note}\n` : '') +
    `\n🛒 *Items:*\n${itemLines}\n\n` +
    `💰 Subtotal: ₹${subtotal.toFixed(0)}\n` +
    `🚚 Delivery: ${deliveryCharge === 0 ? 'Free' : '₹' + deliveryCharge}\n` +
    `🧾 *Total: ₹${grand.toFixed(0)}*\n\n` +
    `⚠️ Confirmed orders cannot be cancelled.\n` +
    `Thank you! 🙏`;

  window.open(`https://wa.me/919789460493?text=${encodeURIComponent(msg)}`, '_blank');
  showToast('Opening WhatsApp with your order…');
}

// ─────────────────────────────────────────────
// UTILITY
// ─────────────────────────────────────────────
function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ─────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // If user arrives from main page with a cart item stored in sessionStorage
  // (main.js can store selected items before redirecting to /order)
  loadOrder();
});
