// ============================================================
// backend/routes/menu.js  — Public Menu API
// ============================================================
const express = require('express');
const router = express.Router();
const db = require('../database');

// ─── GET /api/menu  — All Active Menu Items ───────────────────
router.get('/', (req, res) => {
  const { category } = req.query;
  let items;
  if (category && category !== 'all') {
    items = db.prepare('SELECT * FROM menu_items WHERE active = 1 AND category = ? ORDER BY name').all(category);
  } else {
    items = db.prepare('SELECT * FROM menu_items WHERE active = 1 ORDER BY category, name').all();
  }
  res.json({ items });
});

// ─── GET /api/menu/:id  — Single Item ────────────────────────
router.get('/:id', (req, res) => {
  const item = db.prepare('SELECT * FROM menu_items WHERE id = ? AND active = 1').get(req.params.id);
  if (!item) return res.status(404).json({ error: 'Menu item not found.' });
  res.json({ item });
});

module.exports = router;
