// ===== products.js =====
/**
 * Product Catalog
 * Live data is fetched from the backend API (MongoDB via Render).
 */

const API_BASE_URL = "https://stackblitz-zentra-client-0.onrender.com/api";

/** Format price in Indian Rupees */
function formatPrice(amount) {
  return '₹' + amount.toLocaleString('en-IN');
}

/** Live products fetched from the backend database */
let LIVE_PRODUCTS = [];

/** Find product by ID (works with MongoDB _id or local id) */
function getProductById(id) {
  return LIVE_PRODUCTS.find(p => p._id === id || p.id === id) || null;
}

/** Filter products by category and search query */
function filterProducts(category, query) {
  let filtered = LIVE_PRODUCTS;

  if (category && category !== 'all') {
    filtered = filtered.filter(p => p.category === category);
  }

  if (query && query.trim()) {
    const q = query.trim().toLowerCase();
    filtered = filtered.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      (p.categoryLabel && p.categoryLabel.toLowerCase().includes(q)) ||
      (p.category && p.category.replace(/_/g, ' ').includes(q))
    );
  }

  return filtered;
}


// ===== whatsapp.js =====
/**
 * WhatsApp Integration Module
 * Configure phone number and community link below for production use.
 */

const WhatsAppConfig = {
  // Merchant WhatsApp number (with country code, no + or spaces)
  phoneNumber: '919876543210',

  // Optional: WhatsApp community/group invite link
  communityLink: '',

  // Shop name for message templates
  shopName: 'Maas Trends'
};

/**
 * Build a WhatsApp chat URL with pre-filled message
 * @param {string} message - Pre-filled message text
 * @returns {string} WhatsApp deep link URL
 */
function getWhatsAppUrl(message) {
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${WhatsAppConfig.phoneNumber}?text=${encoded}`;
}

/**
 * Open WhatsApp inquiry chat
 * @param {string} [customMessage] - Optional custom message
 */
function openWhatsAppInquiry(customMessage) {
  const message = customMessage || `Hi ${WhatsAppConfig.shopName}! I'd like to inquire about your products.`;
  window.open(getWhatsAppUrl(message), '_blank', 'noopener');
}

/**
 * Open WhatsApp community/group link (falls back to inquiry chat)
 */
function openWhatsAppCommunity() {
  if (WhatsAppConfig.communityLink) {
    window.open(WhatsAppConfig.communityLink, '_blank', 'noopener');
  } else {
    openWhatsAppInquiry();
  }
}

/**
 * Build order confirmation message for WhatsApp notification
 * @param {Object} order - Order object
 * @returns {string} Formatted order message
 */
function buildOrderConfirmationMessage(order) {
  const items = order.items.map(item =>
    `• ${item.name} (Size: ${item.size}) × ${item.quantity} — ${formatPrice(item.price * item.quantity)}`
  ).join('\n');

  const address = [
    order.customer.houseNo,
    order.customer.street,
    order.customer.area,
    order.customer.city,
    order.customer.state,
    order.customer.postalCode,
    order.customer.country
  ].filter(Boolean).join(', ');

  return [
    `🛍️ *New Order — ${WhatsAppConfig.shopName}*`,
    ``,
    `*Order ID:* ${order.orderId}`,
    `*Date:* ${order.date}`,
    ``,
    `*Items:*`,
    items,
    ``,
    `*Subtotal:* ${formatPrice(order.subtotal)}`,
    `*Shipping:* ${formatPrice(order.shipping)}`,
    `*Total:* ${formatPrice(order.total)}`,
    ``,
    `*Customer Details:*`,
    `Name: ${order.customer.fullName}`,
    `Phone: ${order.customer.mobile}`,
    `Email: ${order.customer.email}`,
    `Address: ${address}`,
    order.customer.landmark ? `Landmark: ${order.customer.landmark}` : '',
    ``,
    `*Payment:* ${order.paymentMethod} — Confirmed ✅`
  ].filter(line => line !== '').join('\n');
}

/**
 * Trigger WhatsApp order confirmation workflow
 * Opens WhatsApp with order details — ready for backend webhook integration
 * @param {Object} order - Complete order object
 */
function sendOrderWhatsAppConfirmation(order) {
  const message = buildOrderConfirmationMessage(order);

  // Future backend integration point:
  // await fetch('/api/orders/whatsapp-notify', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ orderId: order.orderId, message, customerPhone: order.customer.mobile })
  // });

  // For now, open WhatsApp with order summary (merchant receives notification)
  window.open(getWhatsAppUrl(message), '_blank', 'noopener');

  // Also prepare customer-facing confirmation message
  const customerMessage = [
    `Hi ${order.customer.fullName}! 🎉`,
    ``,
    `Your order *${order.orderId}* at ${WhatsAppConfig.shopName} has been confirmed!`,
    `Total: ${formatPrice(order.total)}`,
    ``,
    `We'll process your order and update you on delivery.`,
    `Thank you for shopping with us! 💚`
  ].join('\n');

  // Store for potential automated customer notification via backend
  order.whatsappCustomerMessage = customerMessage;
  order.whatsappMerchantMessage = message;
}

