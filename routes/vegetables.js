// routes/vegetables.js
// Public API – no authentication needed.
// Returns all vegetables sorted by name, newest price first.

const express = require('express');
const router = express.Router();
const db = require('../db/database');

// ─────────────────────────────────────────────
// GET /api/vegetables
// Returns all vegetables from the database.
// ─────────────────────────────────────────────
router.get('/', (req, res) => {
  try {
    const vegetables = db
      .prepare('SELECT * FROM vegetables ORDER BY name ASC')
      .all();
    res.json({ success: true, data: vegetables });
  } catch (err) {
    console.error('Error fetching vegetables:', err.message);
    res.status(500).json({ success: false, message: 'Server error while fetching vegetables.' });
  }
});

// ─────────────────────────────────────────────
// GET /api/vegetables/:id
// Returns a single vegetable by ID.
// ─────────────────────────────────────────────
router.get('/:id', (req, res) => {
  try {
    const veg = db
      .prepare('SELECT * FROM vegetables WHERE id = ?')
      .get(req.params.id);
    if (!veg) return res.status(404).json({ success: false, message: 'Vegetable not found.' });
    res.json({ success: true, data: veg });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;
