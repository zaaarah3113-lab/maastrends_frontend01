/* ── LIVE BACKEND CONFIG ──
   Your Express/Mongoose backend on Render. Every read/write in this admin
   portal (products, orders, customers, dashboard stats, delivery charges)
   goes through these endpoints — nothing here is hardcoded/dummy data. */
var API_BASE = 'https://stackblitz-zentra-client-0.onrender.com';

/* ── LIVE DATA STORES (populated from backend, never hand-edited) ── */
var PRODUCTS = [];
var ORDERS = [];
var CUSTOMERS = [];
var DELIVERY_CHARGES = [];
var DEFAULT_DELIVERY_CHARGE = 0;
var MONTHLY = [];
var CATS = [];
var TOP_PRODS = [];
var DASHBOARD_STATS = { productCount: 0, totalOrders: 0, totalRevenue: 0 };

var editingId = null;
var editingDeliveryId = null;

/** Auth headers for every admin write/read that needs the JWT */
function getAuthHeaders() {
  var token = localStorage.getItem('adminToken');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? 'Bearer ' + token : ''
  };
}

/** Wrapper around fetch that adds auth headers, parses JSON, and surfaces
    401s (expired/invalid token) by bouncing back to the login screen. */
async function apiFetch(path, options) {
  options = options || {};
  options.headers = Object.assign({}, getAuthHeaders(), options.headers || {});
  var res = await fetch(API_BASE + path, options);
  if (res.status === 401) {
    doLogout();
    throw new Error('Session expired. Please log in again.');
  }
  var data = null;
  try { data = await res.json(); } catch (e) { /* no body */ }
  if (!res.ok) {
    throw new Error((data && data.error) || 'Request failed (' + res.status + ')');
  }
  return data;
}

/* ── INIT ── */
async function initAdmin(){
  document.getElementById('top-date').textContent = new Date().toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short',year:'numeric'});

  try {
    // Fetch everything fresh from the backend database, in parallel.
    await Promise.all([
      fetchProducts(),
      fetchOrders(),
      fetchDashboardStats(),
      fetchCustomers(),
      fetchDeliveryCharges(),
      fetchDefaultDeliveryCharge()
    ]);
  } catch (err) {
    console.error('initAdmin failed:', err);
    showToast(err.message || 'Could not load dashboard data.', 'error');
  }

  renderDashboard();
  renderProdsTable(PRODUCTS);
  renderDeliveryCharges(DELIVERY_CHARGES);
  renderOrders();
  renderReports();
  renderCustomers();
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
  document.querySelectorAll('.tab-page').forEach(t=>t.classList.remove('active'));
  document.getElementById('tab-'+name).classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
  if(navEl) navEl.classList.add('active');
  closeSidebar();
  var titles={dashboard:'Dashboard',products:'Products',delivery:'Delivery Charges',orders:'Orders',reports:'Sales Reports',customers:'Customers'};
  document.getElementById('page-title').textContent=titles[name];
}

/* =========================
   PRODUCTS
   ========================= */
async function fetchProducts(){
  var data = await apiFetch('/api/products');
  PRODUCTS = (data || []).map(function(p){
    return {
      id: p._id,
      name: p.name,
      cat: p.category,
      price: p.price,
      mrp: p.mrp,
      fabric: p.fabric,
      care: p.care,
      desc: p.description,
      stock: p.stockStatus,      // 'In Stock' | 'Low Stock' | 'Out of Stock'
      stockQty: p.stock,
      img: p.image
    };
  });
}

function renderProdsTable(list){
  document.getElementById('prod-table-sub').textContent=`${list.length} of ${PRODUCTS.length} products`;
  document.getElementById('prod-count').textContent=PRODUCTS.length;
  document.getElementById('prod-table-body').innerHTML=list.map(p=>{
    var disc=p.mrp?Math.round((1-p.price/p.mrp)*100):0;
    return `<tr>
      <td><div style="display:flex;align-items:center;gap:12px"><img class="prod-thumb" src="${p.img}" alt="${p.name}"><div><div style="font-weight:500;font-size:13px">${p.name}</div><div style="font-size:11px;color:var(--text-muted)">${p.fabric||''}</div></div></div></td>
      <td>${p.cat}</td>
      <td style="font-weight:700;color:var(--green-dark)">₹${(p.price||0).toLocaleString('en-IN')}</td>
      <td style="text-decoration:line-through;color:var(--text-muted)">₹${(p.mrp||0).toLocaleString('en-IN')}</td>
      <td><span style="color:var(--green-dark);font-weight:600">${disc}% off</span></td>
      <td><span class="badge ${p.stock==='In Stock'?'badge-in':p.stock==='Low Stock'?'badge-low':'badge-out'}">${p.stock}</span></td>
      <td><div class="action-btns"><button class="btn-edit" onclick="openProdModal('${p.id}')">Edit</button><button class="btn-del" onclick="deleteProd('${p.id}')">Delete</button></div></td>
    </tr>`;
  }).join('');
}
function searchProds(q){
  var cat=document.getElementById('cat-filter').value;
  var list=PRODUCTS.filter(p=>{
    var matchQ=!q||p.name.toLowerCase().includes(q.toLowerCase());
    var matchC=!cat||p.cat===cat;
    return matchQ&&matchC;
  });
  renderProdsTable(list);
}
function filterProdsTable(){searchProds(document.querySelector('input[placeholder*="Search products"]').value||'');}

