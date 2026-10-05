// ============================================================
// backend/routes/orders.js  — Order Placement & Tracking
// ============================================================
const express = require('express');
const router = express.Router();
const db = require('../database');
const PDFDocument = require('pdfkit');

// ─── Generate Tracking ID ─────────────────────────────────────
function generateTrackingId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let suffix = '';
  for (let i = 0; i < 6; i++) suffix += chars.charAt(Math.floor(Math.random() * chars.length));
  return `FLZ${suffix}`;
}

// ─── POST /api/orders  — Place New Order ─────────────────────
router.post('/', (req, res) => {
  const { name, phone, email, address, items, subtotal, discount, total, promo_code,
    payment_method, order_type, instructions, upi_txn_id, user_id } = req.body;

  if (!name || !phone || !address || !items || !payment_method)
    return res.status(400).json({ error: 'Missing required order fields.' });

  let tracking_id;
  let attempts = 0;
  do {
    tracking_id = generateTrackingId();
    attempts++;
    if (attempts > 20) return res.status(500).json({ error: 'Could not generate tracking ID.' });
  } while (db.prepare('SELECT id FROM orders WHERE tracking_id = ?').get(tracking_id));

  const result = db.prepare(`
    INSERT INTO orders (tracking_id, user_id, name, phone, email, address, items, subtotal, discount, total,
      promo_code, payment_method, order_type, instructions, upi_txn_id, status)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,'confirmed')
  `).run(
    tracking_id,
    user_id || null,
    name, phone, email || null, address,
    typeof items === 'string' ? items : JSON.stringify(items),
    subtotal || 0, discount || 0, total || 0,
    promo_code || null,
    payment_method, order_type || 'delivery',
    instructions || null,
    upi_txn_id || null
  );

  const orderData = db.prepare('SELECT * FROM orders WHERE id = ?').get(result.lastInsertRowid);

  // Broadcast to WebSocket clients (admin dashboard)
  if (global.wss) {
    global.wss.clients.forEach(client => {
      if (client.readyState === 1) {
        client.send(JSON.stringify({ type: 'NEW_ORDER', order: orderData }));
      }
    });
  }

  // Trigger WhatsApp notification via backend service
  if (global.sendWhatsAppNotification) {
    global.sendWhatsAppNotification(orderData);
  }

  // Generate WhatsApp template text
  const itemsArray = typeof items === 'string' ? JSON.parse(items) : items;
  const itemsText = itemsArray.map(i => `  • ${i.name} × ${i.qty} — ₹${i.price * i.qty}`).join('\n');
  const waText = 
`🍽️ *FLAVOUREZ RESTAURANT - ORDER CONFIRMED*
━━━━━━━━━━━━━━━━━━━━
Hi *${name}*, your food order has been successfully placed!

📦 *Tracking ID:* \`${tracking_id}\`
⏱️ *Est. Delivery:* 30 Mins
📍 *Delivery Address:* ${address}

📋 *Order Details:*
${itemsText}
${discount > 0 ? `🎁 *Discount Applied (${promo_code}):* -₹${discount}\n` : ''}💰 *Total Paid:* *₹${total}* (${payment_method.toUpperCase()})
━━━━━━━━━━━━━━━━━━━━
🛵 *Live Order Tracking:*
http://localhost:3000/track.html?id=${tracking_id}

🧾 *Download Invoice:*
http://localhost:3000/api/orders/${tracking_id}/receipt

Thank you for choosing Flavourez! ✨
📞 Restaurant Helpline: +91 8667611094`;

  const waUrl = `https://api.whatsapp.com/send?phone=91${phone.replace(/\D/g,'').slice(-10)}&text=${encodeURIComponent(waText)}`;

  res.status(201).json({
    message: 'Order placed successfully!',
    tracking_id,
    order_id: result.lastInsertRowid,
    whatsapp_url: waUrl,
    whatsapp_text: waText
  });
});

