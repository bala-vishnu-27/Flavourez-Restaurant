// ============================================================
// backend-connect.js  — Connects Flavorez frontend to backend
// Customer-first Auth, WhatsApp Order Confirmation, Live Tracking & Invoices
// ============================================================

const API_BASE = 'http://localhost:3000/api';

// ─── Auth Storage Helpers ─────────────────────────────────────
function getAuthToken() { return localStorage.getItem('flz_auth_token'); }
function getAuthUser()  {
  try { return JSON.parse(localStorage.getItem('flz_auth_user') || 'null'); }
  catch { return null; }
}
function setAuth(token, user, adminToken) {
  localStorage.setItem('flz_auth_token', token);
  localStorage.setItem('flz_auth_user', JSON.stringify(user));
  if (adminToken || user.role === 'admin') {
    localStorage.setItem('flz_admin_token', adminToken || Buffer.from('flavorez@admin2026').toString('base64'));
  }
}
function clearAuth() {
  localStorage.removeItem('flz_auth_token');
  localStorage.removeItem('flz_auth_user');
  localStorage.removeItem('flz_admin_token');
}

// ─── Modal Show / Hide ────────────────────────────────────────
function showAuthModal(defaultTab = 'login') {
  const m = document.getElementById('flzAuthModal');
  if (m) {
    m.style.display = 'flex';
    switchTab(defaultTab);
  }
}
function hideAuthModal() {
  const m = document.getElementById('flzAuthModal');
  if (m) m.style.display = 'none';
}

function showOrdersModal() {
  const m = document.getElementById('flzOrdersModal');
  if (m) {
    m.style.display = 'flex';
    loadUserOrders();
  }
}
function hideOrdersModal() {
  const m = document.getElementById('flzOrdersModal');
  if (m) m.style.display = 'none';
}