function openProdModal(id){
  editingId=id||null;
  document.getElementById('pm-title').textContent=id?'Edit Product':'Add Product';
  document.getElementById('img-preview').innerHTML='<div class="img-preview-placeholder"><span>🖼️</span><p>Click to upload product image</p></div>';
  if(id){
    var p=PRODUCTS.find(x=>x.id===id);
    document.getElementById('pm-name').value=p.name||'';
    document.getElementById('pm-cat').value=p.cat||'';
    document.getElementById('pm-price').value=p.price||'';
    document.getElementById('pm-mrp').value=p.mrp||'';
    document.getElementById('pm-fabric').value=p.fabric||'';
    document.getElementById('pm-care').value=p.care||'';
    document.getElementById('pm-desc').value=p.desc||'';
    // ↓ THE BUG WAS HERE: this line was previously missing/never wired up
    // to a real save, so "Stock Status" was set in the DOM but the value
    // never made it into the update request. Setting it explicitly here
    // AND sending it in saveProd() below is what actually fixes it.
    document.getElementById('pm-stock').value=p.stock||'In Stock';
    document.getElementById('img-preview').innerHTML=`<img src="${p.img}" alt="">`;
  } else {
    ['pm-name','pm-price','pm-mrp','pm-fabric','pm-care','pm-desc'].forEach(f=>document.getElementById(f).value='');
    document.getElementById('pm-stock').value='In Stock';
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

async function saveProd(){
  var name=document.getElementById('pm-name').value.trim();
  var price=parseInt(document.getElementById('pm-price').value)||0;
  var mrp=parseInt(document.getElementById('pm-mrp').value)||0;
  var stockStatus=document.getElementById('pm-stock').value; // ← always read fresh, always sent
  if(!name){showToast('Product name is required','error');return;}
  if(!price){showToast('Price is required','error');return;}

  var imgEl=document.querySelector('#img-preview img');
  var img=imgEl?imgEl.src:'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=60&h=80&fit=crop';

  var payload = {
    name: name,
    category: document.getElementById('pm-cat').value,
    price: price,
    mrp: mrp,
    fabric: document.getElementById('pm-fabric').value,
    care: document.getElementById('pm-care').value,
    description: document.getElementById('pm-desc').value,
    stockStatus: stockStatus,   // ← THE FIX: this field is now explicitly included
    image: img
  };

  try {
    if(editingId){
      await apiFetch('/api/products/'+editingId, { method:'PUT', body: JSON.stringify(payload) });
      showToast('Product updated successfully');
    } else {
      await apiFetch('/api/products', { method:'POST', body: JSON.stringify(payload) });
      showToast('Product added successfully');
    }
    closeProdModal();
    await fetchProducts();
    renderProdsTable(PRODUCTS);
    renderDashboard();
  } catch (err) {
    showToast(err.message || 'Could not save product.', 'error');
  }
}

async function deleteProd(id){
  if(!confirm('Are you sure you want to delete this product?'))return;
  try {
    await apiFetch('/api/products/'+id, { method:'DELETE' });
    await fetchProducts();
    renderProdsTable(PRODUCTS);
    renderDashboard();
    showToast('Product deleted');
  } catch (err) {
    showToast(err.message || 'Could not delete product.', 'error');
  }
}

/* =========================
   DELIVERY CHARGES (CRUD)
   ========================= */
async function fetchDeliveryCharges(search){
  var qs = search ? ('?search=' + encodeURIComponent(search)) : '';
  var data = await apiFetch('/api/admin/delivery-charges' + qs);
  DELIVERY_CHARGES = (data || []).map(function(d){
    return {
      id: d._id,
      pincode: d.pincode,
      areaName: d.areaName || '',
      charge: d.deliveryCharge,
      updatedAt: d.updatedAt
    };
  });
}

function renderDeliveryCharges(list){
  document.getElementById('delivery-table-sub').textContent = `${list.length} pincode(s) configured`;
  document.getElementById('delivery-table-body').innerHTML = list.map(d=>`<tr>
    <td style="font-weight:600">${d.pincode}</td>
    <td>${d.areaName||'—'}</td>
    <td style="font-weight:700;color:var(--green-dark)">₹${(d.charge||0).toLocaleString('en-IN')}</td>
    <td style="color:var(--text-muted);font-size:12px">${d.updatedAt?new Date(d.updatedAt).toLocaleDateString('en-IN'):'—'}</td>
    <td><div class="action-btns"><button class="btn-edit" onclick="openDeliveryModal('${d.id}')">Edit</button><button class="btn-del" onclick="deleteDeliveryCharge('${d.id}')">Delete</button></div></td>
  </tr>`).join('');
}

async function searchDeliveryCharges(q){
  try {
    await fetchDeliveryCharges(q);
    renderDeliveryCharges(DELIVERY_CHARGES);
  } catch (err) {
    showToast(err.message || 'Could not search delivery charges.', 'error');
  }
}

function openDeliveryModal(id){
  editingDeliveryId = id || null;
  document.getElementById('dm-title').textContent = id ? 'Edit Delivery Charge' : 'Add Delivery Charge';
  if(id){
    var d = DELIVERY_CHARGES.find(x=>x.id===id);
    document.getElementById('dm-pincode').value = d.pincode;
    document.getElementById('dm-area').value = d.areaName;
    document.getElementById('dm-charge').value = d.charge;
  } else {
    document.getElementById('dm-pincode').value='';
    document.getElementById('dm-area').value='';
    document.getElementById('dm-charge').value='';
  }
  document.getElementById('delivery-modal').classList.add('open');
}
function closeDeliveryModal(){document.getElementById('delivery-modal').classList.remove('open');}

async function saveDeliveryCharge(){
  var pincode = document.getElementById('dm-pincode').value.trim();
  var areaName = document.getElementById('dm-area').value.trim();
  var charge = parseInt(document.getElementById('dm-charge').value);
  if(!/^\d{6}$/.test(pincode)){ showToast('Enter a valid 6-digit pincode', 'error'); return; }
  if(Number.isNaN(charge) || charge < 0){ showToast('Enter a valid delivery charge', 'error'); return; }

  var payload = { pincode: pincode, areaName: areaName, deliveryCharge: charge };
  try {
    if(editingDeliveryId){
      await apiFetch('/api/admin/delivery-charges/'+editingDeliveryId, { method:'PUT', body: JSON.stringify(payload) });
      showToast('Delivery charge updated');
    } else {
      await apiFetch('/api/admin/delivery-charges', { method:'POST', body: JSON.stringify(payload) });
      showToast('Delivery charge added');
    }
    closeDeliveryModal();
    await fetchDeliveryCharges();
    renderDeliveryCharges(DELIVERY_CHARGES);
  } catch (err) {
    showToast(err.message || 'Could not save delivery charge.', 'error');
  }
}

async function deleteDeliveryCharge(id){
  if(!confirm('Delete this delivery charge entry?')) return;
  try {
    await apiFetch('/api/admin/delivery-charges/'+id, { method:'DELETE' });
    await fetchDeliveryCharges();
    renderDeliveryCharges(DELIVERY_CHARGES);
    showToast('Delivery charge deleted');
  } catch (err) {
    showToast(err.message || 'Could not delete delivery charge.', 'error');
  }
}

async function fetchDefaultDeliveryCharge(){
  var data = await apiFetch('/api/admin/settings/default-delivery-charge');
  DEFAULT_DELIVERY_CHARGE = Number(data && data.defaultDeliveryCharge) || 0;
  var el = document.getElementById('default-delivery-charge');
  if(el) el.value = DEFAULT_DELIVERY_CHARGE;
}

async function saveDefaultDeliveryCharge(){
  var charge = parseInt(document.getElementById('default-delivery-charge').value);
  if(Number.isNaN(charge) || charge < 0){ showToast('Enter a valid amount', 'error'); return; }
  try {
    await apiFetch('/api/admin/settings/default-delivery-charge', { method:'PUT', body: JSON.stringify({ defaultDeliveryCharge: charge }) });
    showToast('Default delivery charge saved');
  } catch (err) {
    showToast(err.message || 'Could not save default charge.', 'error');
  }
}

/* =========================
   ORDERS
   ========================= */
async function fetchOrders(){
  var data = await apiFetch('/api/orders');
  ORDERS = (data || []).map(function(o){
    return {
      id: o._id,
      orderNumber: o.orderNumber,
      cust: (o.shipping && o.shipping.fullName) || '—',
      phone: (o.shipping && o.shipping.phone) || '',
      city: (o.shipping && o.shipping.city) || '',
      prod: (o.items && o.items.length) ? (o.items[0].name + (o.items.length>1?` +${o.items.length-1} more`:'')) : '—',
      amt: o.grandTotal,
      date: o.createdAt ? new Date(o.createdAt).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}) : '',
      status: labelForOrderStatus(o.orderStatus),
      paymentStatus: o.paymentStatus
    };
  });
}
function labelForOrderStatus(s){
  var map = { awaiting_payment:'Processing', order_placed:'Processing', processing:'Processing', shipped:'Shipped', delivered:'Delivered', cancelled:'Cancelled' };
  return map[s] || s;
}
function statusToBackendValue(label){
  var map = { Processing:'processing', Shipped:'shipped', Delivered:'delivered', Cancelled:'cancelled' };
  return map[label] || 'processing';
}

