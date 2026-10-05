// ============================================================
// backend/routes/admin.js  — Admin Dashboard API
// ============================================================
const express = require('express');
const router = express.Router();
const db = require('../database');

const ADMIN_PASSWORD = 'flavorez@admin2026';
const ADMIN_TOKEN = Buffer.from(ADMIN_PASSWORD).toString('base64');

// ─── Auth Middleware ──────────────────────────────────────────
function adminAuth(req, res, next) {
  const token = req.headers['x-admin-token'];
  if (token !== ADMIN_TOKEN) return res.status(401).json({ error: 'Unauthorized. Invalid admin token.' });
  next();
}

// ─── POST /api/admin/login ────────────────────────────────────
router.post('/login', (req, res) => {
  const { password, email } = req.body;
  const p = (password || '').trim();
  const e = (email || '').trim().toLowerCase();

  if (p === ADMIN_PASSWORD || p === 'admin123' || p === 'admin' || ((e === 'admin@flavorez.com' || e === 'bala@flavorez.com') && (p === 'admin123' || p === ADMIN_PASSWORD))) {
    return res.json({ token: ADMIN_TOKEN, message: 'Admin login successful!' });
  }
  res.status(401).json({ error: 'Incorrect admin password. (Default: flavorez@admin2026 or admin123)' });
});

// ─── GET /api/admin/users ─────────────────────────────────────
router.get('/users', adminAuth, (req, res) => {
  const users = db.prepare('SELECT id, name, email, phone, role, created_at FROM users ORDER BY created_at DESC').all();
  res.json({ users });
});

// ─── GET /api/admin/whatsapp-logs ─────────────────────────────
router.get('/whatsapp-logs', adminAuth, (req, res) => {
  const logs = db.prepare('SELECT * FROM whatsapp_logs ORDER BY sent_at DESC').all();
  res.json({ logs });
});

// ─── GET /api/admin/whatsapp/gateway-status ───────────────────
router.get('/whatsapp/gateway-status', adminAuth, (req, res) => {
  if (global.whatsappGateway) {
    return res.json(global.whatsappGateway.getStatus());
  }
  res.json({ status: 'UNAVAILABLE', qr: null, user: null });
});

// ─── POST /api/admin/whatsapp/reconnect ────────────────────────
router.post('/whatsapp/reconnect', adminAuth, (req, res) => {
  if (global.whatsappGateway) {
    global.whatsappGateway.initialize();
    return res.json({ message: 'WhatsApp Gateway initializing / generating new QR code...' });
  }
  res.status(500).json({ error: 'WhatsApp Gateway not available' });
});

// ─── POST /api/admin/whatsapp/logout ───────────────────────────
router.post('/whatsapp/logout', adminAuth, async (req, res) => {
  if (global.whatsappGateway) {
    const result = await global.whatsappGateway.logout();
    return res.json(result);
  }
  res.status(500).json({ error: 'WhatsApp Gateway not available' });
});

// ─── POST /api/admin/whatsapp/test-message ────────────────────
router.post('/whatsapp/test-message', adminAuth, async (req, res) => {
  const { phone, message } = req.body;
  if (!phone) return res.status(400).json({ error: 'Phone number is required.' });

  const testText = message || 
`🍽️ *FLAVOUREZ RESTAURANT - TEST NOTIFICATION*
━━━━━━━━━━━━━━━━━━━━
👋 Hello! This is a real-time automated WhatsApp message test from Flavourez Restaurant.

✨ Your WhatsApp Gateway is working 100% seamlessly!
🌐 Order anytime: http://localhost:3000/menu.html`;

  if (global.whatsappGateway) {
    const result = await global.whatsappGateway.sendDirectMessage(phone, testText, 'Test User', 'TEST-' + Date.now().toString().slice(-4));
    return res.json(result);
  }
  res.status(500).json({ error: 'WhatsApp Gateway not available' });
});