// ─── Inject Auth Modal + Orders Modal UI ──────────────────────
(function injectModals() {
  // 1. Customer-Friendly Auth Modal (Clean, No loud admin tab for normal users)
  const authModal = document.createElement('div');
  authModal.id = 'flzAuthModal';
  authModal.style.cssText = `position:fixed;inset:0;background:rgba(0,0,0,0.78);backdrop-filter:blur(8px);display:none;align-items:center;justify-content:center;z-index:99999;font-family:Inter,sans-serif;`;
  authModal.innerHTML = `
    <div style="background:#17171e;border:1px solid #2b2b38;border-radius:24px;padding:36px;width:420px;max-width:92vw;box-shadow:0 25px 70px rgba(0,0,0,0.7);position:relative;">
      <button onclick="hideAuthModal()" style="position:absolute;top:18px;right:18px;background:none;border:none;color:#8e8e9f;font-size:20px;cursor:pointer;line-height:1;">✕</button>
      
      <div style="font-size:24px;font-weight:900;background:linear-gradient(135deg,#e23744,#ff7e1d);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:4px;">FLAVOUREZ</div>
      <div style="color:#8e8e9f;font-size:13px;margin-bottom:20px;">Sign in to enjoy faster checkout, rewards & tracking</div>

      <!-- Public Tabs (Only Login & Register for normal customers) -->
      <div id="flzAuthTabs" style="display:flex;gap:4px;margin-bottom:20px;background:#0d0d11;border-radius:12px;padding:4px;border:1px solid #2b2b38;">
        <button onclick="switchTab('login')" id="tabLogin" style="flex:1;padding:9px;border:none;border-radius:9px;background:linear-gradient(135deg,#e23744,#ff7e1d);color:#fff;font-weight:700;font-size:13px;cursor:pointer;">Sign In</button>
        <button onclick="switchTab('register')" id="tabRegister" style="flex:1;padding:9px;border:none;border-radius:9px;background:transparent;color:#8e8e9f;font-weight:600;font-size:13px;cursor:pointer;">Register</button>
      </div>

      <!-- Customer Login Form -->
      <div id="flzLoginForm">
        <input id="authEmail" type="email" placeholder="Email Address (e.g. karthik@example.com)" style="${inputStyle()}">
        <input id="authPassword" type="password" placeholder="Password" style="${inputStyle()}">
        <button onclick="doAuthLogin()" id="authLoginBtn" style="${btnStyle()}">🔐 Sign In</button>
      </div>

      <!-- Register Form -->
      <div id="flzRegisterForm" style="display:none;">
        <input id="regName" type="text" placeholder="Full Name" style="${inputStyle()}">
        <input id="regEmail" type="email" placeholder="Email Address" style="${inputStyle()}">
        <input id="regPhone" type="tel" placeholder="Mobile Phone (10 digits)" style="${inputStyle()}">
        <input id="regPassword" type="password" placeholder="Create Password (min 6 chars)" style="${inputStyle()}">
        <button onclick="doAuthRegister()" id="authRegBtn" style="${btnStyle()}">🚀 Create Account</button>
      </div>

      <!-- Secret Admin Form (Hidden by default) -->
      <div id="flzAdminForm" style="display:none;">
        <p style="color:#f59e0b;font-size:13px;margin-bottom:12px;font-weight:700;">👑 Administrator Portal Login</p>
        <input id="adminPassInput" type="password" placeholder="Admin Password" value="flavorez@admin2026" style="${inputStyle()}">
        <button onclick="doAdminQuickLogin()" style="${btnStyle()}">👑 Open Admin Console</button>
      </div>

      <p id="authMsg" style="font-size:13px;margin-top:14px;font-weight:600;text-align:center;min-height:18px;"></p>

      <div style="text-align:center; margin-top:16px; border-top:1px solid #22222d; padding-top:12px;">
        <a href="javascript:void(0)" onclick="switchTab('admin')" style="color:#555566; font-size:11px; text-decoration:none;">Restaurant Staff / Admin?</a>
      </div>
    </div>
  `;
  document.body.appendChild(authModal);
  authModal.addEventListener('click', e => { if (e.target === authModal) hideAuthModal(); });

  // 2. Past Orders Modal for Customers
  const ordersModal = document.createElement('div');
  ordersModal.id = 'flzOrdersModal';
  ordersModal.style.cssText = `position:fixed;inset:0;background:rgba(0,0,0,0.78);backdrop-filter:blur(8px);display:none;align-items:center;justify-content:center;z-index:99999;font-family:Inter,sans-serif;`;
  ordersModal.innerHTML = `
    <div style="background:#17171e;border:1px solid #2b2b38;border-radius:24px;padding:32px;width:550px;max-width:94vw;max-height:85vh;display:flex;flex-direction:column;box-shadow:0 25px 70px rgba(0,0,0,0.7);position:relative;">
      <button onclick="hideOrdersModal()" style="position:absolute;top:18px;right:18px;background:none;border:none;color:#8e8e9f;font-size:20px;cursor:pointer;line-height:1;">✕</button>
      <div style="font-size:22px;font-weight:800;color:#f4f4f7;margin-bottom:6px;">📦 My Orders & Invoices</div>
      <div style="color:#8e8e9f;font-size:13px;margin-bottom:16px;">View live delivery status, receipts, and WhatsApp updates</div>
      
      <div id="userOrdersList" style="flex:1;overflow-y:auto;padding-right:6px;">
        <div style="text-align:center;color:#8e8e9f;padding:30px;">Loading your orders...</div>
      </div>
    </div>
  `;
  document.body.appendChild(ordersModal);
  ordersModal.addEventListener('click', e => { if (e.target === ordersModal) hideOrdersModal(); });
})();

function inputStyle() {
  return 'width:100%;padding:12px 16px;margin-bottom:12px;border-radius:12px;border:1px solid #2b2b38;background:#0d0d11;color:#f4f4f7;font-size:14px;outline:none;display:block;box-sizing:border-box;font-family:Inter,sans-serif;';
}
function btnStyle() {
  return 'width:100%;padding:13px;border:none;border-radius:12px;background:linear-gradient(135deg,#e23744,#ff7e1d);color:#fff;font-weight:700;font-size:15px;cursor:pointer;font-family:Inter,sans-serif;transition:opacity 0.2s;';
}

function switchTab(tab) {
  const loginForm = document.getElementById('flzLoginForm');
  const regForm = document.getElementById('flzRegisterForm');
  const adminForm = document.getElementById('flzAdminForm');
  const tLogin = document.getElementById('tabLogin');
  const tReg = document.getElementById('tabRegister');
  const msgEl = document.getElementById('authMsg');

  if (msgEl) msgEl.textContent = '';

  if (tLogin) { tLogin.style.background = 'transparent'; tLogin.style.color = '#8e8e9f'; }
  if (tReg)   { tReg.style.background = 'transparent'; tReg.style.color = '#8e8e9f'; }

  if (tab === 'login') {
    loginForm.style.display = 'block';
    regForm.style.display = 'none';
    adminForm.style.display = 'none';
    if (tLogin) { tLogin.style.background = 'linear-gradient(135deg,#e23744,#ff7e1d)'; tLogin.style.color = '#fff'; }
  } else if (tab === 'register') {
    loginForm.style.display = 'none';
    regForm.style.display = 'block';
    adminForm.style.display = 'none';
    if (tReg) { tReg.style.background = 'linear-gradient(135deg,#e23744,#ff7e1d)'; tReg.style.color = '#fff'; }
  } else if (tab === 'admin') {
    loginForm.style.display = 'none';
    regForm.style.display = 'none';
    adminForm.style.display = 'block';
  }
}

