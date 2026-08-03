/* ── BACKEND CONFIG ── */
var API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:') 
    ? 'http://localhost:5000' 
    : 'https://stackblitz-zentra-client-0.onrender.com';

/* ── LIVE DATA STORES ── */
var PRODUCTS = [];
var ORDERS = [];
var CUSTOMERS = [];
var DELIVERY_CHARGES = [];
var DEFAULT_DELIVERY_CHARGE = 0;
var MONTHLY = [];
var CATS = [];
var TOP_PRODS = [];
var ACTIVE_TAB = 'dashboard';

var editingId = null;
var editingDeliveryId = null;

/** Helper to get auth headers for administrative writes */
function getAuthHeaders() {
  var token = localStorage.getItem('adminToken');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? 'Bearer ' + token : ''
  };
}

/* ── INIT ── */
async function initAdmin(){
  document.getElementById('top-date').textContent = new Date().toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short',year:'numeric'});
  
  // Fetch everything fresh from the backend database asynchronously
  await Promise.all([
    fetchProducts(),
    fetchOrders(),
    fetchDashboardStats(),
    fetchCustomers(),
    fetchDeliveryCharges(),
    fetchDefaultDeliveryCharge()
  ]);

  renderDashboard();
  renderProdsTable(PRODUCTS);
  renderDeliveryCharges(DELIVERY_CHARGES);
  renderOrders();
  renderReports();
  renderCustomers();
}

/* ── BACKEND FETCH INTEGRATIONS ── */

async function fetchProducts() {
  try {
    var res = await fetch(API_BASE + '/api/products');
    if (res.ok) {
      PRODUCTS = await res.json();
    }
  } catch (err) {
    console.error('Failed to fetch live products:', err);
    showToast('Failed to load products from database', 'error');
  }
}

async function fetchOrders() {
  try {
    var res = await fetch(API_BASE + '/api/orders', { headers: getAuthHeaders() });
    if (res.ok) {
      ORDERS = await res.json();
    }
  } catch (err) {
    console.error('Failed to fetch live orders:', err);
  }
}

async function fetchCustomers() {
  try {
    var res = await fetch(API_BASE + '/api/admin/customers', { headers: getAuthHeaders() });
    if (res.ok) {
      CUSTOMERS = await res.json();
    }
  } catch (err) {
    console.error('Failed to fetch live customers:', err);
  }
}

async function fetchDashboardStats() {
  try {
    var res = await fetch(API_BASE + '/api/admin/dashboard-stats', { headers: getAuthHeaders() });
    if (res.ok) {
      var stats = await res.json();
      MONTHLY = stats.monthly || [];
      CATS = stats.categories || [];
      TOP_PRODS = stats.topProducts || [];
    }
  } catch (err) {
    console.error('Failed to fetch dashboard metrics:', err);
  }
}

/* ── NAV ── */
/* ── SIDEBAR (mobile) ── */
function toggleSidebar(){
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('sidebar-overlay').classList.toggle('show');
}
function closeSidebar(){
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebar-overlay').classList.remove('show');
}

function goTab(name, navEl){
  ACTIVE_TAB = name;
  document.querySelectorAll('.tab-page').forEach(t=>t.classList.remove('active'));
  document.getElementById('tab-'+name).classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
  if(navEl) {
    navEl.classList.add('active');
  } else {
    // Fallback for manual calls
    document.querySelector(`.nav-item[onclick*="goTab('${name}'"]`)?.classList.add('active');
  }
  closeSidebar();
  var titles={dashboard:'Dashboard',products:'Products',delivery:'Delivery Charges',orders:'Orders',reports:'Sales Reports',customers:'Customers'};
  document.getElementById('page-title').textContent=titles[name];
  
  if (name === 'delivery') {
    fetchDeliveryCharges().then(() => renderDeliveryCharges(DELIVERY_CHARGES));
    fetchDefaultDeliveryCharge();
  }
}

