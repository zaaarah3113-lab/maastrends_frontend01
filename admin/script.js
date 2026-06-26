/* ── LIVE BACKEND CONFIG ──
   Your Express/Mongoose backend on Render. All admin auth requests
   (login, forgot-password OTP flow) go here. */
var API_BASE = 'https://stackblitz-zentra-client-0.onrender.com';

/* ── DATA ── */
var PRODUCTS = [
  {id:1,name:'Silk Banarasi Saree',cat:'Saree',price:1299,mrp:1799,stock:'In Stock',fabric:'Pure Silk',care:'Dry Clean',desc:'Luxurious Banarasi silk with golden zari work.',img:'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=60&h=80&fit=crop'},
  {id:2,name:'Chiffon Floral Saree',cat:'Saree',price:999,mrp:1499,stock:'In Stock',fabric:'Chiffon',care:'Hand Wash',desc:'Light georgette with vibrant floral print.',img:'https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=60&h=80&fit=crop'},
  {id:3,name:'Premium Satin Nighty',cat:'Nighty',price:649,mrp:899,stock:'In Stock',fabric:'Satin',care:'Machine Wash',desc:'Silky smooth satin nightwear with lace trim.',img:'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=60&h=80&fit=crop'},
  {id:4,name:'Cotton Comfort Nighty',cat:'Nighty',price:549,mrp:799,stock:'Low Stock',fabric:'Cotton',care:'Machine Wash',desc:'Breathable pure cotton nighty.',img:'https://images.unsplash.com/photo-1617627143233-40bf37f93fb1?w=60&h=80&fit=crop'},
  {id:5,name:'Chiffon Hijab Pack (3)',cat:'Hijab',price:699,mrp:999,stock:'In Stock',fabric:'Chiffon',care:'Hand Wash',desc:'Set of 3 premium chiffon hijabs.',img:'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=60&h=80&fit=crop'},
  {id:6,name:'Jersey Instant Hijab',cat:'Hijab',price:399,mrp:599,stock:'In Stock',fabric:'Jersey',care:'Machine Wash',desc:'Stretchy jersey hijab, no pins needed.',img:'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=60&h=80&fit=crop'},
  {id:7,name:'Embroidered Anarkali Set',cat:'Anarkali',price:1899,mrp:2499,stock:'In Stock',fabric:'Georgette',care:'Dry Clean',desc:'Stunning floor-length anarkali.',img:'https://images.unsplash.com/photo-1617627143233-40bf37f93fb1?w=60&h=80&fit=crop'},
  {id:8,name:'Bridal 3-Piece Lehenga',cat:'3-Piece Set',price:3499,mrp:4999,stock:'Low Stock',fabric:'Raw Silk',care:'Dry Clean',desc:'Complete bridal lehenga set.',img:'https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=60&h=80&fit=crop'},
  {id:9,name:'Festive Salwar 3-Piece',cat:'3-Piece Set',price:1599,mrp:2199,stock:'In Stock',fabric:'Cotton Blend',care:'Hand Wash',desc:'Elegant salwar kameez set with dupatta.',img:'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=60&h=80&fit=crop'},
  {id:10,name:'Kota Doria Saree',cat:'Saree',price:1149,mrp:1599,stock:'In Stock',fabric:'Kota Doria',care:'Hand Wash',desc:'Traditional Kota Doria saree.',img:'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=60&h=80&fit=crop'},
  {id:11,name:'Printed Anarkali Kurti',cat:'Anarkali',price:1199,mrp:1699,stock:'Out of Stock',fabric:'Rayon',care:'Machine Wash',desc:'Flared anarkali kurti with block print.',img:'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=60&h=80&fit=crop'},
  {id:12,name:'Premium Modal Hijab',cat:'Hijab',price:499,mrp:699,stock:'In Stock',fabric:'Modal',care:'Machine Wash',desc:'Ultra-soft modal hijab.',img:'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=60&h=80&fit=crop'},
];
var ORDERS = [
  {id:'#MT-00124',cust:'Amira Sheikh',phone:'+91 98765 11111',city:'Madurai',prod:'Embroidered Anarkali Set',amt:1899,date:'16 Jun 2026',status:'Processing'},
  {id:'#MT-00123',cust:'Zara Begum',phone:'+91 98765 22222',city:'Chennai',prod:'Silk Banarasi Saree',amt:1299,date:'15 Jun 2026',status:'Shipped'},
  {id:'#MT-00122',cust:'Noor Fatima',phone:'+91 98765 33333',city:'Coimbatore',prod:'Cotton Comfort Nighty',amt:549,date:'15 Jun 2026',status:'Delivered'},
  {id:'#MT-00121',cust:'Hana Ismail',phone:'+91 98765 44444',city:'Trichy',prod:'Chiffon Hijab Pack',amt:699,date:'14 Jun 2026',status:'Delivered'},
  {id:'#MT-00120',cust:'Riya Patel',phone:'+91 98765 55555',city:'Salem',prod:'Bridal 3-Piece Lehenga',amt:3499,date:'14 Jun 2026',status:'Shipped'},
  {id:'#MT-00119',cust:'Sana Mir',phone:'+91 98765 66666',city:'Madurai',prod:'Kota Doria Saree',amt:1149,date:'13 Jun 2026',status:'Delivered'},
  {id:'#MT-00118',cust:'Priya Raj',phone:'+91 98765 77777',city:'Erode',prod:'Premium Satin Nighty',amt:649,date:'13 Jun 2026',status:'Processing'},
  {id:'#MT-00117',cust:'Fatima Ali',phone:'+91 98765 88888',city:'Vellore',prod:'Festive Salwar 3-Piece',amt:1599,date:'12 Jun 2026',status:'Delivered'},
  {id:'#MT-00116',cust:'Meera Das',phone:'+91 98765 99999',city:'Tirunelveli',prod:'Jersey Instant Hijab',amt:399,date:'12 Jun 2026',status:'Cancelled'},
  {id:'#MT-00115',cust:'Sara Khan',phone:'+91 98765 10101',city:'Chennai',prod:'Printed Anarkali Kurti',amt:1199,date:'11 Jun 2026',status:'Delivered'},
];
var CUSTOMERS = [
  {name:'Amira Sheikh',phone:'+91 98765 11111',city:'Madurai',orders:8,spent:12450,last:'16 Jun 2026'},
  {name:'Zara Begum',phone:'+91 98765 22222',city:'Chennai',orders:5,spent:6799,last:'15 Jun 2026'},
  {name:'Noor Fatima',phone:'+91 98765 33333',city:'Coimbatore',orders:3,spent:2847,last:'15 Jun 2026'},
  {name:'Hana Ismail',phone:'+91 98765 44444',city:'Trichy',orders:6,spent:5699,last:'14 Jun 2026'},
  {name:'Riya Patel',phone:'+91 98765 55555',city:'Salem',orders:2,spent:5098,last:'14 Jun 2026'},
  {name:'Sara Khan',phone:'+91 98765 10101',city:'Chennai',orders:11,spent:18230,last:'11 Jun 2026'},
];
var MONTHLY = [
  {m:'Jan',v:42000,orders:165},{m:'Feb',v:38000,orders:149},{m:'Mar',v:55000,orders:216},
  {m:'Apr',v:61000,orders:239},{m:'May',v:72000,orders:282},{m:'Jun',v:84250,orders:330}
];
var CATS = [{c:'Sarees',pct:32,color:'#0d5c45'},{c:'Anarkalis',pct:24,color:'#2db892'},{c:'Nighties',pct:20,color:'#c8a96e'},{c:'3-Piece Sets',pct:14,color:'#3b82f6'},{c:'Hijabs',pct:10,color:'#e24b4a'}];
var TOP_PRODS = [{n:'Bridal 3-Piece Lehenga',cat:'3-Piece Set',sold:92,rev:321908},{n:'Embroidered Anarkali',cat:'Anarkali',sold:78,rev:148122},{n:'Silk Banarasi Saree',cat:'Saree',sold:65,rev:84435},{n:'Kota Doria Saree',cat:'Saree',sold:54,rev:62046},{n:'Chiffon Hijab Pack',cat:'Hijab',sold:41,rev:28659}];