/**
 * Initialize WhatsApp floating button and contact buttons
 */
function initWhatsApp() {
  const floatBtn = document.getElementById('whatsappFloat');
  const contactBtn = document.getElementById('contactWhatsAppBtn');

  if (floatBtn) {
    floatBtn.addEventListener('click', (e) => {
      e.preventDefault();
      openWhatsAppCommunity();
    });
  }

  if (contactBtn) {
    contactBtn.addEventListener('click', (e) => {
      e.preventDefault();
      openWhatsAppInquiry();
    });
  }
}


// ===== cart.js =====
/**
 * Shopping Cart Module
 * Uses localStorage for persistence — no login required
 */

const CART_STORAGE_KEY = 'maastrends_cart';

/** @type {Array} */
let cart = [];

/**
 * Load cart from localStorage
 */
function loadCart() {
  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    cart = stored ? JSON.parse(stored) : [];
  } catch {
    cart = [];
  }
  updateCartUI();
}

/**
 * Save cart to localStorage
 */
function saveCart() {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  updateCartUI();
}

/**
 * Add item to cart
 * @param {Object} item - { id, name, price, size, quantity, image }
 */
function addToCart(item) {
  const existing = cart.find(
    c => c.id === item.id && c.size === item.size
  );

  if (existing) {
    existing.quantity += item.quantity;
  } else {
    cart.push({ ...item });
  }

  saveCart();
  showToast(`${item.name} added to cart`);
}

/**
 * Remove item from cart by index
 * @param {number} index
 */
function removeFromCart(index) {
  cart.splice(index, 1);
  saveCart();
}

/**
 * Get cart items
 * @returns {Array}
 */
function getCartItems() {
  return cart;
}

/**
 * Get cart total amount
 * @returns {number}
 */
function getCartTotal() {
  return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

/**
 * Get total item count
 * @returns {number}
 */
function getCartCount() {
  return cart.reduce((sum, item) => sum + item.quantity, 0);
}

/**
 * Clear cart after successful order
 */
function clearCart() {
  cart = [];
  saveCart();
}

/**
 * Update cart badge count and sidebar contents
 */
function updateCartUI() {
  const countEl = document.getElementById('cartCount');
  const itemsEl = document.getElementById('cartItems');
  const emptyEl = document.getElementById('cartEmpty');
  const footerEl = document.getElementById('cartFooter');
  const totalEl = document.getElementById('cartTotal');

  const count = getCartCount();

  if (countEl) {
    countEl.textContent = count;
    if (count > 0) {
      countEl.classList.add('bump');
      setTimeout(() => countEl.classList.remove('bump'), 300);
    }
  }

  if (!itemsEl) return;

  if (cart.length === 0) {
    emptyEl.hidden = false;
    itemsEl.innerHTML = '';
    footerEl.hidden = true;
    return;
  }

  emptyEl.hidden = true;
  footerEl.hidden = false;

  itemsEl.innerHTML = cart.map((item, index) => `
    <li class="cart-item">
      <img class="cart-item__image" src="${item.image}" alt="${item.name}" loading="lazy">
      <div class="cart-item__info">
        <p class="cart-item__name">${item.name}</p>
        <p class="cart-item__meta">Size: ${item.size} · Qty: ${item.quantity}</p>
        <p class="cart-item__price">${formatPrice(item.price * item.quantity)}</p>
        <button class="cart-item__remove" data-remove-index="${index}">Remove</button>
      </div>
    </li>
  `).join('');

  if (totalEl) {
    totalEl.textContent = formatPrice(getCartTotal());
  }

  // Bind remove buttons
  itemsEl.querySelectorAll('[data-remove-index]').forEach(btn => {
    btn.addEventListener('click', () => {
      removeFromCart(parseInt(btn.dataset.removeIndex, 10));
    });
  });
}

/**
 * Open cart sidebar
 */
function openCart() {
  const sidebar = document.getElementById('cartSidebar');
  const overlay = document.getElementById('cartOverlay');
  sidebar.hidden = false;
  overlay.hidden = false;
  requestAnimationFrame(() => {
    sidebar.classList.add('open');
    overlay.classList.add('visible');
  });
  document.body.style.overflow = 'hidden';
}

/**
 * Close cart sidebar
 */
function closeCart() {
  const sidebar = document.getElementById('cartSidebar');
  const overlay = document.getElementById('cartOverlay');
  sidebar.classList.remove('open');
  overlay.classList.remove('visible');
  document.body.style.overflow = '';
  setTimeout(() => {
    sidebar.hidden = true;
    overlay.hidden = true;
  }, 300);
}

/**
 * Initialize cart event listeners
 */
function initCart() {
  loadCart();

  document.getElementById('cartBtn')?.addEventListener('click', openCart);
  document.getElementById('cartClose')?.addEventListener('click', closeCart);
  document.getElementById('cartOverlay')?.addEventListener('click', closeCart);
  document.getElementById('cartCheckoutBtn')?.addEventListener('click', () => {
    closeCart();
    openCheckout();
  });
}


// ===== checkout.js =====
/**
 * Checkout & Order Confirmation Module
 */

/** @type {Object|null} Current checkout item for Buy Now flow */
let buyNowItem = null;

/** Shipping cost */
const SHIPPING_COST = 99;

/**
 * Razorpay Key ID (publishable — safe to expose in client-side code).
 * Get yours from the Razorpay Dashboard → Account & Settings → API Keys.
 * Use the rzp_test_... key while testing, then switch to rzp_live_... to go live.
 * NEVER put your Key Secret anywhere in this file — it is not needed client-side.
 */
const RAZORPAY_KEY_ID = 'rzp_test_XXXXXXXXXXXXXX'; // TODO: replace with your real Razorpay Key ID

/** Maps our payment method values to Razorpay's checkout "method" pre-selection */
const RAZORPAY_METHOD_MAP = {
  upi: 'upi',
  card: 'card',
  emi: 'emi',
  netbanking: 'netbanking'
};

/**
 * Generate unique order ID
 * @returns {string}
 */
function generateOrderId() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `MT-${timestamp}-${random}`;
}