// ─── Customer Login ───────────────────────────────────────────
async function doAuthLogin() {
  const email = document.getElementById('authEmail').value.trim();
  const password = document.getElementById('authPassword').value;
  const msgEl = document.getElementById('authMsg');
  const btn = document.getElementById('authLoginBtn');

  if (!email || !password) {
    msgEl.style.color = '#ef4444';
    msgEl.textContent = 'Please enter both email and password.';
    return;
  }

  msgEl.style.color = '#8e8e9f';
  msgEl.textContent = '⏳ Signing in...';
  btn.disabled = true;

  try {
    const r = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const d = await r.json();

    if (!r.ok) {
      msgEl.style.color = '#ef4444';
      msgEl.textContent = d.error || 'Login failed.';
      btn.disabled = false;
      return;
    }

    setAuth(d.token, d.user, d.adminToken);
    msgEl.style.color = '#10b981';
    msgEl.textContent = d.message || '✅ Logged in successfully!';

    setTimeout(() => {
      hideAuthModal();
      updateHeaderAuth();
      autoFillCheckout();
      if (d.isAdmin) {
        window.location.href = 'admin.html';
      }
    }, 600);
  } catch {
    msgEl.style.color = '#ef4444';
    msgEl.textContent = '❌ Backend connection error. Ensure server is running.';
  } finally {
    btn.disabled = false;
  }
}

// ─── Customer Register ────────────────────────────────────────
async function doAuthRegister() {
  const name = document.getElementById('regName').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const phone = document.getElementById('regPhone').value.trim();
  const password = document.getElementById('regPassword').value;
  const msgEl = document.getElementById('authMsg');
  const btn = document.getElementById('authRegBtn');

  if (!name || !email || !phone || !password) {
    msgEl.style.color = '#ef4444';
    msgEl.textContent = 'Please fill out all registration fields.';
    return;
  }

  msgEl.style.color = '#8e8e9f';
  msgEl.textContent = '⏳ Creating account...';
  btn.disabled = true;

  try {
    const r = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, phone, password })
    });
    const d = await r.json();

    if (!r.ok) {
      msgEl.style.color = '#ef4444';
      msgEl.textContent = d.error || 'Registration failed.';
      btn.disabled = false;
      return;
    }

    setAuth(d.token, d.user, d.adminToken);
    msgEl.style.color = '#10b981';
    msgEl.textContent = '🎉 Account created! Welcome to Flavourez.';

    setTimeout(() => {
      hideAuthModal();
      updateHeaderAuth();
      autoFillCheckout();
    }, 800);
  } catch {
    msgEl.style.color = '#ef4444';
    msgEl.textContent = '❌ Server unreachable. Make sure backend is running.';
  } finally {
    btn.disabled = false;
  }
}