var editingId = null;

/* ── LOGIN ──
   Real login lives near the bottom of this file (doLogin / doLogout),
   wired up to the live backend on Render. */

/* ── INIT ── */
function initAdmin(){
  document.getElementById('top-date').textContent = new Date().toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short',year:'numeric'});
  document.getElementById('prod-count').textContent=PRODUCTS.length;
  renderDashboard();
  renderProdsTable(PRODUCTS);
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
  closeSidebar(); /* ← auto-hide sidebar on mobile after navigating */
  var titles={dashboard:'Dashboard',products:'Products',orders:'Orders',reports:'Sales Reports',customers:'Customers'};
  document.getElementById('page-title').textContent=titles[name];
}

/* ── DASHBOARD ── */
function renderDashboard(){
  var maxV=Math.max(...MONTHLY.map(m=>m.v));
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
      <td style="font-weight:600">${o.id}</td>
      <td>${o.cust}<br><span style="font-size:11px;color:var(--text-muted)">${o.city}</span></td>
      <td style="font-weight:700;color:var(--green-dark)">₹${o.amt.toLocaleString('en-IN')}</td>
      <td><span class="badge badge-${o.status.toLowerCase()}">${o.status}</span></td>
    </tr>`).join('')}</tbody>`;
  document.getElementById('top-products-list').innerHTML=TOP_PRODS.map((p,i)=>`
    <div class="top-prod-row">
      <div class="top-rank ${i===0?'rank-1':i===1?'rank-2':i===2?'rank-3':'rank-n'}">${i+1}</div>
      <div class="top-prod-info"><div class="top-prod-name">${p.n}</div><div class="top-prod-cat">${p.cat}</div></div>
      <div class="top-prog"><div class="top-prog-fill" style="width:${Math.round(p.sold/92*100)}%"></div></div>
      <div class="top-units">${p.sold} sold</div>
    </div>`).join('');
}