// ─── GET /api/orders/:trackingId/whatsapp  — Order Status WhatsApp ──
router.get('/:trackingId/whatsapp', (req, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE tracking_id = ?').get(req.params.trackingId.toUpperCase());
  if (!order) return res.status(404).json({ error: 'Order not found.' });

  const items = JSON.parse(order.items);
  const itemsText = items.map(i => `  • ${i.name} × ${i.qty} — ₹${i.price * i.qty}`).join('\n');
  const waText = 
`🍽️ *FLAVOUREZ RESTAURANT - ORDER STATUS*
━━━━━━━━━━━━━━━━━━━━
Customer: *${order.name}*
Status: *${order.status.replace('_',' ').toUpperCase()}*

📦 *Tracking ID:* \`${order.tracking_id}\`
📍 *Address:* ${order.address}

📋 *Items:*
${itemsText}
💰 *Total Amount:* *₹${order.total}* (${order.payment_method.toUpperCase()})
━━━━━━━━━━━━━━━━━━━━
🛵 *Live Tracking:* http://localhost:3000/track.html?id=${order.tracking_id}
🧾 *Invoice:* http://localhost:3000/api/orders/${order.tracking_id}/receipt

Flavourez Kitchen: +91 8667611094`;

  const waUrl = `https://api.whatsapp.com/send?phone=91${(order.phone||'').replace(/\D/g,'').slice(-10)}&text=${encodeURIComponent(waText)}`;
  res.json({ whatsapp_url: waUrl, message: waText });
});

// ─── GET /api/orders/:trackingId  — Track Order ───────────────
router.get('/:trackingId', (req, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE tracking_id = ?').get(req.params.trackingId.toUpperCase());
  if (!order) return res.status(404).json({ error: 'Order not found. Please check your Tracking ID.' });

  const statusTimeline = buildTimeline(order.status, order.created_at);
  res.json({ ...order, items: JSON.parse(order.items), timeline: statusTimeline });
});

// ─── GET /api/orders/history/:phone  — Order History ──────────
router.get('/history/:phone', (req, res) => {
  const orders = db.prepare('SELECT * FROM orders WHERE phone = ? ORDER BY created_at DESC').all(req.params.phone);
  const parsed = orders.map(o => ({ ...o, items: JSON.parse(o.items) }));
  res.json({ orders: parsed });
});