function renderOrders(){
  var filter=document.getElementById('order-filter').value;
  var list=filter?ORDERS.filter(o=>o.status===filter):ORDERS;
  document.getElementById('orders-table-body').innerHTML=list.map(o=>`<tr>
    <td style="font-weight:600;color:var(--green-dark)">${o.orderNumber||o.id}</td>
    <td>${o.cust}<br><span style="font-size:11px;color:var(--text-muted)">${o.phone}</span></td>
    <td>${o.prod}</td>
    <td style="font-weight:700">₹${(o.amt||0).toLocaleString('en-IN')}</td>
    <td style="color:var(--text-muted);font-size:12px">${o.date}</td>
    <td>
      <select onchange="updateOrderStatus('${o.id}',this.value)" style="padding:5px 10px;border:1px solid var(--border);border-radius:4px;font-size:12px;background:white" >
        ${['Processing','Shipped','Delivered','Cancelled'].map(s=>`<option ${o.status===s?'selected':''}>${s}</option>`).join('')}
      </select>
    </td>
    <td><button class="btn-view">View</button></td>
  </tr>`).join('');
}

async function updateOrderStatus(id,status){
  try {
    await apiFetch('/api/orders/'+id+'/status', { method:'PUT', body: JSON.stringify({ orderStatus: statusToBackendValue(status) }) });
    var o=ORDERS.find(x=>x.id===id);
    if(o){o.status=status;}
    showToast(`Order marked as ${status}`);
  } catch (err) {
    showToast(err.message || 'Could not update order status.', 'error');
    await fetchOrders();
    renderOrders();
  }
}