// ─── Admin Quick Login ────────────────────────────────────────
async function doAdminQuickLogin() {
  const pass = document.getElementById('adminPassInput').value.trim();
  const msgEl = document.getElementById('authMsg');
  msgEl.style.color = '#8e8e9f';
  msgEl.textContent = '⏳ Verifying admin credentials...';

  try {
    const r = await fetch(`${API_BASE}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pass })
    });
    const d = await r.json();

    if (!r.ok) {
      msgEl.style.color = '#ef4444';
      msgEl.textContent = d.error || 'Invalid admin credentials.';
      return;
    }

    localStorage.setItem('flz_admin_token', d.token);
    const adminUser = { id: 1, name: 'Bala Vishnu (Admin)', email: 'admin@flavorez.com', role: 'admin' };
    localStorage.setItem('flz_auth_user', JSON.stringify(adminUser));

    msgEl.style.color = '#10b981';
    msgEl.textContent = '👑 Admin Access Granted! Redirecting...';
    setTimeout(() => {
      window.location.href = 'admin.html';
    }, 600);
  } catch {
    msgEl.style.color = '#ef4444';
    msgEl.textContent = '❌ Cannot connect to backend server.';
  }
}

// ─── Load User's Past Orders ──────────────────────────────────
async function loadUserOrders() {
  const user = getAuthUser();
  const listEl = document.getElementById('userOrdersList');
  if (!user || !user.phone) {
    listEl.innerHTML = '<div style="text-align:center;color:#8e8e9f;padding:30px;">Please login to view your order history.</div>';
    return;
  }

  listEl.innerHTML = '<div style="text-align:center;color:#8e8e9f;padding:30px;">Loading your orders...</div>';

  try {
    const r = await fetch(`${API_BASE}/orders/history/${user.phone}`);
    const d = await r.json();
    if (!d.orders || !d.orders.length) {
      listEl.innerHTML = `
        <div style="text-align:center;padding:40px 20px;color:#8e8e9f;">
          <div style="font-size:40px;margin-bottom:10px;">🍽️</div>
          <p style="font-size:15px;color:#f4f4f7;margin-bottom:8px;">No orders found for <strong>${user.phone}</strong></p>
          <p style="font-size:13px;margin-bottom:18px;">Craving something tasty? Browse our delicious menu!</p>
          <a href="menu.html" style="display:inline-block;padding:10px 22px;background:linear-gradient(135deg,#e23744,#ff7e1d);color:#fff;border-radius:20px;text-decoration:none;font-weight:700;font-size:13px;">View Menu & Order</a>
        </div>
      `;
      return;
    }

    const badgeColor = { confirmed: '#60a5fa', preparing: '#fbbf24', on_the_way: '#c084fc', delivered: '#34d399', cancelled: '#f87171' };

    listEl.innerHTML = d.orders.map(o => {
      const waMsg = `Hi, I ordered from Flavourez (Tracking ID: ${o.tracking_id}). Status: ${o.status}. Live track: http://localhost:3000/track.html?id=${o.tracking_id}`;
      const waLink = `https://api.whatsapp.com/send?phone=91${(o.phone||'').replace(/\\D/g,'').slice(-10)}&text=${encodeURIComponent(waMsg)}`;

      return `
        <div style="background:#0d0d11;border:1px solid #2b2b38;border-radius:16px;padding:18px;margin-bottom:14px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
            <div>
              <span style="font-size:11px;color:#8e8e9f;text-transform:uppercase;letter-spacing:0.05em;">Tracking ID</span>
              <div style="color:#e23744;font-weight:800;font-size:16px;font-family:monospace;">${o.tracking_id}</div>
            </div>
            <span style="background:${(badgeColor[o.status]||'#888')+'22'};color:${badgeColor[o.status]||'#888'};border:1px solid ${badgeColor[o.status]||'#888'};padding:4px 10px;border-radius:20px;font-size:11px;font-weight:700;text-transform:uppercase;">
              ${o.status.replace('_',' ')}
            </span>
          </div>
          <div style="color:#8e8e9f;font-size:12px;margin-bottom:10px;">
            📅 ${o.created_at} &nbsp;|&nbsp; 💳 ${o.payment_method.toUpperCase()} &nbsp;|&nbsp; <strong style="color:#f4f4f7">₹${o.total}</strong>
          </div>
          <div style="font-size:13px;color:#f4f4f7;margin-bottom:14px;">
            ${Array.isArray(o.items) ? o.items.map(i => `• ${i.name} × ${i.qty}`).join('<br>') : o.items}
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <a href="track.html?id=${o.tracking_id}" style="flex:1;text-align:center;padding:8px;background:rgba(226,55,68,0.15);border:1px solid #e23744;color:#e23744;border-radius:10px;text-decoration:none;font-weight:700;font-size:12px;">🛵 Live Track</a>
            <a href="${API_BASE}/orders/${o.tracking_id}/receipt" target="_blank" style="flex:1;text-align:center;padding:8px;background:#1f1f27;border:1px solid #2b2b38;color:#f4f4f7;border-radius:10px;text-decoration:none;font-weight:600;font-size:12px;">🧾 PDF Invoice</a>
            <a href="${waLink}" target="_blank" style="padding:8px 12px;background:rgba(16,185,129,0.15);border:1px solid #10b981;color:#10b981;border-radius:10px;text-decoration:none;font-weight:700;font-size:12px;">📱 WhatsApp</a>
          </div>
        </div>
      `;
    }).join('');
  } catch {
    listEl.innerHTML = '<div style="text-align:center;color:#ef4444;padding:30px;">❌ Error loading orders.</div>';
  }
}