/**
 * Open checkout modal
 * @param {Object|null} singleItem - For Buy Now, pass a single cart item
 */
function openCheckout(singleItem) {
  buyNowItem = singleItem || null;
  const modal = document.getElementById('checkoutModal');
  renderOrderSummary();
  updatePaymentAmount();
  modal.hidden = false;
  document.body.style.overflow = 'hidden';
}

/**
 * Close checkout modal
 */
function closeCheckout() {
  const modal = document.getElementById('checkoutModal');
  modal.hidden = true;
  buyNowItem = null;
  if (!isAnyModalOpen()) {
    document.body.style.overflow = '';
  }
}

/**
 * Get items for current checkout session
 * @returns {Array}
 */
function getCheckoutItems() {
  return buyNowItem ? [buyNowItem] : getCartItems();
}

/**
 * Render order summary in checkout modal
 */
function renderOrderSummary() {
  const summaryEl = document.getElementById('orderSummary');
  const items = getCheckoutItems();

  if (!items.length) {
    summaryEl.innerHTML = '<p>No items in order.</p>';
    return;
  }

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = subtotal + SHIPPING_COST;

  const itemsHtml = items.map(item => `
    <div class="order-summary__item">
      <div>
        <div class="order-summary__item-name">${item.name}</div>
        <div class="order-summary__item-meta">Size: ${item.size} · Qty: ${item.quantity}</div>
      </div>
      <span>${formatPrice(item.price * item.quantity)}</span>
    </div>
  `).join('');

  summaryEl.innerHTML = `
    ${itemsHtml}
    <div class="order-summary__row">
      <span>Subtotal</span>
      <span>${formatPrice(subtotal)}</span>
    </div>
    <div class="order-summary__row">
      <span>Shipping</span>
      <span>${formatPrice(SHIPPING_COST)}</span>
    </div>
    <div class="order-summary__total">
      <span>Total</span>
      <span>${formatPrice(total)}</span>
    </div>
  `;
}

/**
 * Update the "Proceed to Pay" button amount + label based on selected method
 */
function updatePaymentAmount() {
  const items = getCheckoutItems();
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = subtotal + SHIPPING_COST;
  const amountEl = document.getElementById('placeOrderAmount');
  if (amountEl) amountEl.textContent = formatPrice(total);
  updatePlaceOrderButtonLabel();
}

/**
 * Swap the submit button's leading text depending on whether the
 * selected method is an online payment or Cash on Delivery
 */
function updatePlaceOrderButtonLabel() {
  const btn = document.getElementById('placeOrderBtn');
  const amountEl = document.getElementById('placeOrderAmount');
  if (!btn || !amountEl) return;
  const selected = document.querySelector('input[name="paymentMethod"]:checked')?.value || 'upi';
  const prefix = selected === 'cod' ? 'Place Order — Pay on Delivery ' : 'Proceed to Pay ';
  btn.childNodes[0].textContent = prefix;
}

