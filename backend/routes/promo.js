// ============================================================
// backend/routes/promo.js  — Promo Code Engine
// ============================================================
const express = require('express');
const router = express.Router();
const db = require('../database');

// ─── POST /api/promo/validate  — Validate & Apply Promo ───────
router.post('/validate', (req, res) => {
  const { code, subtotal, phone } = req.body;
  if (!code) return res.status(400).json({ error: 'Promo code is required.' });

  const promo = db.prepare('SELECT * FROM promo_codes WHERE code = ? AND active = 1').get(code.toUpperCase().trim());
  if (!promo) return res.status(404).json({ error: '❌ Invalid promo code.' });

  if (promo.used_count >= promo.max_uses)
    return res.status(400).json({ error: '❌ This promo code has reached its usage limit.' });

  if (subtotal < promo.min_order)
    return res.status(400).json({ error: `❌ Minimum order of ₹${promo.min_order} required for this code.` });

  // Check if same phone already used this code (for one-time-use codes)
  if (phone && promo.max_uses === 1) {
    const alreadyUsed = db.prepare('SELECT id FROM promo_usage WHERE code_id = ? AND phone = ?').get(promo.id, phone);
    if (alreadyUsed) return res.status(400).json({ error: '❌ This promo code has already been used by your number.' });
  }

  const discount = promo.type === 'percent'
    ? parseFloat(((subtotal * promo.value) / 100).toFixed(2))
    : Math.min(promo.value, subtotal);

  res.json({
    valid: true,
    code: promo.code,
    type: promo.type,
    value: promo.value,
    discount,
    message: `✅ Promo applied! You save ₹${discount}`
  });
});

// ─── POST /api/promo/redeem  — Mark Code as Used ──────────────
router.post('/redeem', (req, res) => {
  const { code, phone, order_id } = req.body;
  const promo = db.prepare('SELECT * FROM promo_codes WHERE code = ?').get(code?.toUpperCase());
  if (!promo) return res.status(404).json({ error: 'Promo code not found.' });

  db.prepare('UPDATE promo_codes SET used_count = used_count + 1 WHERE id = ?').run(promo.id);
  db.prepare('INSERT INTO promo_usage (code_id, phone, order_id) VALUES (?,?,?)').run(promo.id, phone || 'unknown', order_id || null);

  res.json({ message: 'Promo code redeemed.' });
});

module.exports = router;