/* ── DASHBOARD ── */
function renderDashboard(){
  if (!MONTHLY || MONTHLY.length === 0) {
    document.getElementById('monthly-chart').innerHTML = '<div style="padding:20px;text-align:center;color:var(--text-muted)">No monthly data available.</div>';
  } else {
    var maxV=Math.max(...MONTHLY.map(m=>m.v || 0)) || 1;
    document.getElementById('monthly-chart').innerHTML=MONTHLY.map(m=>`
      <div class="chart-label-row">
        <div class="chart-label">${m.m}</div>
        <div class="chart-track"><div class="chart-fill chart-fill-g" style="width:${Math.round((m.v || 0)/maxV*100)}%"><span class="chart-val">₹${((m.v || 0)/1000).toFixed(0)}k</span></div></div>
        <div style="font-size:11px;color:var(--text-muted);min-width:50px;text-align:right;flex-shrink:0">${m.orders || 0} orders</div>
      </div>`).join('');
  }

  document.getElementById('pie-legend').innerHTML=CATS.map(c=>`
    <div class="legend-row">
      <div class="legend-label"><div class="legend-dot" style="background:${c.color || '#3b82f6'}"></div>${c.c}</div>
      <div class="legend-pct">${c.pct}%</div>
    </div>`).join('');

  var dash5=ORDERS.slice(0,5);
  document.getElementById('dash-orders-table').innerHTML=`
    <thead><tr><th>Order</th><th>Customer</th><th>Amount</th><th>Status</th></tr></thead>
    <tbody>${dash5.map(o=>`<tr>
      <td style="font-weight:600">${o.orderNumber || o._id}</td>
      <td>${o.shipping?.fullName || 'Guest'}<br><span style="font-size:11px;color:var(--text-muted)">${o.shipping?.city || ''}</span></td>
      <td style="font-weight:700;color:var(--green-dark)">₹${(o.grandTotal || o.totalAmount || 0).toLocaleString('en-IN')}</td>
      <td><span class="badge badge-${(o.orderStatus || 'pending').toLowerCase().replace(/_/g,'-')}">${formatOrderStatus(o.orderStatus)}</span></td>
    </tr>`).join('')}</tbody>`;

  var maxSold = TOP_PRODS.length > 0 ? Math.max(...TOP_PRODS.map(p => p.sold || 1)) : 1;
  document.getElementById('top-products-list').innerHTML=TOP_PRODS.map((p,i)=>`
    <div class="top-prod-row">
      <div class="top-rank ${i===0?'rank-1':i===1?'rank-2':i===2?'rank-3':'rank-n'}">${i+1}</div>
      <div class="top-prod-info"><div class="top-prod-name">${p.n}</div><div class="top-prod-cat">${p.cat || 'General'}</div></div>
      <div class="top-prog"><div class="top-prog-fill" style="width:${Math.round((p.sold || 0)/maxSold*100)}%"></div></div>
      <div class="top-units">${p.sold} sold</div>
    </div>`).join('');
}

function formatOrderStatus(status) {
  if (!status) return 'Unknown';
  return String(status).split('_').map(function(word) {
    return word.charAt(0).toUpperCase() + word.slice(1);
  }).join(' ');
}

function deriveStockStatus(product) {
  if (product.stockStatus) return product.stockStatus;
  if (product.stock > 10) return 'In Stock';
  if (product.stock > 0) return 'Low Stock';
  return 'Out of Stock';
}

function stockQuantityFromStatus(status, existingStock) {
  if (status === 'Out of Stock') return 0;
  if (status === 'Low Stock') {
    return existingStock > 0 && existingStock <= 10 ? existingStock : 5;
  }
  if (status === 'In Stock') {
    return existingStock > 10 ? existingStock : 50;
  }
  return existingStock || 0;
}

async function fetchDeliveryCharges() {
  try {
    var res = await fetch(API_BASE + '/api/admin/delivery-charges', { headers: getAuthHeaders() });
    if (res.ok) {
      DELIVERY_CHARGES = await res.json();
    }
  } catch (err) {
    console.error('Failed to fetch delivery charges:', err);
  }
}