/**
 * Validate checkout form fields
 * @param {HTMLFormElement} form
 * @returns {boolean}
 */
function validateCheckoutForm(form) {
  let valid = true;
  const requiredFields = form.querySelectorAll('[required]');

  requiredFields.forEach(field => {
    if (!field.value.trim()) {
      field.classList.add('error');
      valid = false;
    } else {
      field.classList.remove('error');
    }
  });

  // Email validation
  const email = form.querySelector('#email');
  if (email && email.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
    email.classList.add('error');
    valid = false;
  }

  // Mobile validation (basic)
  const mobile = form.querySelector('#mobile');
  if (mobile && mobile.value && !/^[\d\s+\-()]{10,15}$/.test(mobile.value)) {
    mobile.classList.add('error');
    valid = false;
  }

  return valid;
}

/**
 * Collect customer details from form
 * @param {HTMLFormElement} form
 * @returns {Object}
 */
function collectCustomerDetails(form) {
  const fd = new FormData(form);
  return {
    fullName: fd.get('fullName'),
    mobile: fd.get('mobile'),
    email: fd.get('email'),
    houseNo: fd.get('houseNo'),
    street: fd.get('street'),
    area: fd.get('area'),
    city: fd.get('city'),
    state: fd.get('state'),
    postalCode: fd.get('postalCode'),
    country: fd.get('country'),
    landmark: fd.get('landmark') || ''
  };
}

/**
 * Get payment method label
 * @param {string} value
 * @returns {string}
 */
function getPaymentMethodLabel(value) {
  const labels = {
    upi: 'UPI',
    card: 'Credit / Debit Card',
    emi: 'EMI',
    netbanking: 'Net Banking',
    cod: 'Cash on Delivery'
  };
  return labels[value] || value;
}

/**
 * Process order placement: validates the form, builds the order object,
 * then either sends the customer to Razorpay (online methods) or
 * finalizes the order immediately (Cash on Delivery)
 * @param {HTMLFormElement} form
 */
function placeOrder(form) {
  if (!validateCheckoutForm(form)) {
    showToast('Please fill in all required fields correctly.');
    return;
  }

  const items = getCheckoutItems();
  if (!items.length) {
    showToast('Your cart is empty.');
    return;
  }

  const customer = collectCustomerDetails(form);
  const paymentMethod = form.querySelector('input[name="paymentMethod"]:checked')?.value || 'upi';
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const order = {
    orderId: generateOrderId(),
    date: new Date().toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }),
    items: items.map(item => ({ ...item })),
    customer,
    paymentMethodKey: paymentMethod,
    paymentMethod: getPaymentMethodLabel(paymentMethod),
    subtotal,
    shipping: SHIPPING_COST,
    total: subtotal + SHIPPING_COST,
    status: paymentMethod === 'cod' ? 'confirmed' : 'pending'
  };

  if (paymentMethod === 'cod') {
    finalizeOrder(order, form);
  } else {
    payWithRazorpay(order, form);
  }
}

/**
 * Open Razorpay's secure checkout for online payment methods
 * (UPI, Card, EMI, Net Banking). Finalizes the order only after
 * Razorpay confirms a successful payment.
 * @param {Object} order
 * @param {HTMLFormElement} form
 */
function payWithRazorpay(order, form) {
  if (typeof Razorpay === 'undefined') {
    showToast('Payment gateway failed to load. Check your connection and try again.');
    return;
  }

  const btn = document.getElementById('placeOrderBtn');
  if (btn) btn.disabled = true;

  const options = {
    key: RAZORPAY_KEY_ID,
    amount: Math.round(order.total * 100), // amount in paise
    currency: 'INR',
    name: 'Maas Trends',
    description: `Order ${order.orderId} — ${order.items.length} item(s)`,
    method: RAZORPAY_METHOD_MAP[order.paymentMethodKey] || undefined,
    prefill: {
      name: order.customer.fullName,
      email: order.customer.email,
      contact: order.customer.mobile
    },
    notes: {
      orderId: order.orderId
    },
    theme: { color: '#0F4C4A' },
    handler: function (response) {
      order.status = 'paid';
      order.razorpayPaymentId = response.razorpay_payment_id;
      finalizeOrder(order, form);
    },
    modal: {
      ondismiss: function () {
        if (btn) btn.disabled = false;
        showToast('Payment cancelled. Your order has not been placed yet.');
      }
    }
  };

  const rzp = new Razorpay(options);
  rzp.on('payment.failed', function (response) {
    if (btn) btn.disabled = false;
    showToast('Payment failed: ' + (response.error?.description || 'please try again.'));
  });
  rzp.open();
}

