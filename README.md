# 🌿 PA KA Vegetables — Full Stack Web App

**Trichy Gandhi Market | பா கா காய்கறிகள்**

A complete production-ready vegetable e-commerce web application with:
- Live price board fetched from a SQLite database
- WhatsApp ordering with pre-filled messages
- Delivery charge estimator
- Hidden admin panel with password protection
- Bilingual UI ready (English + Tamil)

---

## 📁 Folder Structure

```
paka-vegetables/
│
├── server.js               ← Main Express server (entry point)
├── package.json            ← Node.js dependencies
│
├── db/
│   └── database.js         ← SQLite setup + seed data
│
├── routes/
│   ├── vegetables.js       ← GET /api/vegetables (public)
│   └── admin.js            ← POST/PUT/DELETE /api/admin/* (protected)
│
└── public/                 ← All frontend files (served as static)
    ├── index.html          ← Main shop page  (/)
    ├── order.html          ← Order summary   (/order)
    ├── admin.html          ← Admin panel     (/admin) — hidden from nav
    │
    ├── css/
    │   └── style.css       ← All shared styles
    │
    └── js/
        ├── main.js         ← Shop page logic (fetch vegs, WhatsApp)
        ├── order.js        ← Order summary + WhatsApp confirm
        └── admin.js        ← Admin login, CRUD, dashboard
```

---

## 🚀 Setup on Ubuntu (Step by Step)

### 1. Install Node.js (if not installed)

```bash
# Install Node.js v18+ via NodeSource
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify
node --version   # should print v18.x or higher
npm --version
```

### 2. Clone / Copy the project

```bash
# If you have the zip, extract it:
unzip paka-vegetables.zip -d paka-vegetables
cd paka-vegetables

# OR create the folder manually and copy files into it
mkdir paka-vegetables && cd paka-vegetables
```

### 3. Install dependencies

```bash
npm install
```

This installs:
- **express** — web server
- **better-sqlite3** — fast SQLite driver (no separate DB server needed)
- **cors** — allow cross-origin requests

### 4. Start the server

```bash
# Normal start
node server.js

# OR with auto-restart on code changes (dev mode):
npx nodemon server.js
```

You should see:
```
🌿  PA KA Vegetables server running!
    Shop:   http://localhost:3000/
    Admin:  http://localhost:3000/admin
    API:    http://localhost:3000/api/vegetables
```

### 5. Open in browser

- **Shop page:** http://localhost:3000/
- **Admin panel:** http://localhost:3000/admin  ← Direct URL only, not in nav!

---

## 🔐 Admin Panel

| Detail | Value |
|--------|-------|
| URL    | `http://localhost:3000/admin` |
| Password | `paka@admin2025` |

> ⚠️ Change the password in `routes/admin.js` → `ADMIN_PASSWORD` before going live.

### Admin Features:
- **Dashboard** — total items, stock counts, average price
- **Manage Vegetables** — edit prices, stock status, Tamil names; delete items
- **Add Vegetable** — add new items with English name, Tamil name, price, stock

---

## 🌐 API Reference

All API responses return JSON: `{ success: true/false, data: [...], message: "..." }`

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/vegetables` | None | Get all vegetables |
| GET | `/api/vegetables/:id` | None | Get one vegetable |
| POST | `/api/admin/verify` | ✅ password | Check admin password |
| POST | `/api/admin/add` | ✅ password | Add new vegetable |
| PUT | `/api/admin/update` | ✅ password | Update vegetable |
| DELETE | `/api/admin/delete` | ✅ password | Delete vegetable |
| GET | `/api/admin/all` | ✅ header | List all (admin) |

**Auth:** Send `{ "password": "paka@admin2025" }` in the JSON body (or `x-admin-password` header for GET).

---

## 📱 WhatsApp Integration

- Phone: `+91 97894 60493`
- Every vegetable card has an "Order via WhatsApp" button
- Pre-filled message includes: vegetable name, quantity, price, total
- Order page generates a full order summary message

---

## 🚚 Delivery Charge Logic

```
Distance (from Gandhi Market, Trichy)   Charge
──────────────────────────────────────  ──────
0 – 5 km                                Free
5 – 30 km                               ₹5 per km (above 5km)
30+ km                                  ₹8 per km (above 30km)
```

---

## 🔧 Customization

| What | Where |
|------|-------|
| Admin password | `routes/admin.js` → `ADMIN_PASSWORD` |
| WhatsApp number | `public/js/main.js` & `order.js` → `wa.me/91...` |
| Delivery rates | `public/js/main.js` → `calculateDeliveryCharge()` |
| Brand colors | `public/css/style.css` → `:root { --g-dark, --gold... }` |
| Server port | `server.js` → `const PORT = 3000` |

---

## 🌍 Going Live (Production on Ubuntu)

```bash
# Install PM2 (keeps the server running after you log out)
sudo npm install -g pm2

# Start with PM2
pm2 start server.js --name paka-vegetables

# Auto-start on reboot
pm2 startup
pm2 save

# Check status
pm2 status
pm2 logs paka-vegetables
```

For a public domain, put **Nginx** in front as a reverse proxy on port 80/443.

---

## 🛑 Troubleshooting

| Problem | Fix |
|---------|-----|
| `Error: Cannot find module 'better-sqlite3'` | Run `npm install` again |
| Port 3000 already in use | Change `PORT` in `server.js` or kill the process: `fuser -k 3000/tcp` |
| Database not created | Check write permissions in the `db/` folder: `chmod 755 db/` |
| Admin login fails | Double check password in `routes/admin.js` |

---

*Built for PA KA Vegetables, Gandhi Market, Trichy. © 2025*