/* =========================
   DASHBOARD / REPORTS (from /api/admin/dashboard-stats)
   ========================= */
async function fetchDashboardStats(){
  var data = await apiFetch('/api/admin/dashboard-stats');
  DASHBOARD_STATS = { productCount: data.productCount, totalOrders: data.totalOrders, totalRevenue: data.totalRevenue };
  MONTHLY = data.monthly || [];
  CATS = data.categories || [];
  TOP_PRODS = data.topProducts || [];
}

function renderDashboard(){
  var maxV=Math.max(1, ...MONTHLY.map(m=>m.v));
  document.getElementById('monthly-chart').innerHTML=MONTHLY.map(m=>`
    <div class="chart-label-row">
      <div class="chart-label">${m.m}</div>
      <div class="chart-track"><div class="chart-fill chart-fill-g" style="width:${Math.round(m.v/maxV*100)}%"><span class="chart-val">₹${(m.v/1000).toFixed(0)}k</span></div></div>
      <div style="font-size:11px;color:var(--text-muted);min-width:50px;text-align:right;flex-shrink:0">${m.orders} orders</div>
    </div>`).join('');
  document.getElementById('pie-legend').innerHTML=CATS.map(c=>`
    <div class="legend-row">
      <div class="legend-label"><div class="legend-dot" style="background:${c.color}"></div>${c.c}</div>
      <div class="legend-pct">${c.pct}%</div>
    </div>`).join('');
  var dash5=ORDERS.slice(0,5);
  document.getElementById('dash-orders-table').innerHTML=`
    <thead><tr><th>Order</th><th>Customer</th><th>Amount</th><th>Status</th></tr></thead>
    <tbody>${dash5.map(o=>`<tr>
      <td style="font-weight:600">${o.orderNumber||o.id}</td>
      <td>${o.cust}<br><span style="font-size:11px;color:var(--text-muted)">${o.city}</span></td>
      <td style="font-weight:700;color:var(--green-dark)">₹${(o.amt||0).toLocaleString('en-IN')}</td>
      <td><span class="badge badge-${(o.status||'').toLowerCase()}">${o.status}</span></td>
    </tr>`).join('')}</tbody>`;
  var maxSold = Math.max(1, ...TOP_PRODS.map(p=>p.sold||0));
  document.getElementById('top-products-list').innerHTML=TOP_PRODS.map((p,i)=>`
    <div class="top-prod-row">
      <div class="top-rank ${i===0?'rank-1':i===1?'rank-2':i===2?'rank-3':'rank-n'}">${i+1}</div>
      <div class="top-prod-info"><div class="top-prod-name">${p.n}</div><div class="top-prod-cat">${p.cat}</div></div>
      <div class="top-prog"><div class="top-prog-fill" style="width:${Math.round((p.sold||0)/maxSold*100)}%"></div></div>
      <div class="top-units">${p.sold} sold</div>
    </div>`).join('');
}