/**
 * Persist the order, send the WhatsApp confirmation, clear the cart
 * and show the on-screen confirmation. Runs after a successful
 * payment (or immediately for Cash on Delivery).
 * @param {Object} order
 * @param {HTMLFormElement} form
 */
function finalizeOrder(order, form) {
  const btn = document.getElementById('placeOrderBtn');
  if (btn) btn.disabled = false;

  // Future backend integration point:
  // const response = await fetch('/api/orders', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(order)
  // });

  // Store order locally for reference
  try {
    const orders = JSON.parse(localStorage.getItem('maastrends_orders') || '[]');
    orders.push(order);
    localStorage.setItem('maastrends_orders', JSON.stringify(orders));
  } catch { /* silent */ }

  // Trigger WhatsApp confirmation
  sendOrderWhatsAppConfirmation(order);

  // Clear cart if not buy-now-only
  if (!buyNowItem) {
    clearCart();
  }
  buyNowItem = null;

  closeCheckout();
  showOrderConfirmation(order);
  form.reset();
  document.getElementById('country').value = 'India';
}

/**
 * Show order confirmation modal
 * @param {Object} order
 */
function showOrderConfirmation(order) {
  const modal = document.getElementById('confirmationModal');
  const content = document.getElementById('confirmationContent');

  const address = [
    order.customer.houseNo,
    order.customer.street,
    order.customer.area,
    order.customer.city,
    order.customer.state,
    order.customer.postalCode,
    order.customer.country
  ].filter(Boolean).join(', ');

  const itemsHtml = order.items.map(item =>
    `<li>${item.name} — Size: ${item.size}, Qty: ${item.quantity} — ${formatPrice(item.price * item.quantity)}</li>`
  ).join('');

  content.innerHTML = `
    <div class="confirmation__icon">
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <path d="M20 6L9 17l-5-5"/>
      </svg>
    </div>
    <h2 class="confirmation__title">Order Successful!</h2>
    <p class="confirmation__subtitle">Thank you for shopping with Maas Trends</p>

    <div class="confirmation__whatsapp-msg">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
      </svg>
      <p>Your order has been placed successfully. You will receive a WhatsApp confirmation message shortly.</p>
    </div>

    <div class="confirmation__section">
      <h4>Order ID</h4>
      <p class="confirmation__order-id">${order.orderId}</p>
    </div>

    <div class="confirmation__section">
      <h4>Order Summary</h4>
      <ul>${itemsHtml}</ul>
      <p style="margin-top: 0.5rem; font-weight: 600;">Total: ${formatPrice(order.total)} (incl. shipping)</p>
      <p>Payment: ${order.paymentMethod} — ${order.paymentMethodKey === 'cod' ? 'To be collected on delivery' : 'Paid'}${order.razorpayPaymentId ? ` (Ref: ${order.razorpayPaymentId})` : ''}</p>
    </div>

    <div class="confirmation__section">
      <h4>Delivery Details</h4>
      <p><strong>${order.customer.fullName}</strong></p>
      <p>${order.customer.mobile} · ${order.customer.email}</p>
      <p>${address}</p>
      ${order.customer.landmark ? `<p>Landmark: ${order.customer.landmark}</p>` : ''}
    </div>

    <button class="btn btn--primary btn--full" data-close-modal style="margin-top: 1rem;">
      Continue Shopping
    </button>
  `;

  modal.hidden = false;
  document.body.style.overflow = 'hidden';
}

/**
 * Check if any modal is currently open
 * @returns {boolean}
 */
function isAnyModalOpen() {
  return document.querySelectorAll('.modal:not([hidden])').length > 0;
}

/**
 * Initialize the Flipkart/Amazon-style payment method accordion:
 * clicking or pressing Enter/Space on a row selects that method,
 * expands its panel, and collapses any other open panel.
 */
function initPaymentAccordion() {
  const accordion = document.getElementById('paymentAccordion');
  if (!accordion) return;
  const items = accordion.querySelectorAll('.payment-item');

  function selectItem(item) {
    items.forEach(i => {
      const isTarget = i === item;
      i.classList.toggle('open', isTarget);
      i.querySelector('input[type="radio"]').checked = isTarget;
      i.querySelector('[data-toggle]').setAttribute('aria-checked', isTarget);
    });
    updatePlaceOrderButtonLabel();
  }

  items.forEach(item => {
    const row = item.querySelector('[data-toggle]');
    row.addEventListener('click', () => selectItem(item));
    row.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        selectItem(item);
      }
    });
  });
}

/**
 * Initialize checkout module
 */
function initCheckout() {
  const form = document.getElementById('checkoutForm');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      placeOrder(form);
    });

    // Clear error state on input
    form.querySelectorAll('input, textarea').forEach(field => {
      field.addEventListener('input', () => field.classList.remove('error'));
    });
  }
  initPaymentAccordion();
}


