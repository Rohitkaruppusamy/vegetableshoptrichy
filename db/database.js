// db/database.js
// Sets up the SQLite database and creates the vegetables table if it doesn't exist.
// Uses better-sqlite3 (synchronous, no callback hell).

const Database = require('better-sqlite3');
const path = require('path');

// Database file lives at db/vegetables.db
const DB_PATH = path.join(__dirname, 'vegetables.db');

// Open (or create) the database
const db = new Database(DB_PATH);

// Enable WAL mode for better concurrent read performance
db.pragma('journal_mode = WAL');

// Create the vegetables table
db.exec(`
  CREATE TABLE IF NOT EXISTS vegetables (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    name      TEXT    NOT NULL UNIQUE,
    name_ta   TEXT,                        -- Tamil name (optional)
    price     REAL    NOT NULL,            -- Price per kg in INR
    stock     TEXT    NOT NULL DEFAULT 'Available',  -- Available / Out of Stock
    updated_at TEXT   NOT NULL DEFAULT (datetime('now','localtime'))
  );
`);

// Seed some initial vegetables if the table is empty
const count = db.prepare('SELECT COUNT(*) as c FROM vegetables').get();
if (count.c === 0) {
  const insert = db.prepare(`
    INSERT INTO vegetables (name, name_ta, price, stock, updated_at)
    VALUES (?, ?, ?, ?, datetime('now','localtime'))
  `);
  const seeds = [
    ['Tomato',      'தக்காளி',    40,  'Available'],
    ['Onion',       'வெங்காயம்',  35,  'Available'],
    ['Potato',      'உருளைக்கிழங்கு', 30, 'Available'],
    ['Carrot',      'கேரட்',      60,  'Available'],
    ['Beans',       'பீன்ஸ்',     80,  'Available'],
    ['Cabbage',     'முட்டைகோஸ்', 25,  'Available'],
    ['Cauliflower', 'காலிஃப்ளவர்',55,  'Available'],
    ['Brinjal',     'கத்தரிக்காய்',35, 'Available'],
    ['Cucumber',    'வெள்ளரிக்காய்',30,'Available'],
    ['Ladies Finger','வெண்டைக்காய்',70,'Available'],
  ];
  seeds.forEach(([n, ta, p, s]) => insert.run(n, ta, p, s));
  console.log('✅ Seeded initial vegetables into database.');
}

module.exports = db;
