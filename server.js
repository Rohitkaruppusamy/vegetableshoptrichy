// server.js
// Main entry point for the PA KA Vegetables backend.
// Run with:  node server.js
//   or dev:  npx nodemon server.js

const express = require('express');
const path    = require('path');
const cors    = require('cors');

const app  = express();
const PORT = process.env.PORT || 3000;

// ─────────────────────────────────────────────
// MIDDLEWARE
// ─────────────────────────────────────────────
app.use(cors());                           // Allow cross-origin requests
app.use(express.json());                   // Parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parse form bodies

// Serve all static files (HTML, CSS, JS, images) from /public
app.use(express.static(path.join(__dirname, 'public')));

// ─────────────────────────────────────────────
// API ROUTES
// ─────────────────────────────────────────────
const vegetableRoutes = require('./routes/vegetables');
const adminRoutes     = require('./routes/admin');

app.use('/api/vegetables', vegetableRoutes);  // Public vegetable data
app.use('/api/admin',      adminRoutes);      // Protected admin actions

// ─────────────────────────────────────────────
// PAGE ROUTES
// Serve the SPA HTML files for each route.
// ─────────────────────────────────────────────

// Main shop page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Order summary page
app.get('/order', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'order.html'));
});

// Admin panel – hidden from navigation, direct URL only
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// 404 fallback
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ─────────────────────────────────────────────
// START SERVER
// ─────────────────────────────────────────────
app.listen(PORT, () => {
  console.log('');
  console.log('🌿  PA KA Vegetables server running!');
  console.log(`    Shop:   http://localhost:${PORT}/`);
  console.log(`    Admin:  http://localhost:${PORT}/admin`);
  console.log(`    API:    http://localhost:${PORT}/api/vegetables`);
  console.log('');
});