// ===== app.js =====
/**
 * Main Application Module
 * Handles UI rendering, navigation, modals, search, and scroll animations
 */

/** Current active category filter */
let activeCategory = 'all';

/** Current search query */
let searchQuery = '';

/** Currently viewed product in detail modal */
let currentProduct = null;

/** Selected size and quantity in product detail */
let selectedSize = '';
let selectedQuantity = 1;

// ==========================================
// TOAST NOTIFICATIONS
// ==========================================

/**
 * Show a toast notification message
 * @param {string} message
 * @param {number} duration - Display duration in ms
 */
function showToast(message, duration = 3000) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.hidden = false;
  requestAnimationFrame(() => toast.classList.add('show'));
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => { toast.hidden = true; }, 300);
  }, duration);
}

// ==========================================
// PRODUCT GRID RENDERING
// ==========================================

/**
 * Render product cards in the grid
 */
/**
 * Render product cards in the grid (fetches live data on first call)
 */
async function renderProducts() {
  const grid = document.getElementById('productGrid');
  const noResults = document.getElementById('noResults');

  // Fetch from the live backend once, then reuse the cached list for filtering
  if (LIVE_PRODUCTS.length === 0) {
    try {
      grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 2rem;">Loading premium collections...</div>';

      const response = await fetch(`${API_BASE_URL}/products`);
      if (!response.ok) throw new Error('Failed to fetch products');

      LIVE_PRODUCTS = await response.json();
    } catch (error) {
      console.error('Error fetching live products:', error);
      grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: red; padding: 2rem;">Unable to load items. Please try again later.</div>';
      return;
    }
  }

  const products = filterProducts(activeCategory, searchQuery);

  if (!products.length) {
    grid.innerHTML = '';
    noResults.hidden = false;
    return;
  }

  noResults.hidden = true;

  grid.innerHTML = products.map(product => {
    const productId = product._id || product.id;
    const mainImage = Array.isArray(product.images) ? product.images[0] : (product.image || '');
    const sizesList = Array.isArray(product.sizes) ? product.sizes.join(', ') : 'Free Size';

    return `
    <article class="product-card reveal" role="listitem" data-product-id="${productId}">
      <div class="product-card__image-wrap">
        <img class="product-card__image" src="${mainImage}" alt="${product.name}" loading="lazy">
        <span class="product-card__category">${product.categoryLabel || product.category}</span>
      </div>
      <div class="product-card__body">
        <h3 class="product-card__name">${product.name}</h3>
        <p class="product-card__desc">${product.description}</p>
        <p class="product-card__sizes">Sizes: ${sizesList}</p>
        <div class="product-card__footer">
          <span class="product-card__price">${formatPrice(product.price)}</span>
          <button class="btn btn--secondary btn--sm" data-add-cart="${productId}">
            Add to Cart
          </button>
        </div>
      </div>
    </article>
  `;
  }).join('');

  // Bind card click events
  grid.querySelectorAll('.product-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('[data-add-cart]')) return;
      openProductModal(card.dataset.productId);
    });
  });

  // Bind add-to-cart from card buttons
  grid.querySelectorAll('[data-add-cart]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const product = getProductById(btn.dataset.addCart);
      if (product) {
        const productId = product._id || product.id;
        const mainImage = Array.isArray(product.images) ? product.images[0] : (product.image || '');
        const firstSize = Array.isArray(product.sizes) ? product.sizes[0] : 'Free Size';
        addToCart({
          id: productId,
          name: product.name,
          price: product.price,
          size: firstSize,
          quantity: 1,
          image: mainImage
        });
      }
    });
  });

  observeRevealElements();
}

// ==========================================
// PRODUCT DETAIL MODAL
// ==========================================

/**
 * Open product detail modal
 * @param {string} productId
 */