async function fetchDefaultDeliveryCharge() {
  try {
    var res = await fetch(API_BASE + '/api/admin/settings/default-delivery-charge', { headers: getAuthHeaders() });
    if (res.ok) {
      var data = await res.json();
      DEFAULT_DELIVERY_CHARGE = data.defaultDeliveryCharge || 0;
      var input = document.getElementById('default-delivery-charge');
      if (input) input.value = DEFAULT_DELIVERY_CHARGE;
    }
  } catch (err) {
    console.error('Failed to fetch default delivery charge:', err);
  }
}

async function saveDefaultDeliveryCharge() {
  var value = parseInt(document.getElementById('default-delivery-charge').value, 10);
  if (Number.isNaN(value) || value < 0) {
    showToast('Enter a valid default charge of 0 or more', 'error');
    return;
  }
  try {
    var res = await fetch(API_BASE + '/api/admin/settings/default-delivery-charge', {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ defaultDeliveryCharge: value })
    });
    var data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Could not save default charge.');
    DEFAULT_DELIVERY_CHARGE = data.defaultDeliveryCharge;
    showToast('Default delivery charge saved');
  } catch (err) {
    showToast(err.message || 'Failed to save default charge', 'error');
  }
}

function renderDeliveryCharges(list) {
  var tbody = document.getElementById('delivery-table-body');
  var sub = document.getElementById('delivery-table-sub');
  if (!tbody) return;
  if (sub) sub.textContent = list.length + ' pincode entries';
  tbody.innerHTML = list.map(function(entry) {
    var updated = entry.updatedAt ? new Date(entry.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
    return '<tr>' +
      '<td style="font-weight:600">' + entry.pincode + '</td>' +
      '<td>' + (entry.areaName || '—') + '</td>' +
      '<td style="font-weight:700;color:var(--green-dark)">₹' + Number(entry.deliveryCharge).toLocaleString('en-IN') + '</td>' +
      '<td style="color:var(--text-muted);font-size:12px">' + updated + '</td>' +
      '<td><div class="action-btns">' +
        '<button class="btn-edit" onclick="openDeliveryModal(\'' + entry._id + '\')">Edit</button>' +
        '<button class="btn-del" onclick="deleteDeliveryCharge(\'' + entry._id + '\')">Delete</button>' +
      '</div></td>' +
    '</tr>';
  }).join('');
}

function searchDeliveryCharges(q) {
  var query = (q || '').trim();
  if (!query) {
    renderDeliveryCharges(DELIVERY_CHARGES);
    return;
  }
  var list = DELIVERY_CHARGES.filter(function(entry) {
    return String(entry.pincode).includes(query);
  });
  renderDeliveryCharges(list);
}

function openDeliveryModal(id) {
  editingDeliveryId = id;
  document.getElementById('dm-title').textContent = id ? 'Edit Delivery Charge' : 'Add Delivery Charge';
  if (id) {
    var entry = DELIVERY_CHARGES.find(function(x) { return x._id === id; });
    document.getElementById('dm-pincode').value = entry.pincode;
    document.getElementById('dm-area').value = entry.areaName || '';
    document.getElementById('dm-charge').value = entry.deliveryCharge;
  } else {
    document.getElementById('dm-pincode').value = '';
    document.getElementById('dm-area').value = '';
    document.getElementById('dm-charge').value = '';
  }
  document.getElementById('delivery-modal').classList.add('open');
}

function closeDeliveryModal() {
  document.getElementById('delivery-modal').classList.remove('open');
}

async function saveDeliveryCharge() {
  var pincode = document.getElementById('dm-pincode').value.trim();
  var areaName = document.getElementById('dm-area').value.trim();
  var deliveryCharge = parseInt(document.getElementById('dm-charge').value, 10);
  if (!pincode) { showToast('Pincode is required', 'error'); return; }
  if (Number.isNaN(deliveryCharge) || deliveryCharge < 0) { showToast('Enter a valid delivery charge', 'error'); return; }

  var payload = { pincode: pincode, areaName: areaName, deliveryCharge: deliveryCharge };
  var url = API_BASE + '/api/admin/delivery-charges' + (editingDeliveryId ? '/' + editingDeliveryId : '');
  var method = editingDeliveryId ? 'PUT' : 'POST';

  try {
    var res = await fetch(url, {
      method: method,
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    var data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Could not save delivery charge.');
    showToast(editingDeliveryId ? 'Delivery charge updated' : 'Delivery charge added');
    closeDeliveryModal();
    await fetchDeliveryCharges();
    renderDeliveryCharges(DELIVERY_CHARGES);
  } catch (err) {
    showToast(err.message || 'Failed to save delivery charge', 'error');
  }
}

async function deleteDeliveryCharge(id) {
  if (!confirm('Delete this delivery charge entry?')) return;
  try {
    var res = await fetch(API_BASE + '/api/admin/delivery-charges/' + id, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    var data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Could not delete entry.');
    showToast('Delivery charge entry deleted');
    await fetchDeliveryCharges();
    renderDeliveryCharges(DELIVERY_CHARGES);
  } catch (err) {
    showToast(err.message || 'Failed to delete entry', 'error');
  }
}

/* ── PRODUCTS ── */
function renderProdsTable(list){
  document.getElementById('prod-table-sub').textContent=`${list.length} of ${PRODUCTS.length} products`;
  document.getElementById('prod-count').textContent=PRODUCTS.length;
  document.getElementById('prod-table-body').innerHTML=list.map(p=>{
    var mktPrice = p.mrp || p.price || 0;
    var disc = mktPrice > 0 ? Math.round((1 - p.price / mktPrice) * 100) : 0;
    var stockStatus = deriveStockStatus(p);
    var stockClass = stockStatus === 'In Stock' ? 'badge-in' : stockStatus === 'Low Stock' ? 'badge-low' : 'badge-out';

    return `<tr>
      <td><div style="display:flex;align-items:center;gap:12px"><img class="prod-thumb" src="${p.image}" alt="${p.name}"><div><div style="font-weight:500;font-size:13px">${p.name}</div><div style="font-size:11px;color:var(--text-muted)">${p.description?.substring(0, 30) || ''}...</div></div></div></td>
      <td>${p.category}</td>
      <td style="font-weight:700;color:var(--green-dark)">₹${p.price.toLocaleString('en-IN')}</td>
      <td style="text-decoration:line-through;color:var(--text-muted)">₹${mktPrice.toLocaleString('en-IN')}</td>
      <td><span style="color:var(--green-dark);font-weight:600">${disc}% off</span></td>
      <td><span class="badge ${stockClass}">${stockStatus} (${p.stock})</span></td>
      <td><div class="action-btns"><button class="btn-edit" onclick="openProdModal('${p._id}')">Edit</button><button class="btn-del" onclick="deleteProd('${p._id}')">Delete</button></div></td>
    </tr>`;
  }).join('');
}

function searchProds(q){
  var cat=document.getElementById('cat-filter').value;
  var list=PRODUCTS.filter(p=>{
    var matchQ=!q||p.name.toLowerCase().includes(q.toLowerCase());
    var matchC=!cat||p.category===cat;
    return matchQ&&matchC;
  });
  renderProdsTable(list);
}
function filterProdsTable(){searchProds(document.querySelector('input[placeholder*="Search products"]').value||'');}

function openProdModal(id){
  editingId=id;
  document.getElementById('pm-title').textContent=id?'Edit Product':'Add Product';
  document.getElementById('img-preview').innerHTML='<div class="img-preview-placeholder"><span>🖼️</span><p>Click to upload product image</p></div>';
  
  if(id){
    var p=PRODUCTS.find(x=>x._id===id);
    document.getElementById('pm-name').value=p.name;
    document.getElementById('pm-cat').value=p.category;
    document.getElementById('pm-price').value=p.price;
    document.getElementById('pm-mrp').value=p.mrp || p.price;
    document.getElementById('pm-fabric').value=p.fabric || '';
    document.getElementById('pm-care').value=p.care || '';
    document.getElementById('pm-desc').value=p.description || '';
    // Set stock status dropdown from product data
    document.getElementById('pm-stock').value = deriveStockStatus(p);
    document.getElementById('img-preview').innerHTML=`<img src="${p.image}" alt="">`;
  } else {
    ['pm-name','pm-price','pm-mrp','pm-fabric','pm-care','pm-desc'].forEach(f=>document.getElementById(f).value='');
    document.getElementById('pm-stock').value = 'In Stock';
  }
  document.getElementById('prod-modal').classList.add('open');
}
function closeProdModal(){document.getElementById('prod-modal').classList.remove('open');}

function previewImg(inp){
  if(inp.files&&inp.files[0]){
    var r=new FileReader();
    r.onload=function(e){document.getElementById('img-preview').innerHTML=`<img src="${e.target.result}" alt="">`;};
    r.readAsDataURL(inp.files[0]);
  }
}

// ----- FIXED: saveProd now logs payload and ensures stockStatus is sent -----
async function saveProd(){
  var name=document.getElementById('pm-name').value.trim();
  var price=parseInt(document.getElementById('pm-price').value)||0;
  var mrp=parseInt(document.getElementById('pm-mrp').value)||price;
  var stockStatus = document.getElementById('pm-stock').value; // "In Stock", "Low Stock", "Out of Stock"
  var existingStock = 0;
  if (editingId) {
    var existing = PRODUCTS.find(function(x) { return x._id === editingId; });
    existingStock = existing ? existing.stock : 0;
  }
  var stock = stockQuantityFromStatus(stockStatus, existingStock);
  
  if(!name){showToast('Product name is required','error');return;}
  if(!price){showToast('Price is required','error');return;}
  
  var imgEl=document.querySelector('#img-preview img');
  var image=imgEl?imgEl.src:'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=60&h=80&fit=crop';
  
  var payload = {
    name: name,
    category: document.getElementById('pm-cat').value,
    price: price,
    mrp: mrp,
    stock: stock,
    stockStatus: stockStatus,
    description: document.getElementById('pm-desc').value,
    image: image,
    fabric: document.getElementById('pm-fabric').value,
    care: document.getElementById('pm-care').value
  };

  // Debug: see what we're sending
  console.log('Saving product payload:', payload);

  try {
    var url = API_BASE + '/api/products' + (editingId ? '/' + editingId : '');
    var method = editingId ? 'PUT' : 'POST';

    var res = await fetch(url, {
      method: method,
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });

    var data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Server rejected operational save.');

    showToast(editingId ? 'Product updated successfully' : 'Product added successfully');
    closeProdModal();
    
    // Refresh application state components synchronously from cloud database
    await fetchProducts();
    await fetchDashboardStats();
    renderProdsTable(PRODUCTS);
    renderDashboard();
  } catch (err) {
    console.error(err);
    showToast(err.message || 'Error occurred while saving product info.', 'error');
  }
}

async function deleteProd(id){
  if(!confirm('Are you sure you want to delete this product?'))return;
  try {
    var res = await fetch(API_BASE + '/api/products/' + id, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    
    var data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to complete transaction.');

    showToast('Product successfully deleted');
    await fetchProducts();
    await fetchDashboardStats();
    renderProdsTable(PRODUCTS);
    renderDashboard();
  } catch (err) {
    console.error(err);
    showToast(err.message || 'Could not delete product.', 'error');
  }
}

/* ── ORDERS ── */
function renderOrders(){
  var filter=document.getElementById('order-filter').value;
  var list=filter?ORDERS.filter(o=>o.orderStatus===filter):ORDERS;
  
  document.getElementById('orders-table-body').innerHTML=list.map(o=>{
    var itemsSummary = o.items ? o.items.map(i => `${i.name} (x${i.quantity})`).join(', ') : 'No description';
    var formattedDate = o.createdAt ? new Date(o.createdAt).toLocaleDateString('en-IN', {day:'numeric', month:'short', year:'numeric'}) : '';
    var paymentBadge = o.paymentStatus === 'paid' ? 'badge-in' : o.paymentStatus === 'failed' ? 'badge-out' : 'badge-low';
    
    return `<tr>
      <td style="font-weight:600;color:var(--green-dark)">${o.orderNumber || o._id}</td>
      <td>${o.shipping?.fullName || 'Anonymous'}<br><span style="font-size:11px;color:var(--text-muted)">${o.shipping?.phone || ''}</span></td>
      <td><div style="max-width:200px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${itemsSummary}">${itemsSummary}</div></td>
      <td style="font-weight:700">₹${(o.grandTotal || o.totalAmount || 0).toLocaleString('en-IN')}</td>
      <td><span class="badge ${paymentBadge}">${(o.paymentStatus || 'pending').toUpperCase()}</span></td>
      <td style="color:var(--text-muted);font-size:12px">${formattedDate}</td>
      <td>
        <select onchange="updateOrderStatus('${o._id}',this.value)" style="padding:5px 10px;border:1px solid var(--border);border-radius:4px;font-size:12px;background:white" >
          ${['order_placed','awaiting_payment','processing','shipped','delivered','cancelled'].map(s=>`<option value="${s}" ${o.orderStatus===s?'selected':''}>${formatOrderStatus(s)}</option>`).join('')}
        </select>
      </td>
      <td><button class="btn-view" onclick="alert('Order Details:\\nContact Name: ${o.shipping?.fullName}\\nAddress: ${o.shipping?.addressLine1}, ${o.shipping?.city}\\nPayment: ${o.paymentStatus} (${o.paymentMethod})\\nDelivery Charge: ₹${o.shippingFee || 0}')">View</button></td>
    </tr>`;
  }).join('');
}

async function updateOrderStatus(id, status){
  try {
    var res = await fetch(API_BASE + '/api/orders/' + id + '/status', {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ orderStatus: status })
    });
    
    var data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed status mutation');
    
    var localOrder = ORDERS.find(x => x._id === id);
    if (localOrder) localOrder.orderStatus = status;
    
    showToast(`Order status updated to ${status}`);
    await fetchDashboardStats();
    renderDashboard();
  } catch (err) {
    console.error(err);
    showToast(err.message || 'Failed to update status on remote DB', 'error');
  }
}

/* ── REPORTS ── */
function renderReports(){
  if (!MONTHLY || MONTHLY.length === 0) {
    document.getElementById('report-monthly').innerHTML = '<p style="color:var(--text-muted)">No reports available.</p>';
    return;
  }
  
  var max=Math.max(...MONTHLY.map(m=>m.v || 0)) || 1;
  document.getElementById('report-monthly').innerHTML=MONTHLY.map(m=>`
    <div class="monthly-table-row">
      <div class="mt-month">${m.m}</div>
      <div class="mt-bar-wrap"><div class="mt-bar" style="width:${Math.round((m.v || 0)/max*100)}%;transition:width .6s"><div class="mt-orders">${m.orders || 0}</div></div></div>
      <div class="mt-val">₹${((m.v || 0)/1000).toFixed(1)}k</div>
    </div>`).join('');

  var totalUnits = TOP_PRODS.reduce((sum, curr) => sum + (curr.sold || 0), 0);
  document.getElementById('report-cats').innerHTML=`
    <div class="mini-pie"><div class="mini-pie-inner">${totalUnits} units</div></div>
    <div class="pie-legend">${CATS.map(c=>`
      <div class="legend-row">
        <div class="legend-label"><div class="legend-dot" style="background:${c.color || '#3b82f6'}"></div>${c.c}</div>
        <div class="legend-pct">${c.pct}%</div>
      </div>`).join('')}
    </div>`;

  document.getElementById('top-products-table').innerHTML=TOP_PRODS.map((p,i)=>`
    <tr>
      <td><div class="top-rank ${i===0?'rank-1':i===1?'rank-2':i===2?'rank-3':'rank-n'}" style="display:inline-flex">${i+1}</div></td>
      <td style="font-weight:500">${p.n}</td>
      <td>${p.cat || 'General'}</td>
      <td style="font-weight:700;color:var(--green-dark)">${p.sold}</td>
      <td style="font-weight:700;color:var(--green-dark)">₹${(p.rev || 0).toLocaleString('en-IN')}</td>
    </tr>`).join('');
}

/* ── CUSTOMERS ── */
function renderCustomers(){
  document.getElementById('customers-table').innerHTML=CUSTOMERS.map(c=>{
    var finalSeen = c.last ? new Date(c.last).toLocaleDateString('en-IN', {day:'numeric', month:'short', year:'numeric'}) : '';
    return `<tr>
      <td style="font-weight:500">${c.name || 'Guest shopper'}</td>
      <td style="color:var(--text-muted);font-size:12px">${c.phone || 'N/A'}</td>
      <td>${c.city || 'N/A'}</td>
      <td style="text-align:center;font-weight:600">${c.orders}</td>
      <td style="font-weight:700;color:var(--green-dark)">₹${(c.spent || 0).toLocaleString('en-IN')}</td>
      <td style="color:var(--text-muted);font-size:12px">${finalSeen}</td>
    </tr>`;
  }).join('');
}

/* ── TOAST ── */
function showToast(msg,type){
  var t=document.getElementById('toast');
  if(!t) return;
  t.textContent=msg;
  t.className='toast'+(type==='error'?' error':'');
  t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'),3000);
}

/* ── ESC ── */
document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeProdModal();closeDeliveryModal();}});