// ─── Inject User / Admin Status into Header ───────────────────
function updateHeaderAuth() {
  const user = getAuthUser();
  const isAdmin = (user && user.role === 'admin') || Boolean(localStorage.getItem('flz_admin_token'));

  let authContainer = document.getElementById('flzHeaderAuth');
  if (!authContainer) {
    authContainer = document.createElement('div');
    authContainer.id = 'flzHeaderAuth';
    authContainer.style.cssText = 'display:flex;align-items:center;gap:8px;';
    const header = document.querySelector('.main-header');
    if (header) {
      const darkBtn = document.getElementById('darkModeToggle');
      if (darkBtn) header.insertBefore(authContainer, darkBtn);
      else header.appendChild(authContainer);
    }
  }

  if (isAdmin) {
    authContainer.innerHTML = `
      <a href="admin.html" style="background:linear-gradient(135deg,#e23744,#ff7e1d);color:#fff;padding:8px 16px;border-radius:20px;text-decoration:none;font-size:13px;font-weight:800;box-shadow:0 0 15px rgba(226,55,68,0.4);display:flex;align-items:center;gap:6px;font-family:Inter,sans-serif;">
        👑 Admin Panel
      </a>
      <button onclick="doLogout()" title="Sign out" style="background:transparent;border:1px solid #2b2b38;color:#8e8e9f;padding:7px 12px;border-radius:20px;font-size:12px;cursor:pointer;">🚪</button>
    `;
  } else if (user) {
    authContainer.innerHTML = `
      <button onclick="showOrdersModal()" style="background:rgba(226,55,68,0.15);border:1px solid rgba(226,55,68,0.4);color:#e23744;padding:7px 14px;border-radius:20px;font-size:13px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:6px;font-family:Inter,sans-serif;">
        👤 ${user.name.split(' ')[0]} (My Orders)
      </button>
      <button onclick="doLogout()" style="background:transparent;border:1px solid #2b2b38;color:#8e8e9f;padding:7px 12px;border-radius:20px;font-size:12px;cursor:pointer;" title="Logout">🚪</button>
    `;
  } else {
    authContainer.innerHTML = `
      <button onclick="showAuthModal('login')" style="background:linear-gradient(135deg,#e23744,#ff7e1d);color:#fff;padding:8px 18px;border-radius:20px;border:none;font-size:13px;font-weight:700;cursor:pointer;box-shadow:0 4px 15px rgba(226,55,68,0.25);font-family:Inter,sans-serif;">
        🔐 Sign In / Register
      </button>
    `;
  }
}

function doLogout() {
  clearAuth();
  updateHeaderAuth();
  if (window.location.pathname.includes('admin.html')) {
    window.location.reload();
  }
}

// ─── Auto-fill Checkout on order.html ─────────────────────────
function autoFillCheckout() {
  const user = getAuthUser();
  if (!user) return;
  const nameInput = document.getElementById('fullname');
  const phoneInput = document.getElementById('phone');
  const emailInput = document.getElementById('email');

  if (nameInput && !nameInput.value) nameInput.value = user.name || '';
  if (phoneInput && !phoneInput.value) phoneInput.value = user.phone || '';
  if (emailInput && !emailInput.value) emailInput.value = user.email || '';
}