function openProductModal(productId) {
  const product = getProductById(productId);
  if (!product) return;

  // Normalize fields so the rest of this function works for both
  // local PRODUCTS-style data and live MongoDB data
  const productImages = Array.isArray(product.images) ? product.images : (product.image ? [product.image] : []);
  const productSizes = Array.isArray(product.sizes) && product.sizes.length ? product.sizes : ['Free Size'];
  const productPid = product._id || product.id;

  currentProduct = product;
  selectedSize = productSizes[0];
  selectedQuantity = 1;

  const detailEl = document.getElementById('productDetail');
  detailEl.innerHTML = `
    <div class="product-detail__gallery">
      <div class="product-detail__main-image">
        <img id="mainProductImage" src="${productImages[0] || ''}" alt="${product.name}">
      </div>
      ${productImages.length > 1 ? `
        <div class="product-detail__thumbs">
          ${productImages.map((img, i) => `
            <button class="product-detail__thumb ${i === 0 ? 'active' : ''}" data-thumb-index="${i}" aria-label="View image ${i + 1}">
              <img src="${img}" alt="${product.name} thumbnail ${i + 1}">
            </button>
          `).join('')}
        </div>
      ` : ''}
    </div>
    <div class="product-detail__info">
      <span class="product-detail__category">${product.categoryLabel || product.category}</span>
      <h2 class="product-detail__title" id="productModalTitle">${product.name}</h2>
      <p class="product-detail__price">${formatPrice(product.price)}</p>
      <p class="product-detail__desc">${product.description}</p>

      <div>
        <p class="product-detail__sizes-label">Select Size</p>
        <div class="size-options" id="sizeOptions">
          ${productSizes.map(size => `
            <button class="size-option ${size === selectedSize ? 'selected' : ''}" data-size="${size}">${size}</button>
          `).join('')}
        </div>
      </div>

      <div>
        <p class="product-detail__qty-label">Quantity</p>
        <div class="quantity-selector">
          <button type="button" id="qtyDecrease" aria-label="Decrease quantity">−</button>
          <input type="number" id="qtyInput" value="1" min="1" max="10" readonly aria-label="Quantity">
          <button type="button" id="qtyIncrease" aria-label="Increase quantity">+</button>
        </div>
      </div>

      <div class="product-detail__actions">
        <button class="btn btn--primary" id="detailAddToCart">Add to Cart</button>
        <button class="btn btn--gold" id="detailBuyNow">Buy Now</button>
      </div>
    </div>
  `;

  // Thumbnail gallery
  detailEl.querySelectorAll('[data-thumb-index]').forEach(thumb => {
    thumb.addEventListener('click', () => {
      const index = parseInt(thumb.dataset.thumbIndex, 10);
      document.getElementById('mainProductImage').src = productImages[index];
      detailEl.querySelectorAll('.product-detail__thumb').forEach(t => t.classList.remove('active'));
      thumb.classList.add('active');
    });
  });

  // Size selection
  detailEl.querySelectorAll('.size-option').forEach(btn => {
    btn.addEventListener('click', () => {
      selectedSize = btn.dataset.size;
      detailEl.querySelectorAll('.size-option').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
    });
  });

  // Quantity controls
  document.getElementById('qtyDecrease')?.addEventListener('click', () => {
    if (selectedQuantity > 1) {
      selectedQuantity--;
      document.getElementById('qtyInput').value = selectedQuantity;
    }
  });

  document.getElementById('qtyIncrease')?.addEventListener('click', () => {
    if (selectedQuantity < 10) {
      selectedQuantity++;
      document.getElementById('qtyInput').value = selectedQuantity;
    }
  });

  // Add to Cart
  document.getElementById('detailAddToCart')?.addEventListener('click', () => {
    addToCart({
      id: productPid,
      name: product.name,
      price: product.price,
      size: selectedSize,
      quantity: selectedQuantity,
      image: productImages[0] || ''
    });
  });

  // Buy Now
  document.getElementById('detailBuyNow')?.addEventListener('click', () => {
    closeProductModal();
    openCheckout({
      id: productPid,
      name: product.name,
      price: product.price,
      size: selectedSize,
      quantity: selectedQuantity,
      image: productImages[0] || ''
    });
  });


  const modal = document.getElementById('productModal');
  modal.hidden = false;
  document.body.style.overflow = 'hidden';
}

/**
 * Close product detail modal
 */
function closeProductModal() {
  const modal = document.getElementById('productModal');
  modal.hidden = true;
  currentProduct = null;
  if (!isAnyModalOpen()) {
    document.body.style.overflow = '';
  }
}

// ==========================================
// MODAL MANAGEMENT
// ==========================================

/**
 * Close all modals
 */
function closeAllModals() {
  document.querySelectorAll('.modal').forEach(modal => {
    modal.hidden = true;
  });
  document.body.style.overflow = '';
}

/**
 * Initialize modal close handlers
 */