/* ── PRODUCTS ── */
function renderProdsTable(list){
  document.getElementById('prod-table-sub').textContent=`${list.length} of ${PRODUCTS.length} products`;
  document.getElementById('prod-count').textContent=PRODUCTS.length;
  document.getElementById('prod-table-body').innerHTML=list.map(p=>{
    var disc=Math.round((1-p.price/p.mrp)*100);
    return `<tr>
      <td><div style="display:flex;align-items:center;gap:12px"><img class="prod-thumb" src="${p.img}" alt="${p.name}"><div><div style="font-weight:500;font-size:13px">${p.name}</div><div style="font-size:11px;color:var(--text-muted)">${p.fabric}</div></div></div></td>
      <td>${p.cat}</td>
      <td style="font-weight:700;color:var(--green-dark)">₹${p.price.toLocaleString('en-IN')}</td>
      <td style="text-decoration:line-through;color:var(--text-muted)">₹${p.mrp.toLocaleString('en-IN')}</td>
      <td><span style="color:var(--green-dark);font-weight:600">${disc}% off</span></td>
      <td><span class="badge ${p.stock==='In Stock'?'badge-in':p.stock==='Low Stock'?'badge-low':'badge-out'}">${p.stock}</span></td>
      <td><div class="action-btns"><button class="btn-edit" onclick="openProdModal(${p.id})">Edit</button><button class="btn-del" onclick="deleteProd(${p.id})">Delete</button></div></td>
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
  editingId=id;
  document.getElementById('pm-title').textContent=id?'Edit Product':'Add Product';
  document.getElementById('img-preview').innerHTML='<div class="img-preview-placeholder"><span>🖼️</span><p>Click to upload product image</p></div>';
  if(id){
    var p=PRODUCTS.find(x=>x.id===id);
    document.getElementById('pm-name').value=p.name;
    document.getElementById('pm-cat').value=p.cat;
    document.getElementById('pm-price').value=p.price;
    document.getElementById('pm-mrp').value=p.mrp;
    document.getElementById('pm-fabric').value=p.fabric;
    document.getElementById('pm-care').value=p.care;
    document.getElementById('pm-desc').value=p.desc;
    document.getElementById('pm-stock').value=p.stock;
    document.getElementById('img-preview').innerHTML=`<img src="${p.img}" alt="">`;
  } else {
    ['pm-name','pm-price','pm-mrp','pm-fabric','pm-care','pm-desc'].forEach(f=>document.getElementById(f).value='');
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
function saveProd(){
  var name=document.getElementById('pm-name').value.trim();
  var price=parseInt(document.getElementById('pm-price').value)||0;
  var mrp=parseInt(document.getElementById('pm-mrp').value)||0;
  if(!name){showToast('Product name is required','error');return;}
  if(!price){showToast('Price is required','error');return;}
  var imgEl=document.querySelector('#img-preview img');
  var img=imgEl?imgEl.src:'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=60&h=80&fit=crop';
  if(editingId){
    var p=PRODUCTS.find(x=>x.id===editingId);
    p.name=name;p.cat=document.getElementById('pm-cat').value;
    p.price=price;p.mrp=mrp;
    p.fabric=document.getElementById('pm-fabric').value;
    p.care=document.getElementById('pm-care').value;
    p.desc=document.getElementById('pm-desc').value;
    p.stock=document.getElementById('pm-stock').value;
    p.img=img;
    showToast('Product updated successfully');
  } else {
    PRODUCTS.push({id:Date.now(),name,cat:document.getElementById('pm-cat').value,price,mrp,
      fabric:document.getElementById('pm-fabric').value,care:document.getElementById('pm-care').value,
      desc:document.getElementById('pm-desc').value,stock:document.getElementById('pm-stock').value,img});
    showToast('Product added successfully');
  }
  closeProdModal();renderProdsTable(PRODUCTS);renderDashboard();
}
function deleteProd(id){
  if(!confirm('Are you sure you want to delete this product?'))return;
  var i=PRODUCTS.findIndex(x=>x.id===id);
  PRODUCTS.splice(i,1);
  renderProdsTable(PRODUCTS);renderDashboard();
  showToast('Product deleted');
}

/* ── ORDERS ── */
function renderOrders(){
  var filter=document.getElementById('order-filter').value;
  var list=filter?ORDERS.filter(o=>o.status===filter):ORDERS;
  document.getElementById('orders-table-body').innerHTML=list.map(o=>`<tr>
    <td style="font-weight:600;color:var(--green-dark)">${o.id}</td>
    <td>${o.cust}<br><span style="font-size:11px;color:var(--text-muted)">${o.phone}</span></td>
    <td>${o.prod}</td>
    <td style="font-weight:700">₹${o.amt.toLocaleString('en-IN')}</td>
    <td style="color:var(--text-muted);font-size:12px">${o.date}</td>
    <td>
      <select onchange="updateOrderStatus('${o.id}',this.value)" style="padding:5px 10px;border:1px solid var(--border);border-radius:4px;font-size:12px;background:white" >
        ${['Processing','Shipped','Delivered','Cancelled'].map(s=>`<option ${o.status===s?'selected':''}>${s}</option>`).join('')}
      </select>
    </td>
    <td><button class="btn-view">View</button></td>
  </tr>`).join('');
}
function updateOrderStatus(id,status){
  var o=ORDERS.find(x=>x.id===id);
  if(o){o.status=status;showToast(`Order ${id} marked as ${status}`);}
}

/* ── REPORTS ── */
function renderReports(){
  var max=Math.max(...MONTHLY.map(m=>m.v));
  document.getElementById('report-monthly').innerHTML=MONTHLY.map(m=>`
    <div class="monthly-table-row">
      <div class="mt-month">${m.m}</div>
      <div class="mt-bar-wrap"><div class="mt-bar" style="width:${Math.round(m.v/max*100)}%;transition:width .6s"><div class="mt-orders">${m.orders}</div></div></div>
      <div class="mt-val">₹${(m.v/1000).toFixed(1)}k</div>
    </div>`).join('');
  document.getElementById('report-cats').innerHTML=`
    <div class="mini-pie"><div class="mini-pie-inner">330 units</div></div>
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
      <td style="font-weight:700;color:var(--green-dark)">₹${p.rev.toLocaleString('en-IN')}</td>
    </tr>`).join('');
}

/* ── CUSTOMERS ── */
function renderCustomers(){
  document.getElementById('customers-table').innerHTML=CUSTOMERS.map(c=>`<tr>
    <td style="font-weight:500">${c.name}</td>
    <td style="color:var(--text-muted);font-size:12px">${c.phone}</td>
    <td>${c.city}</td>
    <td style="text-align:center;font-weight:600">${c.orders}</td>
    <td style="font-weight:700;color:var(--green-dark)">₹${c.spent.toLocaleString('en-IN')}</td>
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
      // Backend returned 400/401/etc — e.g. wrong email or wrong password
      errBox.textContent = data.error || 'Invalid credentials.';
      errBox.style.display = 'block';
      return;
    }

    if(!data.user || data.user.role !== 'admin'){
      errBox.textContent = 'This account does not have admin access.';
      errBox.style.display = 'block';
      return;
    }

    // Success — store the token for authenticated admin requests
    // (creating/editing/deleting products) and enter the dashboard.
    localStorage.setItem('adminToken', data.token);
    localStorage.setItem('adminUser', JSON.stringify(data.user));

    document.getElementById('login-page').style.display = 'none';
    document.getElementById('admin-app').style.display = 'block';
    passInput.value = '';
    initAdmin();

  } catch (err) {
    // Network-level failure: backend unreachable, CORS blocked, no internet, etc.
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