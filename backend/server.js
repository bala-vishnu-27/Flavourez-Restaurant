// ============================================================
// backend/server.js  — Flavorez Restaurant Backend Server
// ============================================================
const express = require('express');
const cors = require('cors');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

// ─── Init Express ─────────────────────────────────────────────
const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

// ─── Middleware ───────────────────────────────────────────────
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../frontend')));  // Serve frontend files

// ─── WebSocket Server ─────────────────────────────────────────
const wss = new WebSocket.Server({ server });
global.wss = wss;

wss.on('connection', (ws) => {
  console.log('🔌 WebSocket client connected');
  ws.send(JSON.stringify({ type: 'CONNECTED', message: 'Flavorez real-time server connected!' }));
  ws.on('close', () => console.log('🔌 WebSocket client disconnected'));
  ws.on('error', (err) => console.error('WS error:', err.message));
});

// ─── Automated WhatsApp Dispatch Service ───────────────────────
const db = require('./database');
const whatsappGateway = require('./whatsapp-gateway');
whatsappGateway.setDatabase(db);
global.whatsappGateway = whatsappGateway;

// Auto-initialize WhatsApp Gateway
whatsappGateway.initialize();

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || 'YOUR_TWILIO_SID';
const TWILIO_AUTH_TOKEN  = process.env.TWILIO_AUTH_TOKEN  || 'YOUR_TWILIO_TOKEN';
const TWILIO_WHATSAPP_FROM = 'whatsapp:+14155238886';

async function sendWhatsAppNotification(order) {
  const items = Array.isArray(order.items) ? order.items : JSON.parse(order.items || '[]');
  const itemsText = items.map(i => `  • ${i.name} × ${i.qty} — ₹${i.price * i.qty}`).join('\n');
  
  const waMessage = 
`🍽️ *FLAVOUREZ RESTAURANT - ORDER CONFIRMED*
━━━━━━━━━━━━━━━━━━━━
Hi *${order.name}*, your food order has been placed!

📦 *Tracking ID:* \`${order.tracking_id}\`
⏱️ *Est. Delivery:* 30 Mins
📍 *Delivery Address:* ${order.address}

📋 *Order Details:*
${itemsText}
${order.discount > 0 ? `🎁 *Discount Applied (${order.promo_code}):* -₹${order.discount}\n` : ''}💰 *Total Paid:* *₹${order.total}* (${(order.payment_method || 'COD').toUpperCase()})
━━━━━━━━━━━━━━━━━━━━
🛵 *Live Order Tracking:*
http://localhost:3000/track.html?id=${order.tracking_id}

🧾 *Download Invoice:*
http://localhost:3000/api/orders/${order.tracking_id}/receipt

Thank you for choosing Flavourez! ✨
📞 Restaurant Helpline: +91 8667611094`;

  // 1. Send via Real WhatsApp Gateway (Option 1 - Baileys / QR)
  await whatsappGateway.sendDirectMessage(order.phone, waMessage, order.name, order.tracking_id);

  // 2. Terminal Log
  console.log('\n╔══════════════════════════════════════════════════════════════════╗');
  console.log(`║  📱 [AUTOMATED WHATSAPP DISPATCH] Order Confirmation Gateway      ║`);
  console.log('╠══════════════════════════════════════════════════════════════════╣');
  console.log(`║  👤 Recipient  : ${order.name} (+91 ${order.phone})`);
  console.log(`║  📦 Tracking ID: ${order.tracking_id}`);
  console.log(`║  💰 Total Paid : ₹${order.total}`);
  console.log(`║  📡 Gateway    : Flavourez Direct WhatsApp Service API`);
  console.log('╚══════════════════════════════════════════════════════════════════╝\n');

  // 3. Optional Twilio production dispatch if credentials provided (Option 2)
  if (TWILIO_ACCOUNT_SID !== 'YOUR_TWILIO_SID') {
    try {
      const twilio = require('twilio')(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
      await twilio.messages.create({
        from: TWILIO_WHATSAPP_FROM,
        to: `whatsapp:+91${order.phone.replace(/\D/g, '').slice(-10)}`,
        body: waMessage
      });
      console.log(`✅ Real Twilio WhatsApp SMS delivered to +91${order.phone}`);
    } catch (err) {
      console.error('Twilio dispatch notice:', err.message);
    }
  }
}
global.sendWhatsAppNotification = sendWhatsAppNotification;

// ─── Routes ───────────────────────────────────────────────────
const authRoutes    = require('./routes/auth');
const orderRoutes   = require('./routes/orders');
const contactRoutes = require('./routes/contact');
const promoRoutes   = require('./routes/promo');
const adminRoutes   = require('./routes/admin');
const menuRoutes    = require('./routes/menu');

app.use('/api/auth',    authRoutes);
app.use('/api/orders',  orderRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/promo',   promoRoutes);
app.use('/api/admin',   adminRoutes);
app.use('/api/menu',    menuRoutes);

// ─── Health Check ─────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    server: 'Flavorez Backend',
    version: '1.0.0',
    time: new Date().toLocaleString('en-IN'),
    websocket: wss.clients.size + ' client(s) connected'
  });
});

// ─── 404 Handler ──────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found.` });
});

// ─── Global Error Handler ─────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err.message);
  res.status(500).json({ error: 'Internal server error. Please try again.' });
});

// ─── Start Server ─────────────────────────────────────────────
server.listen(PORT, () => {
  console.log('\n');
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║         🍽️  FLAVOUREZ BACKEND SERVER          ║');
  console.log('╠══════════════════════════════════════════════╣');
  console.log(`║  🌐 API Server  : http://localhost:${PORT}       ║`);
  console.log(`║  🔌 WebSocket   : ws://localhost:${PORT}         ║`);
  console.log(`║  🔐 Admin Panel : http://localhost:${PORT}/admin.html ║`);
  console.log('╚══════════════════════════════════════════════╝');
  console.log('\n  📡 Waiting for connections...\n');
});
