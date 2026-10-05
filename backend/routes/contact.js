// ============================================================
// backend/routes/contact.js  — Contact Form & Reviews
// ============================================================
const express = require('express');
const router = express.Router();
const db = require('../database');

// ─── POST /api/contact  — Save Contact Message ────────────────
router.post('/', (req, res) => {
  const { name, email, subject, message } = req.body;
  if (!name || !email || !message)
    return res.status(400).json({ error: 'Name, email, and message are required.' });

  db.prepare('INSERT INTO contacts (name, email, subject, message) VALUES (?,?,?,?)').run(name, email, subject || 'General Inquiry', message);

  // Notify admin via WebSocket
  if (global.wss) {
    global.wss.clients.forEach(c => {
      if (c.readyState === 1) c.send(JSON.stringify({ type: 'NEW_MESSAGE', name, subject }));
    });
  }

  res.json({ message: '✅ Message received! We will get back to you within 24 hours.' });
});

// ─── POST /api/reviews  — Submit Review ───────────────────────
router.post('/review', (req, res) => {
  const { name, rating, comment, order_id } = req.body;
  if (!name || !rating) return res.status(400).json({ error: 'Name and rating are required.' });
  if (rating < 1 || rating > 5) return res.status(400).json({ error: 'Rating must be between 1 and 5.' });

  db.prepare('INSERT INTO reviews (name, rating, comment, order_id) VALUES (?,?,?,?)').run(name, rating, comment || null, order_id || null);
  res.json({ message: '⭐ Thank you for your review!' });
});

// ─── GET /api/reviews  — Get All Published Reviews ────────────
router.get('/reviews', (req, res) => {
  const reviews = db.prepare('SELECT * FROM reviews ORDER BY created_at DESC LIMIT 20').all();
  const avg = db.prepare('SELECT AVG(rating) as avg, COUNT(*) as count FROM reviews').get();
  res.json({ reviews, average: parseFloat((avg.avg || 0).toFixed(1)), count: avg.count });
});

module.exports = router;