// ─── ORDER FORM: Live Submission to Express Backend ───────────
(function patchOrderForm() {
  const orderForm = document.getElementById('orderForm');
  if (!orderForm) return;

  orderForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    e.stopImmediatePropagation();

    const user = getAuthUser();
    const cart = JSON.parse(localStorage.getItem('flavourez_cart') || '[]');
    if (!cart.length) {
      alert('Your cart is empty! Please add items from the Menu.');
      return;
    }

    const submitBtn = orderForm.querySelector('button[type="submit"]');
    const origText = submitBtn.textContent;
    submitBtn.textContent = '⏳ Placing order & generating WhatsApp ticket...';
    submitBtn.disabled = true;

    const formData = new FormData(orderForm);
    let subtotal = 0;
    cart.forEach(i => { subtotal += i.price * i.qty; });

    const promoCode = window.activeAppliedPromo || '';
    let discount = 0;
    if (promoCode && window.activeAppliedPromoDiscount) discount = window.activeAppliedPromoDiscount;
    const total = Math.max(0, subtotal - discount);

    const body = {
      name: formData.get('fullname') || document.getElementById('fullname')?.value,
      phone: formData.get('phone') || document.getElementById('phone')?.value,
      email: formData.get('email') || document.getElementById('email')?.value,
      address: formData.get('address') || document.getElementById('address')?.value,
      items: JSON.stringify(cart),
      subtotal, discount, total,
      promo_code: promoCode || null,
      payment_method: formData.get('payment') || document.getElementById('payment')?.value || 'cod',
      order_type: formData.get('ordertype') || 'delivery',
      instructions: formData.get('instructions') || document.getElementById('instructions')?.value || '',
      upi_txn_id: document.getElementById('upiTxnId')?.value || null,
      user_id: user ? user.id : null
    };

    try {
      const r = await fetch(`${API_BASE}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const d = await r.json();

      submitBtn.textContent = origText;
      submitBtn.disabled = false;

      if (!r.ok) {
        document.getElementById('orderSuccess').innerHTML = `<span style="color:#ef4444">❌ ${d.error}</span>`;
        return;
      }

      // Redeem promo code
      if (promoCode) {
        await fetch(`${API_BASE}/promo/redeem`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: promoCode, phone: body.phone, order_id: d.order_id })
        });
      }

      localStorage.setItem('flavourez_last_order', d.tracking_id);
      localStorage.setItem('flavourez_last_order_id', d.order_id);

      window.activeAppliedPromo = null;
      window.activeAppliedPromoDiscount = 0;

      const successMsg = document.getElementById('orderSuccess');
      successMsg.innerHTML = `
        <div style="background:linear-gradient(135deg,rgba(16,185,129,0.12),rgba(16,185,129,0.05));border:1px solid #10b981;border-radius:20px;padding:26px;text-align:center;margin-top:16px;">
          <div style="font-size:48px;margin-bottom:10px;">🎉</div>
          <h3 style="color:#10b981;font-size:22px;font-weight:800;margin-bottom:6px;">Order Placed Successfully!</h3>
          <p style="color:#f4f4f7;margin-bottom:14px;">Your order has been transmitted to our kitchen live 🍳</p>
          
          <div style="background:rgba(226,55,68,0.12);border:2px dashed #e23744;border-radius:14px;padding:14px 24px;margin:10px 0 20px;display:inline-block;">
            <p style="color:#8e8e9f;font-size:11px;margin-bottom:4px;text-transform:uppercase;letter-spacing:0.08em;">Tracking ID</p>
            <strong style="color:#e23744;font-size:28px;letter-spacing:3px;font-family:monospace;">${d.tracking_id}</strong>
          </div>

          <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;">
            <a href="track.html?id=${d.tracking_id}" style="background:linear-gradient(135deg,#e23744,#ff7e1d);color:#fff;padding:12px 22px;border-radius:20px;text-decoration:none;font-weight:700;font-size:14px;">
              🛵 Live Track Order
            </a>
            <a href="${API_BASE}/orders/${d.tracking_id}/receipt" target="_blank" style="background:#1d1d26;border:1px solid #2b2b38;color:#f4f4f7;padding:12px 20px;border-radius:20px;text-decoration:none;font-weight:600;font-size:14px;">
              🧾 PDF Invoice
            </a>
          </div>
        </div>
      `;

      orderForm.reset();
      localStorage.removeItem('flavourez_cart');
      if (typeof renderOrderCart === 'function') renderOrderCart();
      successMsg.scrollIntoView({ behavior: 'smooth' });

    } catch (err) {
      submitBtn.textContent = origText;
      submitBtn.disabled = false;
      document.getElementById('orderSuccess').innerHTML = `<span style="color:#ef4444">❌ Cannot connect to backend server.</span>`;
    }
  }, true);
})();

// ─── PROMO CODE ENGINE ────────────────────────────────────────
(function patchPromoCode() {
  const applyBtn = document.getElementById('applyPromoBtn');
  if (!applyBtn) return;

  applyBtn.addEventListener('click', async function (e) {
    e.stopImmediatePropagation();
    const code = document.getElementById('promoCodeInput').value.trim().toUpperCase();
    const msgEl = document.getElementById('promoMsg');
    const phone = document.getElementById('phone')?.value || '';

    const cart = JSON.parse(localStorage.getItem('flavourez_cart') || '[]');
    let subtotal = 0;
    cart.forEach(i => { subtotal += i.price * i.qty; });

    msgEl.style.color = '#aaa';
    msgEl.textContent = '⏳ Validating code...';

    try {
      const r = await fetch(`${API_BASE}/promo/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, subtotal, phone })
      });
      const d = await r.json();

      if (!r.ok) {
        msgEl.style.color = '#ef4444';
        msgEl.textContent = d.error || 'Invalid promo code.';
        window.activeAppliedPromo = null;
        return;
      }

      window.activeAppliedPromo = code;
      window.activeAppliedPromoDiscount = d.discount;
      msgEl.style.color = '#10b981';
      msgEl.textContent = d.message;

      const cartTotal = document.getElementById('cartTotal');
      if (cartTotal) {
        cartTotal.innerHTML = `<strong>Subtotal:</strong> ₹${subtotal} &nbsp;|&nbsp; <span style="color:#10b981">Discount (${code}): -₹${d.discount}</span> &nbsp;|&nbsp; <strong style="color:#e23744">Total: ₹${(subtotal - d.discount).toFixed(2)}</strong>`;
      }
    } catch {
      msgEl.style.color = '#ef4444';
      msgEl.textContent = '❌ Cannot connect to server.';
    }
  }, true);
})();

