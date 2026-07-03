/* ── LIVE BACKEND CONFIG ──
   Your Express/Mongoose backend on Render. All admin auth requests
   (login, forgot-password OTP flow) go here. */
var API_BASE = 'https://stackblitz-zentra-client-0.onrender.com';

/* ── LIVE DATA STORES ── */
var PRODUCTS = [];
var ORDERS = [];
var CUSTOMERS = [];
var MONTHLY = [];
var CATS = [];
var TOP_PRODS = [];

var editingId = null;

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
    fetchCustomers()
  ]);

  renderDashboard();
  renderProdsTable(PRODUCTS);
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
      MONTHLY = stats.monthlyRevenue || [];
      CATS = stats.categoryDistribution || [];
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
  document.querySelectorAll('.tab-page').forEach(t=>t.classList.remove('active'));
  document.getElementById('tab-'+name).classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
  if(navEl) navEl.classList.add('active');
  closeSidebar();
  var titles={dashboard:'Dashboard',products:'Products',orders:'Orders',reports:'Sales Reports',customers:'Customers'};
  document.getElementById('page-title').textContent=titles[name];
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
      <td style="font-weight:700;color:var(--green-dark)">₹${(o.totalAmount || 0).toLocaleString('en-IN')}</td>
      <td><span class="badge badge-${(o.orderStatus || 'pending').toLowerCase()}">${o.orderStatus}</span></td>
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

/* ── PRODUCTS ── */
function renderProdsTable(list){
  document.getElementById('prod-table-sub').textContent=`${list.length} of ${PRODUCTS.length} products`;
  document.getElementById('prod-count').textContent=PRODUCTS.length;
  document.getElementById('prod-table-body').innerHTML=list.map(p=>{
    var mktPrice = p.mrp || p.price || 0;
    var disc = mktPrice > 0 ? Math.round((1 - p.price / mktPrice) * 100) : 0;
    var stockStatus = p.stock > 10 ? 'In Stock' : p.stock > 0 ? 'Low Stock' : 'Out of Stock';
    var stockClass = p.stock > 10 ? 'badge-in' : p.stock > 0 ? 'badge-low' : 'badge-out';

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
    document.getElementById('pm-stock').value=p.stock;
    document.getElementById('img-preview').innerHTML=`<img src="${p.image}" alt="">`;
  } else {
    ['pm-name','pm-price','pm-mrp','pm-fabric','pm-care','pm-desc'].forEach(f=>document.getElementById(f).value='');
    document.getElementById('pm-stock').value = 10;
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
  var mrp=parseInt(document.getElementById('pm-mrp').value)||price;
  var stock=parseInt(document.getElementById('pm-stock').value)||0;
  
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
    description: document.getElementById('pm-desc').value,
    image: image,
    fabric: document.getElementById('pm-fabric').value,
    care: document.getElementById('pm-care').value
  };

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
    
    return `<tr>
      <td style="font-weight:600;color:var(--green-dark)">${o.orderNumber || o._id}</td>
      <td>${o.shipping?.fullName || 'Anonymous'}<br><span style="font-size:11px;color:var(--text-muted)">${o.shipping?.phone || ''}</span></td>
      <td><div style="max-width:200px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${itemsSummary}">${itemsSummary}</div></td>
      <td style="font-weight:700">₹${(o.totalAmount || 0).toLocaleString('en-IN')}</td>
      <td style="color:var(--text-muted);font-size:12px">${formattedDate}</td>
      <td>
        <select onchange="updateOrderStatus('${o._id}',this.value)" style="padding:5px 10px;border:1px solid var(--border);border-radius:4px;font-size:12px;background:white" >
          ${['Processing','Shipped','Delivered','Cancelled'].map(s=>`<option ${o.orderStatus===s?'selected':''}>${s}</option>`).join('')}
        </select>
      </td>
      <td><button class="btn-view" onclick="alert('Order Details:\\nContact Name: ${o.shipping?.fullName}\\nAddress: ${o.shipping?.addressLine}, ${o.shipping?.city}\\nPayment Method: ${o.paymentMethod.toUpperCase()}')">View</button></td>
    </tr>`;
  }).join('');
}

async function updateOrderStatus(id, status){
  try {
    var res = await fetch(API_BASE + '/api/orders/' + id + '/status', {
      method: 'PATCH',
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
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeProdModal();});

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