async function resetPasswordByMobile(){
  var phone = prompt('Enter registered mobile number (10 digits):');
  if(!phone) return;

  try {
    var otpRes = await fetch(API_BASE + '/api/auth/forgot-password/request-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: phone })
    });
    var otpData = await otpRes.json();
    if(!otpRes.ok){
      alert(otpData.error || 'Could not send OTP.');
      return;
    }

    var otp = prompt('Enter the OTP sent to your mobile (check server logs for now):');
    if(!otp) return;

    var verifyRes = await fetch(API_BASE + '/api/auth/forgot-password/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: phone, otp: otp })
    });
    var verifyData = await verifyRes.json();
    if(!verifyRes.ok){
      alert(verifyData.error || 'Incorrect or expired OTP.');
      return;
    }

    var newPassword = prompt('Enter new password (min 6 characters):');
    if(!newPassword) return;

    var resetRes = await fetch(API_BASE + '/api/auth/forgot-password/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: phone, otp: otp, newPassword: newPassword })
    });
    var resetData = await resetRes.json();
    if(!resetRes.ok){
      alert(resetData.error || 'Could not reset password.');
      return;
    }

    alert('Password changed successfully. You can now log in with your new password.');
  } catch (err) {
    alert('Could not reach the server. Check your internet connection and try again.');
    console.error('Forgot-password request failed:', err);
  }
}