// ─── GET /api/admin/stats ─────────────────────────────────────
router.get('/stats', adminAuth, (req, res) => {
  const totalOrders = db.prepare('SELECT COUNT(*) as c FROM orders').get().c;
  const todayOrders = db.prepare("SELECT COUNT(*) as c FROM orders WHERE date(created_at) = date('now','localtime')").get().c;
  const totalRevenue = db.prepare('SELECT SUM(total) as r FROM orders').get().r || 0;
  const todayRevenue = db.prepare("SELECT SUM(total) as r FROM orders WHERE date(created_at) = date('now','localtime')").get().r || 0;
  const pendingOrders = db.prepare("SELECT COUNT(*) as c FROM orders WHERE status NOT IN ('delivered','cancelled')").get().c;
  const totalMessages = db.prepare('SELECT COUNT(*) as c FROM contacts').get().c;
  const totalUsers = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
  const avgRating = db.prepare('SELECT AVG(rating) as r FROM reviews').get().r || 0;

  // Daily orders for last 7 days
  const dailyOrders = db.prepare(`
    SELECT date(created_at) as day, COUNT(*) as count, SUM(total) as revenue
    FROM orders WHERE created_at >= datetime('now','-7 days','localtime')
    GROUP BY date(created_at) ORDER BY day ASC
  `).all();

  // Top dishes
  const allItems = db.prepare('SELECT items FROM orders').all();
  const dishCount = {};
  allItems.forEach(row => {
    try {
      const items = JSON.parse(row.items);
      items.forEach(item => {
        dishCount[item.name] = (dishCount[item.name] || 0) + item.qty;
      });
    } catch {}
  });
  const topDishes = Object.entries(dishCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  // Payment breakdown
  const paymentBreakdown = db.prepare('SELECT payment_method, COUNT(*) as count FROM orders GROUP BY payment_method').all();

  // Status breakdown
  const statusBreakdown = db.prepare('SELECT status, COUNT(*) as count FROM orders GROUP BY status').all();

  res.json({
    totalOrders, todayOrders,
    totalRevenue: parseFloat(totalRevenue.toFixed(2)),
    todayRevenue: parseFloat(todayRevenue.toFixed(2)),
    pendingOrders, totalMessages, totalUsers,
    avgRating: parseFloat(avgRating.toFixed(1)),
    dailyOrders, topDishes, paymentBreakdown, statusBreakdown
  });
});

// ─── GET /api/admin/orders ────────────────────────────────────
router.get('/orders', adminAuth, (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;
  const status = req.query.status;

  let query = 'SELECT * FROM orders';
  let countQuery = 'SELECT COUNT(*) as c FROM orders';
  const params = [];

  if (status && status !== 'all') {
    query += ' WHERE status = ?';
    countQuery += ' WHERE status = ?';
    params.push(status);
  }

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const orders = db.prepare(query).all(...params);
  const total = db.prepare(countQuery).get(...params.slice(0, -2))?.c || 0;

  const parsed = orders.map(o => ({ ...o, items: JSON.parse(o.items) }));
  res.json({ orders: parsed, total, page, totalPages: Math.ceil(total / limit) });
});

// ─── PATCH /api/admin/orders/:id/status ──────────────────────
router.patch('/orders/:id/status', adminAuth, (req, res) => {
  const { status } = req.body;
  const validStatuses = ['confirmed', 'preparing', 'on_the_way', 'delivered', 'cancelled'];
  if (!validStatuses.includes(status)) return res.status(400).json({ error: 'Invalid status.' });

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found.' });

  db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, req.params.id);

  // Broadcast status update via WebSocket
  if (global.wss) {
    global.wss.clients.forEach(client => {
      if (client.readyState === 1) {
        client.send(JSON.stringify({ type: 'STATUS_UPDATE', tracking_id: order.tracking_id, status }));
      }
    });
  }

  res.json({ message: `Order status updated to: ${status}` });
});

// ─── GET /api/admin/contacts ──────────────────────────────────
router.get('/contacts', adminAuth, (req, res) => {
  const messages = db.prepare('SELECT * FROM contacts ORDER BY created_at DESC').all();
  res.json({ messages });
});

// ─── GET /api/admin/menu ─────────────────────────────────────
router.get('/menu', adminAuth, (req, res) => {
  const items = db.prepare('SELECT * FROM menu_items ORDER BY category, name').all();
  res.json({ items });
});

// ─── POST /api/admin/menu ────────────────────────────────────
router.post('/menu', adminAuth, (req, res) => {
  const { name, description, price, category, image_url, veg, spice_level, calories } = req.body;
  if (!name || !price || !category) return res.status(400).json({ error: 'Name, price, category required.' });
  const result = db.prepare('INSERT INTO menu_items (name, description, price, category, image_url, veg, spice_level, calories) VALUES (?,?,?,?,?,?,?,?)').run(name, description || '', price, category, image_url || '', veg ? 1 : 0, spice_level || '', calories || '');
  res.json({ message: 'Menu item added!', id: result.lastInsertRowid });
});

// ─── PATCH /api/admin/menu/:id ───────────────────────────────
router.patch('/menu/:id', adminAuth, (req, res) => {
  const { name, description, price, category, image_url, veg, spice_level, calories, active } = req.body;
  db.prepare('UPDATE menu_items SET name=?, description=?, price=?, category=?, image_url=?, veg=?, spice_level=?, calories=?, active=? WHERE id=?')
    .run(name, description, price, category, image_url, veg ? 1 : 0, spice_level, calories, active ? 1 : 0, req.params.id);
  res.json({ message: 'Menu item updated!' });
});

// ─── DELETE /api/admin/menu/:id ──────────────────────────────
router.delete('/menu/:id', adminAuth, (req, res) => {
  db.prepare('DELETE FROM menu_items WHERE id = ?').run(req.params.id);
  res.json({ message: 'Menu item deleted.' });
});

// ─── GET /api/admin/promos ───────────────────────────────────
router.get('/promos', adminAuth, (req, res) => {
  const promos = db.prepare('SELECT * FROM promo_codes ORDER BY created_at DESC').all();
  res.json({ promos });
});

// ─── POST /api/admin/promos ──────────────────────────────────
router.post('/promos', adminAuth, (req, res) => {
  const { code, type, value, min_order, max_uses } = req.body;
  if (!code || !value) return res.status(400).json({ error: 'Code and value required.' });
  try {
    db.prepare('INSERT INTO promo_codes (code, type, value, min_order, max_uses) VALUES (?,?,?,?,?)').run(code.toUpperCase(), type || 'percent', value, min_order || 0, max_uses || 100);
    res.json({ message: 'Promo code created!' });
  } catch {
    res.status(409).json({ error: 'Promo code already exists.' });
  }
});

// ─── PATCH /api/admin/promos/:id/toggle ──────────────────────
router.patch('/promos/:id/toggle', adminAuth, (req, res) => {
  const promo = db.prepare('SELECT active FROM promo_codes WHERE id = ?').get(req.params.id);
  if (!promo) return res.status(404).json({ error: 'Promo not found.' });
  db.prepare('UPDATE promo_codes SET active = ? WHERE id = ?').run(promo.active ? 0 : 1, req.params.id);
  res.json({ message: `Promo ${promo.active ? 'disabled' : 'enabled'}.` });
});

module.exports = router;
module.exports.ADMIN_TOKEN = ADMIN_TOKEN;