function initModals() {
  document.querySelectorAll('[data-close-modal]').forEach(el => {
    el.addEventListener('click', () => {
      const modal = el.closest('.modal');
      if (modal) {
        modal.hidden = true;
        if (!isAnyModalOpen()) {
          document.body.style.overflow = '';
        }
      }
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeAllModals();
      closeCart();
    }
  });
}

// ==========================================
// NAVIGATION
// ==========================================

/**
 * Initialize smooth scroll navigation
 */
function initNavigation() {
  const header = document.getElementById('header');
  const nav = document.getElementById('nav');
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.querySelectorAll('.nav__link');

  // Header scroll effect
  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 20);
    updateActiveNavLink();
  }, { passive: true });

  // Mobile nav toggle
  navToggle?.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('open');
    navToggle.classList.toggle('active', isOpen);
    navToggle.setAttribute('aria-expanded', isOpen);
  });

  // Smooth scroll for all anchor links
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const targetId = link.getAttribute('href');
      if (targetId === '#') return;
      const target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        const offset = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--header-height'), 10) || 72;
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });

        // Close mobile nav
        nav?.classList.remove('open');
        navToggle?.classList.remove('active');
        navToggle?.setAttribute('aria-expanded', 'false');
      }
    });
  });

  // Update active nav link on click
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      navLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');
    });
  });
}

/**
 * Highlight active nav link based on scroll position
 */
function updateActiveNavLink() {
  const sections = ['home', 'collections', 'contact'];
  const headerHeight = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--header-height'), 10) || 72;
  let current = 'home';

  sections.forEach(id => {
    const section = document.getElementById(id);
    if (section) {
      const top = section.offsetTop - headerHeight - 100;
      if (window.scrollY >= top) {
        current = id;
      }
    }
  });

  document.querySelectorAll('.nav__link').forEach(link => {
    link.classList.toggle('active', link.dataset.section === current);
  });
}

// ==========================================
// SEARCH & FILTERS
// ==========================================

/**
 * Initialize search and category filter controls
 */
function initSearchAndFilters() {
  const searchInput = document.getElementById('searchInput');
  const searchClear = document.getElementById('searchClear');
  const filters = document.getElementById('categoryFilters');

  let debounceTimer;

  searchInput?.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      searchQuery = searchInput.value;
      searchClear.hidden = !searchQuery;
      renderProducts();
    }, 250);
  });

  searchClear?.addEventListener('click', () => {
    searchInput.value = '';
    searchQuery = '';
    searchClear.hidden = true;
    renderProducts();
    searchInput.focus();
  });

  filters?.querySelectorAll('.category-filter').forEach(btn => {
    btn.addEventListener('click', () => {
      activeCategory = btn.dataset.category;
      filters.querySelectorAll('.category-filter').forEach(b => {
        b.classList.toggle('active', b === btn);
        b.setAttribute('aria-selected', b === btn);
      });
      renderProducts();
    });
  });
}

// ==========================================
// CONTACT FORM
// ==========================================

/**
 * Initialize contact form with validation
 */
function initContactForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    let valid = true;

    const fields = {
      contactName: { el: document.getElementById('contactName'), error: document.getElementById('contactNameError'), check: v => v.trim().length > 0, msg: 'Name is required' },
      contactEmail: { el: document.getElementById('contactEmail'), error: document.getElementById('contactEmailError'), check: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), msg: 'Valid email is required' },
      contactPhone: { el: document.getElementById('contactPhone'), error: document.getElementById('contactPhoneError'), check: v => /^[\d\s+\-()]{10,15}$/.test(v), msg: 'Valid phone number is required' },
      contactMessage: { el: document.getElementById('contactMessage'), error: document.getElementById('contactMessageError'), check: v => v.trim().length > 0, msg: 'Message is required' }
    };

    Object.values(fields).forEach(({ el, error, check, msg }) => {
      if (!check(el.value)) {
        error.textContent = msg;
        el.classList.add('error');
        valid = false;
      } else {
        error.textContent = '';
        el.classList.remove('error');
      }
    });

    if (!valid) return;

    // Future backend integration:
    // await fetch('/api/contact', { method: 'POST', body: new FormData(form) });

    const successEl = document.getElementById('contactFormSuccess');
    successEl.hidden = false;
    form.reset();
    showToast('Message sent successfully!');

    // Optionally open WhatsApp with the inquiry
    const name = fields.contactName.el.value;
    const message = fields.contactMessage.el.value;
    setTimeout(() => {
      openWhatsAppInquiry(`Hi, I'm ${name}. ${message}`);
    }, 1500);
  });

  form.querySelectorAll('input, textarea').forEach(field => {
    field.addEventListener('input', () => field.classList.remove('error'));
  });
}

// ==========================================
// SCROLL REVEAL ANIMATIONS
// ==========================================

/** Intersection Observer for reveal animations */
let revealObserver;

/**
 * Observe elements with .reveal class for scroll animations
 */
function observeRevealElements() {
  if (!revealObserver) {
    revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
  }

  document.querySelectorAll('.reveal:not(.visible)').forEach(el => {
    revealObserver.observe(el);
  });
}

// ==========================================
// APP INITIALIZATION
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initModals();
  initCart();
  initCheckout();
  initWhatsApp();
  initSearchAndFilters();
  initContactForm();
  renderProducts();
  observeRevealElements();
});