doLogin = async function(){
  var emailInput = document.getElementById('l-user');
  var passInput  = document.getElementById('l-pass');
  var errBox     = document.getElementById('login-err');
  var btn        = document.querySelector('.btn-login');

  var email = emailInput.value.trim();
  var password = passInput.value;

  errBox.style.display = 'none';

  if(!email || !password){
    errBox.textContent = 'Please enter both email and password.';
    errBox.style.display = 'block';
    return;
  }

  var originalLabel = btn ? btn.textContent : null;
  if(btn){ btn.textContent = 'Signing in…'; btn.disabled = true; }

  try {
    var res = await fetch(API_BASE + '/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email, password: password })
    });

    var data = await res.json();

    if(!res.ok){
      errBox.textContent = data.error || 'Invalid credentials.';
      errBox.style.display = 'block';
      return;
    }

    if(!data.user || data.user.role !== 'admin'){
      errBox.textContent = 'This account does not have admin access.';
      errBox.style.display = 'block';
      return;
    }

    localStorage.setItem('adminToken', data.token);
    localStorage.setItem('adminUser', JSON.stringify(data.user));

    document.getElementById('login-page').style.display = 'none';
    document.getElementById('admin-app').style.display = 'block';
    passInput.value = '';
    initAdmin();

  } catch (err) {
    errBox.textContent = 'Could not reach the server. Check your internet connection and try again.';
    errBox.style.display = 'block';
    console.error('Login request failed:', err);
  } finally {
    if(btn){ btn.textContent = originalLabel; btn.disabled = false; }
  }
}

function doLogout(){
  localStorage.removeItem('adminToken');
  localStorage.removeItem('adminUser');
  document.getElementById('admin-app').style.display='none';
  document.getElementById('login-page').style.display='flex';
  document.getElementById('l-pass').value='';
}