// ─── GET /api/orders/:trackingId/receipt  — PDF Receipt ───────
router.get('/:trackingId/receipt', (req, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE tracking_id = ?').get(req.params.trackingId.toUpperCase());
  if (!order) return res.status(404).json({ error: 'Order not found.' });

  const items = JSON.parse(order.items);
  const doc = new PDFDocument({ margin: 50, size: 'A4' });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=Flavorez-Receipt-${order.tracking_id}.pdf`);
  doc.pipe(res);

  // ── Header ──
  doc.rect(0, 0, doc.page.width, 130).fill('#1a1a2e');
  doc.fontSize(28).fillColor('#ff8c00').font('Helvetica-Bold').text('FLAVOUREZ', 50, 30, { align: 'center' });
  doc.fontSize(12).fillColor('#ffffff').font('Helvetica').text('Savor the Ultimate Culinary Experience', 50, 65, { align: 'center' });
  doc.fontSize(10).fillColor('#aaaaaa').text('127 Gandhipuram, Coimbatore  |  +91 8667611094  |  tastyhouse@flavorez.com', 50, 90, { align: 'center' });

  // ── Receipt Title ──
  doc.moveDown(4);
  doc.fontSize(16).fillColor('#ff8c00').font('Helvetica-Bold').text('ORDER RECEIPT', { align: 'center' });
  doc.moveDown(0.5);
  doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#ff8c00').lineWidth(1.5).stroke();
  doc.moveDown(0.5);

  // ── Order Info ──
  doc.fontSize(11).fillColor('#333333').font('Helvetica-Bold');
  const infoY = doc.y;
  doc.text(`Tracking ID:`, 50, infoY);
  doc.font('Helvetica').fillColor('#ff3d00').text(order.tracking_id, 160, infoY);
  doc.font('Helvetica-Bold').fillColor('#333333').text(`Order Date:`, 50, infoY + 20);
  doc.font('Helvetica').fillColor('#555555').text(order.created_at, 160, infoY + 20);
  doc.font('Helvetica-Bold').fillColor('#333333').text(`Payment:`, 50, infoY + 40);
  doc.font('Helvetica').fillColor('#555555').text(order.payment_method.toUpperCase(), 160, infoY + 40);
  doc.font('Helvetica-Bold').fillColor('#333333').text(`Order Type:`, 50, infoY + 60);
  doc.font('Helvetica').fillColor('#555555').text(order.order_type === 'delivery' ? '🚚 Home Delivery' : '🏪 Self Pickup', 160, infoY + 60);

  doc.moveDown(5);
  doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#dddddd').lineWidth(1).stroke();
  doc.moveDown(0.5);

  // ── Customer Info ──
  doc.fontSize(12).fillColor('#1a1a2e').font('Helvetica-Bold').text('CUSTOMER DETAILS');
  doc.moveDown(0.3);
  doc.fontSize(10).fillColor('#555555').font('Helvetica');
  doc.text(`Name: ${order.name}`);
  doc.text(`Phone: ${order.phone}`);
  if (order.email) doc.text(`Email: ${order.email}`);
  doc.text(`Address: ${order.address}`);
  if (order.instructions) doc.text(`Special Instructions: ${order.instructions}`);

  doc.moveDown(0.8);
  doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#dddddd').lineWidth(1).stroke();
  doc.moveDown(0.5);

  // ── Items Table ──
  doc.fontSize(12).fillColor('#1a1a2e').font('Helvetica-Bold').text('ORDER ITEMS');
  doc.moveDown(0.5);

  // Table Header
  doc.rect(50, doc.y, 495, 22).fill('#1a1a2e');
  const tableHeaderY = doc.y + 5;
  doc.fontSize(10).fillColor('#ffffff').font('Helvetica-Bold');
  doc.text('#', 58, tableHeaderY);
  doc.text('Item', 75, tableHeaderY);
  doc.text('Qty', 350, tableHeaderY);
  doc.text('Price', 400, tableHeaderY);
  doc.text('Total', 470, tableHeaderY);
  doc.moveDown(1.5);

  // Table Rows
  items.forEach((item, idx) => {
    const rowY = doc.y;
    if (idx % 2 === 0) doc.rect(50, rowY - 3, 495, 20).fill('#f9f9f9');
    doc.fontSize(10).fillColor('#333333').font('Helvetica');
    doc.text(`${idx + 1}`, 58, rowY);
    doc.text(item.name, 75, rowY, { width: 260 });
    doc.text(`${item.qty}`, 350, rowY);
    doc.text(`₹${item.price}`, 400, rowY);
    doc.text(`₹${(item.qty * item.price).toFixed(2)}`, 470, rowY);
    doc.moveDown(1.2);
  });

  doc.moveDown(0.5);
  doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#dddddd').lineWidth(1).stroke();
  doc.moveDown(0.5);

  // ── Totals ──
  doc.fontSize(11).fillColor('#555555').font('Helvetica');
  doc.text(`Subtotal:`, 380);
  doc.moveUp(1);
  doc.text(`₹${order.subtotal.toFixed(2)}`, 490);

  if (order.discount > 0) {
    doc.fontSize(11).fillColor('#10b981').font('Helvetica');
    doc.text(`Discount (${order.promo_code}):`, 320);
    doc.moveUp(1);
    doc.text(`- ₹${order.discount.toFixed(2)}`, 490);
  }

  doc.moveTo(380, doc.y + 5).lineTo(545, doc.y + 5).strokeColor('#ff8c00').lineWidth(1.5).stroke();
  doc.moveDown(0.8);
  doc.fontSize(14).fillColor('#ff3d00').font('Helvetica-Bold');
  doc.text(`TOTAL AMOUNT:`, 310);
  doc.moveUp(1);
  doc.text(`₹${order.total.toFixed(2)}`, 470);

  doc.moveDown(2);
  doc.rect(50, doc.y, 495, 50).fill('#fff8f0').stroke('#ff8c00');
  doc.fontSize(12).fillColor('#ff8c00').font('Helvetica-Bold').text('Thank you for ordering from Flavourez! 🍽️', 55, doc.y + 10, { align: 'center' });
  doc.fontSize(10).fillColor('#888888').font('Helvetica').text('This is a computer-generated receipt and does not require a signature.', 55, doc.y + 5, { align: 'center' });

  doc.end();
});

// ─── Timeline Builder ─────────────────────────────────────────
function buildTimeline(status, createdAt) {
  const base = new Date(createdAt);
  const steps = ['confirmed', 'preparing', 'on_the_way', 'delivered'];
  const labels = ['Order Confirmed', 'Preparing Your Food', 'Out for Delivery', 'Delivered'];
  const icons = ['✅', '🍳', '🚚', '📦'];
  const currentIdx = steps.indexOf(status);

  return steps.map((s, i) => ({
    step: s,
    label: labels[i],
    icon: icons[i],
    done: i < currentIdx,
    active: i === currentIdx,
    time: i <= currentIdx ? new Date(base.getTime() + i * 7 * 60000).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : null
  }));
}

module.exports = router;
