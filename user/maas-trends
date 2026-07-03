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
 * @param {string} paymentMethod - Payment method label
 * @returns {string} Formatted order message
 */
function buildOrderConfirmationMessage(order, paymentMethod) {
  const s = order.shipping;
  const items = order.items.map(item =>
    `• ${item.name} × ${item.quantity} — ${formatPrice(item.subtotal)}`
  ).join('\n');
  const address = [s.addressLine1, s.addressLine2, s.city, s.state, s.pincode].filter(Boolean).join(', ');
  
  return [
    `🛍️ *New Order — ${WhatsAppConfig.shopName}*`,
    ``,
    `*Order ID:* ${order.orderNumber}`,
    ``,
    `*Items:*`,
    items,
    ``,
    `*Subtotal:* ${formatPrice(order.subtotal)}`,
    `*Total:* ${formatPrice(order.grandTotal)}`,
    ``,
    `*Customer Details:*`,
    `Name: ${s.fullName}`,
    `Phone: ${s.phone}`,
    s.email ? `Email: ${s.email}` : '',
    `Address: ${address}`,
    ``,
    `*Payment:* ${getPaymentMethodLabel(paymentMethod)}`
  ].filter(line => line !== '').join('\n');
}

/**
 * Trigger WhatsApp order confirmation workflow
 * Opens WhatsApp with order details — ready for backend webhook integration
 * @param {Object} order - Complete order object
 * @param {string} paymentMethod - Payment method key
 */
function sendOrderWhatsAppConfirmation(order, paymentMethod) {
  const message = buildOrderConfirmationMessage(order, paymentMethod);
  window.open(getWhatsAppUrl(message), '_blank', 'noopener');
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


// ===== cart.js (LIVE BACKEND VERSION) =====
/** * Shopping Cart Module 
 * Backend is the source of truth (guest cookie session) — no localStorage. 
 * `cart` holds server-shaped items: { product, name, image, price, stock, quantity, subtotal } 
 */
let cart = [];
let cartSubtotal = 0;

/** Load the cart from the backend (creates an empty guest cart if none exists) */
async function loadCart() {  
  try {    
    const res = await fetch(`${API_BASE_URL}/cart`, { credentials: 'include' });    
    const data = await res.json();    
    cart = data.items || [];    
    cartSubtotal = data.subtotal || 0;  
  } catch (err) {    
    console.error('Failed to load cart:', err);    
    cart = [];    
    cartSubtotal = 0;  
  }  
  updateCartUI();
}

/** * Add a product to the cart (or increase its quantity) 
 * @param {string} productId - Mongo _id of the product 
 * @param {number} quantity 
 * @param {string} [name] - used only for the toast message 
 */
async function addToCart(productId, quantity = 1, name = 'Item') {  
  try {    
    const res = await fetch(`${API_BASE_URL}/cart/items`, {      
      method: 'POST',      
      credentials: 'include',      
      headers: { 'Content-Type': 'application/json' },      
      body: JSON.stringify({ productId, quantity })    
    });    
    const data = await res.json();    
    if (!res.ok) {      
      showToast(data.error || 'Could not add item to cart.');      
      return;    
    }    
    cart = data.items;    
    cartSubtotal = data.subtotal;    
    updateCartUI();    
    showToast(`${name} added to cart`);  
  } catch (err) {    
    console.error('Add to cart failed:', err);    
    showToast('Could not reach the server. Please try again.');  
  }
}

/** Set an item's quantity (0 removes it) */
async function updateCartItemQty(productId, quantity) {  
  try {    
    const res = await fetch(`${API_BASE_URL}/cart/items/${productId}`, {      
      method: 'PUT',      
      credentials: 'include',      
      headers: { 'Content-Type': 'application/json' },      
      body: JSON.stringify({ quantity })    
    });    
    const data = await res.json();    
    if (!res.ok) {      
      showToast(data.error || 'Could not update cart.');      
      return;    
    }    
    cart = data.items;    
    cartSubtotal = data.subtotal;    
    updateCartUI();  
  } catch (err) {    
    console.error('Update cart failed:', err);    
    showToast('Could not reach the server. Please try again.');  
  }
}

/** Remove a single item from the cart */
async function removeFromCart(productId) {  
  try {    
    const res = await fetch(`${API_BASE_URL}/cart/items/${productId}`, {      
      method: 'DELETE',      
      credentials: 'include'    
    });    
    const data = await res.json();    
    cart = data.items || [];    
    cartSubtotal = data.subtotal || 0;    
    updateCartUI();  
  } catch (err) {    
    console.error('Remove from cart failed:', err);    
    showToast('Could not reach the server. Please try again.');  
  }
}

function getCartItems() { return cart; }
function getCartTotal() { return cartSubtotal; }
function getCartCount() { return cart.reduce((sum, item) => sum + item.quantity, 0); }

/** Clear cart on the server (used after a successful checkout) */
async function clearCart() {  
  try {    
    await fetch(`${API_BASE_URL}/cart`, { method: 'DELETE', credentials: 'include' });  
  } catch (err) {    
    console.error('Clear cart failed:', err);  
  }  
  cart = [];  
  cartSubtotal = 0;  
  updateCartUI();
}

/** Update cart badge count and sidebar contents */
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
  itemsEl.innerHTML = cart.map(item => `    
    <li class="cart-item">      
      <img class="cart-item__image" src="${item.image}" alt="${item.name}" loading="lazy">      
      <div class="cart-item__info">        
        <p class="cart-item__name">${item.name}</p>        
        <p class="cart-item__meta">Qty: ${item.quantity}</p>        
        <p class="cart-item__price">${formatPrice(item.subtotal)}</p>        
        <button class="cart-item__remove" data-remove-id="${item.product}">Remove</button>      
      </div>    
    </li>  
  `).join('');  
  
  if (totalEl) totalEl.textContent = formatPrice(getCartTotal());  
  
  itemsEl.querySelectorAll('[data-remove-id]').forEach(btn => {    
    btn.addEventListener('click', () => removeFromCart(btn.dataset.removeId));  
  });
}

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