function renderReports(){
  var max=Math.max(1, ...MONTHLY.map(m=>m.v));
  document.getElementById('report-monthly').innerHTML=MONTHLY.map(m=>`
    <div class="monthly-table-row">
      <div class="mt-month">${m.m}</div>
      <div class="mt-bar-wrap"><div class="mt-bar" style="width:${Math.round(m.v/max*100)}%;transition:width .6s"><div class="mt-orders">${m.orders}</div></div></div>
      <div class="mt-val">₹${(m.v/1000).toFixed(1)}k</div>
    </div>`).join('');
  var totalUnits = TOP_PRODS.reduce((s,p)=>s+(p.sold||0),0);
  document.getElementById('report-cats').innerHTML=`
    <div class="mini-pie"><div class="mini-pie-inner">${totalUnits} units</div></div>
    <div class="pie-legend">${CATS.map(c=>`
      <div class="legend-row">
        <div class="legend-label"><div class="legend-dot" style="background:${c.color}"></div>${c.c}</div>
        <div class="legend-pct">${c.pct}%</div>
      </div>`).join('')}
    </div>`;
  document.getElementById('top-products-table').innerHTML=TOP_PRODS.map((p,i)=>`
    <tr>
      <td><div class="top-rank ${i===0?'rank-1':i===1?'rank-2':i===2?'rank-3':'rank-n'}" style="display:inline-flex">${i+1}</div></td>
      <td style="font-weight:500">${p.n}</td>
      <td>${p.cat}</td>
      <td style="font-weight:700;color:var(--green-dark)">${p.sold}</td>
      <td style="font-weight:700;color:var(--green-dark)">₹${(p.rev||0).toLocaleString('en-IN')}</td>
    </tr>`).join('');
}

/* =========================
   CUSTOMERS (derived from orders on backend)
   ========================= */
async function fetchCustomers(){
  var data = await apiFetch('/api/admin/customers');
  CUSTOMERS = (data || []).map(function(c){
    return {
      name: c.name, phone: c.phone, city: c.city,
      orders: c.orders, spent: c.spent,
      last: c.last ? new Date(c.last).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}) : ''
    };
  });
}
function renderCustomers(){
  document.getElementById('customers-table').innerHTML=CUSTOMERS.map(c=>`<tr>
    <td style="font-weight:500">${c.name}</td>
    <td style="color:var(--text-muted);font-size:12px">${c.phone}</td>
    <td>${c.city}</td>
    <td style="text-align:center;font-weight:600">${c.orders}</td>
    <td style="font-weight:700;color:var(--green-dark)">₹${(c.spent||0).toLocaleString('en-IN')}</td>
    <td style="color:var(--text-muted);font-size:12px">${c.last}</td>
  </tr>`).join('');
}

/* ── TOAST ── */
function showToast(msg,type){
  var t=document.getElementById('toast');
  t.textContent=msg;
  t.className='toast'+(type==='error'?' error':'');
  t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'),3000);
}

/* ── ESC ── */
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){ closeProdModal(); closeDeliveryModal(); }
});

/* =========================
   FORGOT PASSWORD (phone + OTP)
   ========================= */
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

/* =========================
   LOGIN / LOGOUT
   ========================= */
doLogin = async function(){
  var emailInput = document.getElementById('l-user');
  var passInput  = document.getElementById('l-pass');
  var errBox     = document.getElementById('login-err');
  var btn        = document.querySelector('.btn-login');

  var email = emailInput.value.trim();
  var password = passInput.value;

  errBox.style.display = 'none';
  errBox.textContent = 'Invalid credentials.';

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