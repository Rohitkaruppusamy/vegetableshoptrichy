// routes/admin.js
// Admin-only API routes – protected by password middleware.
// All routes require { password: "..." } in the request body.

const express = require('express');
const router = express.Router();
const db = require('../db/database');

// ─────────────────────────────────────────────
// CONFIG – change these before going to production!
// ─────────────────────────────────────────────
const ADMIN_PASSWORD = 'KaRuPpU9865#@';   // hardcoded admin password

// ─────────────────────────────────────────────
// MIDDLEWARE: verify admin password
// Expects { password: "..." } in req.body
// ─────────────────────────────────────────────
function requireAdmin(req, res, next) {
  const pwd = req.body.password || req.headers['x-admin-password'];
  if (!pwd || pwd !== ADMIN_PASSWORD) {
    return res.status(401).json({ success: false, message: 'Unauthorized. Wrong password.' });
  }
  next();
}

// ─────────────────────────────────────────────
// POST /api/admin/verify
// Just checks if the password is correct.
// ─────────────────────────────────────────────
router.post('/verify', requireAdmin, (req, res) => {
  res.json({ success: true, message: 'Password accepted.' });
});

// ─────────────────────────────────────────────
// POST /api/admin/add
// Add a new vegetable.
// Body: { password, name, name_ta, price, stock }
// ─────────────────────────────────────────────
router.post('/add', requireAdmin, (req, res) => {
  const { name, name_ta, price, stock } = req.body;

  // Basic validation
  if (!name || name.trim() === '') {
    return res.status(400).json({ success: false, message: 'Vegetable name is required.' });
  }
  if (!price || isNaN(price) || Number(price) <= 0) {
    return res.status(400).json({ success: false, message: 'A valid price (> 0) is required.' });
  }

  try {
    const stmt = db.prepare(`
      INSERT INTO vegetables (name, name_ta, price, stock, updated_at)
      VALUES (?, ?, ?, ?, datetime('now','localtime'))
    `);
    const result = stmt.run(
      name.trim(),
      (name_ta || '').trim(),
      parseFloat(price),
      stock || 'Available'
    );
    const newVeg = db.prepare('SELECT * FROM vegetables WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ success: true, message: 'Vegetable added.', data: newVeg });
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(409).json({ success: false, message: 'A vegetable with that name already exists.' });
    }
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error while adding vegetable.' });
  }
});

// ─────────────────────────────────────────────
// PUT /api/admin/update
// Update price, stock, or both for a vegetable.
// Body: { password, id, name, name_ta, price, stock }
// ─────────────────────────────────────────────
router.put('/update', requireAdmin, (req, res) => {
  const { id, name, name_ta, price, stock } = req.body;

  if (!id) return res.status(400).json({ success: false, message: 'Vegetable ID is required.' });

  // Check the vegetable exists
  const existing = db.prepare('SELECT * FROM vegetables WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ success: false, message: 'Vegetable not found.' });

  // Build dynamic update (only update provided fields)
  const updates = {
    name:       name       ? name.trim()         : existing.name,
    name_ta:    name_ta !== undefined ? name_ta.trim() : existing.name_ta,
    price:      price      ? parseFloat(price)   : existing.price,
    stock:      stock      ? stock               : existing.stock,
    updated_at: "datetime('now','localtime')",   // always refresh timestamp
  };

  if (isNaN(updates.price) || updates.price <= 0) {
    return res.status(400).json({ success: false, message: 'Invalid price value.' });
  }

  try {
    db.prepare(`
      UPDATE vegetables
      SET name = ?, name_ta = ?, price = ?, stock = ?, updated_at = datetime('now','localtime')
      WHERE id = ?
    `).run(updates.name, updates.name_ta, updates.price, updates.stock, id);

    const updated = db.prepare('SELECT * FROM vegetables WHERE id = ?').get(id);
    res.json({ success: true, message: 'Vegetable updated.', data: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error while updating.' });
  }
});

// ─────────────────────────────────────────────
// DELETE /api/admin/delete
// Delete a vegetable by ID.
// Body: { password, id }
// ─────────────────────────────────────────────
router.delete('/delete', requireAdmin, (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ success: false, message: 'Vegetable ID is required.' });

  try {
    const result = db.prepare('DELETE FROM vegetables WHERE id = ?').run(id);
    if (result.changes === 0) {
      return res.status(404).json({ success: false, message: 'Vegetable not found.' });
    }
    res.json({ success: true, message: 'Vegetable deleted.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error while deleting.' });
  }
});

// ─────────────────────────────────────────────
// GET /api/admin/all  (with x-admin-password header)
// Returns all vegetables – useful for admin panel table
// ─────────────────────────────────────────────
router.get('/all', (req, res) => {
  const pwd = req.headers['x-admin-password'];
  if (!pwd || pwd !== ADMIN_PASSWORD) {
    return res.status(401).json({ success: false, message: 'Unauthorized.' });
  }
  try {
    const vegs = db.prepare('SELECT * FROM vegetables ORDER BY name ASC').all();
    res.json({ success: true, data: vegs });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;