// ===== checkout.js (LIVE BACKEND VERSION) =====
/** * Checkout & Order Confirmation Module 
 * Checkout always goes through the server-side cart (/api/orders/checkout). 
 * Razorpay is intentionally not wired yet (backend keys not decided) — only 
 * Cash on Delivery is live for now; online methods show a "coming soon" toast. 
 */

/** Shipping is currently free (backend shippingFee is always 0 for now) */
const SHIPPING_COST = 0;

/** * "Buy Now" from the product detail modal: add the item to the real cart, 
 * then open checkout. (The backend has no separate single-item checkout — 
 * checkout always reads the server cart — so Buy Now just fast-tracks into it.) 
 */
async function buyNow(productId, quantity, name) {  
  await addToCart(productId, quantity, name);  
  openCheckout();
}

/** Open checkout modal */
function openCheckout() {  
  const modal = document.getElementById('checkoutModal');  
  renderOrderSummary();  
  updatePaymentAmount();  
  modal.hidden = false;  
  document.body.style.overflow = 'hidden';
}

/** Close checkout modal */
function closeCheckout() {  
  const modal = document.getElementById('checkoutModal');  
  modal.hidden = true;  
  if (!isAnyModalOpen()) {    
    document.body.style.overflow = '';  
  }
}

/** Render order summary in checkout modal, from the live cart */
function renderOrderSummary() {  
  const summaryEl = document.getElementById('orderSummary');  
  const items = getCartItems();  
  if (!items.length) {    
    summaryEl.innerHTML = '<p>No items in order.</p>';    
    return;  
  }  
  const subtotal = getCartTotal();  
  const total = subtotal + SHIPPING_COST;  
  const itemsHtml = items.map(item => `    
    <div class="order-summary__item">      
      <div>        
        <div class="order-summary__item-name">${item.name}</div>        
        <div class="order-summary__item-meta">Qty: ${item.quantity}</div>      
      </div>      
      <span>${formatPrice(item.subtotal)}</span>    
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
      <span>${SHIPPING_COST > 0 ? formatPrice(SHIPPING_COST) : 'Free'}</span>    
    </div>    
    <div class="order-summary__total">      
      <span>Total</span>      
      <span>${formatPrice(total)}</span>    
    </div>  
  `;
}

function updatePaymentAmount() {  
  const total = getCartTotal() + SHIPPING_COST;  
  const amountEl = document.getElementById('placeOrderAmount');  
  if (amountEl) amountEl.textContent = formatPrice(total);  
  updatePlaceOrderButtonLabel();
}

function updatePlaceOrderButtonLabel() {  
  const btn = document.getElementById('placeOrderBtn');  
  const amountEl = document.getElementById('placeOrderAmount');  
  if (!btn || !amountEl) return;  
  const selected = document.querySelector('input[name="paymentMethod"]:checked')?.value || 'cod';  
  const prefix = selected === 'cod' ? 'Place Order — Pay on Delivery ' : 'Proceed to Pay ';  
  btn.childNodes[0].textContent = prefix;
}

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
  const email = form.querySelector('#email');  
  if (email && email.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {    
    email.classList.add('error');    
    valid = false;  
  }  
  const mobile = form.querySelector('#mobile');  
  if (mobile && mobile.value && !/^[\d\s+\-()]{10,15}$/.test(mobile.value)) {    
    mobile.classList.add('error');    
    valid = false;  
  }  
  return valid;
}

/** Collect customer details and map them to the backend's `shipping` shape */
function collectShippingDetails(form) {  
  const fd = new FormData(form);  
  return {    
    fullName: fd.get('fullName'),    
    phone: fd.get('mobile'),    
    email: fd.get('email') || '',    
    addressLine1: [fd.get('houseNo'), fd.get('street')].filter(Boolean).join(', '),    
    addressLine2: [fd.get('area'), fd.get('landmark')].filter(Boolean).join(', '),    
    city: fd.get('city'),    
    state: fd.get('state'),    
    pincode: fd.get('postalCode'),  
  };
}

function getPaymentMethodLabel(value) {  
  const labels = { cod: 'Cash on Delivery', upi: 'UPI', card: 'Credit / Debit Card', emi: 'EMI', netbanking: 'Net Banking' };  
  return labels[value] || value;
}

/** * Validate the form, then submit checkout straight to the backend. 
 * Online payment methods (UPI/Card/EMI/Net Banking) aren't wired to a 
 * payment gateway yet — only Cash on Delivery goes through for now. 
 */
async function placeOrder(form) {  
  if (!validateCheckoutForm(form)) {    
    showToast('Please fill in all required fields correctly.');    
    return;  
  }  
  const items = getCartItems();  
  if (!items.length) {    
    showToast('Your cart is empty.');    
    return;  
  }  
  const paymentMethod = form.querySelector('input[name="paymentMethod"]:checked')?.value || 'cod';  
  if (paymentMethod !== 'cod') {    
    showToast('Online payments are coming soon — please choose Cash on Delivery for now.');    
    return;  
  }  
  await finalizeOrder(form, paymentMethod);
}

/** * Submit the order to the real backend. The server re-reads the cart, 
 * re-validates price/stock, and creates the Order — nothing here is trusted 
 * client-side except the shipping form. 
 */
async function finalizeOrder(form, paymentMethod) {  
  const btn = document.getElementById('placeOrderBtn');  
  if (btn) btn.disabled = true;  
  const shipping = collectShippingDetails(form);  
  try {    
    const res = await fetch(`${API_BASE_URL}/orders/checkout`, {      
      method: 'POST',      
      credentials: 'include',      
      headers: { 'Content-Type': 'application/json' },      
      body: JSON.stringify({ shipping, paymentMethod })    
    });    
    const order = await res.json();    
    if (!res.ok) {      
      showToast(order.error || 'Could not place your order. Please try again.');      
      return;    
    }    
    
    // Local cart is now empty on the server too — sync the UI.    
    cart = [];    
    cartSubtotal = 0;    
    updateCartUI();    
    sendOrderWhatsAppConfirmation(order, paymentMethod);    
    closeCheckout();    
    showOrderConfirmation(order, paymentMethod);    
    form.reset();    
    document.getElementById('country').value = 'India';  
  } catch (err) {    
    console.error('Checkout failed:', err);    
    showToast('Could not reach the server. Please check your connection and try again.');  
  } finally {    
    if (btn) btn.disabled = false;  
  }
}

/** Show order confirmation modal, using the real Order document from the backend */
function showOrderConfirmation(order, paymentMethod) {  
  const modal = document.getElementById('confirmationModal');  
  const content = document.getElementById('confirmationContent');  
  const s = order.shipping;  
  const address = [s.addressLine1, s.addressLine2, s.city, s.state, s.pincode].filter(Boolean).join(', ');  
  const itemsHtml = order.items.map(item =>    
    `<li>${item.name} — Qty: ${item.quantity} — ${formatPrice(item.subtotal)}</li>`  
  ).join('');  
  content.innerHTML = `    
    <div class="confirmation__icon">      
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">        
        <path d="M20 6L9 17l-5-5"/>      
      </svg>    
    </div>    
    <h2 class="confirmation__title">Order Successful!</h2>    
    <p class="confirmation__subtitle">Thank you for shopping with Maas Trends</p>    
    <div class="confirmation__section">      
      <h4>Order ID</h4>      
      <p class="confirmation__order-id">${order.orderNumber}</p>    
    </div>    
    <div class="confirmation__section">      
      <h4>Order Summary</h4>      
      <ul>${itemsHtml}</ul>      
      <p style="margin-top: 0.5rem; font-weight: 600;">Total: ${formatPrice(order.grandTotal)}</p>      
      <p>Payment: ${getPaymentMethodLabel(paymentMethod)} — To be collected on delivery</p>    
    </div>    
    <div class="confirmation__section">      
      <h4>Delivery Details</h4>      
      <p><strong>${s.fullName}</strong></p>      
      <p>${s.phone}${s.email ? ' · ' + s.email : ''}</p>      
      <p>${address}</p>    
    </div>    
    <button class="btn btn--primary btn--full" data-close-modal style="margin-top: 1rem;">      
      Continue Shopping    
    </button>  
  `;  
  modal.hidden = false;  
  document.body.style.overflow = 'hidden';
}

function isAnyModalOpen() {  
  return document.querySelectorAll('.modal:not([hidden])').length > 0;
}

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

function initCheckout() {  
  const form = document.getElementById('checkoutForm');  
  if (form) {    
    form.addEventListener('submit', (e) => {      
      e.preventDefault();      
      placeOrder(form);    
    });    
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
        addToCart(product._id || product.id, 1, product.name);
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
    addToCart(productPid, selectedQuantity, product.name);
  });
  
  // Buy Now
  document.getElementById('detailBuyNow')?.addEventListener('click', () => {
    closeProductModal();
    buyNow(productPid, selectedQuantity, product.name);
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