// ─── TRACK PAGE: Real-Time Timeline, WhatsApp & PDF Receipt ───
(function patchTrackPage() {
  const trackBtn = document.getElementById('trackBtn');
  if (!trackBtn) return;

  const urlParams = new URLSearchParams(window.location.search);
  const urlId = urlParams.get('id');
  if (urlId) {
    const inp = document.getElementById('trackInput');
    if (inp) {
      inp.value = urlId;
      setTimeout(() => trackBtn.click(), 400);
    }
  }

  const lastOrder = localStorage.getItem('flavourez_last_order');
  if (lastOrder && !urlId) {
    const inp = document.getElementById('trackInput');
    if (inp && !inp.value) inp.value = lastOrder;
  }

  trackBtn.addEventListener('click', async function (e) {
    e.stopImmediatePropagation();
    const input = document.getElementById('trackInput').value.trim().toUpperCase();
    const errorEl = document.getElementById('trackError');
    const resultEl = document.getElementById('trackResult');

    if (!input) {
      errorEl.textContent = 'Please enter a Tracking ID.';
      return;
    }

    errorEl.textContent = '';
    trackBtn.textContent = '⏳ Tracking...';
    trackBtn.disabled = true;

    try {
      const r = await fetch(`${API_BASE}/orders/${input}`);
      const d = await r.json();

      trackBtn.textContent = 'Track';
      trackBtn.disabled = false;

      if (!r.ok) {
        errorEl.textContent = d.error || 'Order not found.';
        resultEl.style.display = 'none';
        return;
      }

      resultEl.style.display = 'block';
      document.getElementById('resultId').textContent = '#' + d.tracking_id;

      const statusBadge = resultEl.querySelector('.track-status-badge');
      const statusLabels = { confirmed: '✅ Order Confirmed', preparing: '🍳 Preparing in Kitchen', on_the_way: '🚚 Out for Delivery', delivered: '📦 Delivered Successfully', cancelled: '❌ Order Cancelled' };
      if (statusBadge) statusBadge.textContent = statusLabels[d.status] || d.status;

      const steps = resultEl.querySelectorAll('.status-step');
      const stepKeys = ['confirmed', 'preparing', 'on_the_way', 'delivered'];
      const currentIdx = stepKeys.indexOf(d.status);
      steps.forEach((step, i) => {
        step.className = 'status-step';
        if (i < currentIdx) step.classList.add('done');
        else if (i === currentIdx) step.classList.add('active');
      });

      const summaryEl = document.getElementById('trackOrderSummary');
      if (summaryEl && d.items) {
        const waMsg = `Hi, I am tracking my Flavourez order ${d.tracking_id}. Status: ${d.status}. Live track: http://localhost:3000/track.html?id=${d.tracking_id}`;
        const waLink = `https://api.whatsapp.com/send?phone=91${(d.phone||'').replace(/\\D/g,'').slice(-10)}&text=${encodeURIComponent(waMsg)}`;

        summaryEl.innerHTML = `
          <div style="background:rgba(226,55,68,0.06);border:1px solid rgba(226,55,68,0.25);border-radius:18px;padding:20px;margin:16px 0;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:8px;">
              <h4 style="color:#e23744;margin:0;">📋 Live Order Details</h4>
              <div style="display:flex;gap:8px;">
                <a href="${waLink}" target="_blank" style="padding:6px 14px;background:#25D366;color:#fff;border-radius:8px;font-size:12px;font-weight:700;text-decoration:none;">📱 WhatsApp</a>
                <a href="${API_BASE}/orders/${d.tracking_id}/receipt" target="_blank" style="padding:6px 14px;background:#17171e;border:1px solid #2b2b38;color:#e23744;border-radius:8px;font-size:12px;font-weight:700;text-decoration:none;">🧾 PDF Invoice</a>
              </div>
            </div>
            <p><strong>Customer:</strong> ${d.name} (${d.phone})</p>
            <p><strong>Delivery Address:</strong> ${d.address}</p>
            <p><strong>Payment Method:</strong> ${d.payment_method.toUpperCase()}</p>
            <hr style="border-color:rgba(226,55,68,0.2);margin:10px 0;">
            ${(Array.isArray(d.items) ? d.items : []).map(i => `<p>🍽️ ${i.name} × ${i.qty} — <strong>₹${i.price * i.qty}</strong></p>`).join('')}
            <hr style="border-color:rgba(226,55,68,0.2);margin:10px 0;">
            <p style="font-size:16px;"><strong>Total Paid: <span style="color:#e23744">₹${d.total}</span></strong></p>
            ${d.discount > 0 ? `<p style="color:#10b981">✅ Promo Applied: -₹${d.discount} (${d.promo_code})</p>` : ''}
            ${d.instructions ? `<p style="color:#8e8e9f;font-size:12px;"><strong>Chef Notes:</strong> ${d.instructions}</p>` : ''}
          </div>
        `;
      }

      if (d.timeline) {
        d.timeline.forEach((step, i) => {
          const el = document.getElementById(`ts${i + 1}`);
          if (el) el.textContent = step.time ? step.time : (step.done ? 'Done' : 'Pending...');
        });
      }

      connectTrackWebSocket(d.tracking_id);
      resultEl.scrollIntoView({ behavior: 'smooth', block: 'start' });

    } catch (err) {
      trackBtn.textContent = 'Track';
      trackBtn.disabled = false;
      errorEl.textContent = '❌ Server unreachable. Make sure backend is running.';
    }
  }, true);

  function connectTrackWebSocket(trackingId) {
    if (window._trackWs) try { window._trackWs.close(); } catch {}
    try {
      const ws = new WebSocket('ws://localhost:3000');
      window._trackWs = ws;
      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.type === 'STATUS_UPDATE' && msg.tracking_id === trackingId) {
          showStatusToast(`🔄 Order status updated: ${msg.status.replace('_', ' ').toUpperCase()}`);
          setTimeout(() => { trackBtn.click(); }, 800);
        }
      };
    } catch {}
  }

  function showStatusToast(msg) {
    let toast = document.getElementById('flzTrackToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'flzTrackToast';
      toast.style.cssText = 'position:fixed;bottom:30px;left:50%;transform:translateX(-50%) translateY(80px);background:#10b981;color:#fff;padding:14px 28px;border-radius:14px;font-weight:700;font-size:15px;transition:all 0.4s;z-index:9999;opacity:0;font-family:Inter,sans-serif;box-shadow:0 10px 30px rgba(0,0,0,0.5);';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.style.transform = 'translateX(-50%) translateY(0)';
    toast.style.opacity = '1';
    setTimeout(() => {
      toast.style.transform = 'translateX(-50%) translateY(80px)';
      toast.style.opacity = '0';
    }, 4000);
  }
})();

// ─── CONTACT FORM ─────────────────────────────────────────────
(function patchContactForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    e.stopImmediatePropagation();

    const submitBtn = form.querySelector('button[type="submit"]');
    const origText = submitBtn.textContent;
    submitBtn.textContent = '⏳ Sending...';
    submitBtn.disabled = true;

    const body = {
      name: document.getElementById('cname').value.trim(),
      email: document.getElementById('cemail').value.trim(),
      subject: document.getElementById('csubject')?.value || 'General Inquiry',
      message: document.getElementById('cmessage').value.trim()
    };

    try {
      const r = await fetch(`${API_BASE}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const d = await r.json();
      submitBtn.textContent = origText;
      submitBtn.disabled = false;

      const msgEl = document.getElementById('contactSuccess');
      if (r.ok) {
        msgEl.style.color = '#10b981';
        msgEl.innerHTML = `✅ ${d.message}`;
        form.reset();
      } else {
        msgEl.style.color = '#ef4444';
        msgEl.textContent = d.error || 'Failed to send message.';
      }
    } catch {
      submitBtn.textContent = origText;
      submitBtn.disabled = false;
      document.getElementById('contactSuccess').innerHTML = `<span style="color:#ef4444">❌ Cannot connect to server.</span>`;
    }
  }, true);
})();

// ─── Init on DOMContentLoaded ─────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  updateHeaderAuth();
  autoFillCheckout();
});

console.log('✅ Flavorez Full Connector Initialized');
