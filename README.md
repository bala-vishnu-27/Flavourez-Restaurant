# 🍽️ Flavourez - Smart Restaurant Management & Online Ordering System

<p align="center">
  <img src="frontend/logo.png" alt="Flavourez Logo" width="120" />
</p>

<p align="center">
  <b>A Full-Stack Restaurant Ordering, Real-Time Tracking & Automated WhatsApp Dispatch Platform.</b>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-v18+-green.svg" alt="Node.js" />
  <img src="https://img.shields.io/badge/Express.js-Backend-blue.svg" alt="Express.js" />
  <img src="https://img.shields.io/badge/SQLite-better--sqlite3-003B57.svg?logo=sqlite&logoColor=white" alt="SQLite" />
  <img src="https://img.shields.io/badge/WebSocket-Realtime-orange.svg" alt="WebSocket" />
  <img src="https://img.shields.io/badge/WhatsApp%20Bot-Baileys-25D366.svg" alt="WhatsApp Bot" />
  <img src="https://img.shields.io/badge/License-MIT-purple.svg" alt="License" />
</p>

---

## 🌟 Overview

**Flavourez** is an end-to-end web application built for modern food ordering and restaurant operations. It features a modern, responsive customer storefront, automated WhatsApp notifications upon checkout, dynamic order tracking with live status updates, and a comprehensive real-time Admin Panel for kitchen & management staff.

> **v2 Update:** Migrated from a flat JSON file database to a full **SQLite** relational database powered by `better-sqlite3` for improved performance, data integrity, and multi-table relational querying.

---

## 🚀 Key Features

### 🛒 Customer Experience
* **Interactive Dynamic Menu**: Browse dishes categorized by Starters, Main Course, Biryani, Desserts, and Beverages.
* **Smart Cart & Checkout**: Real-time pricing calculations, tax breakdowns, delivery notes, and instant promo code application (`FLAVOUR20`, `WELCOME50`, `FEAST17`, `BDAY25`).
* **Flexible Payments**: Support for UPI (Google Pay, PhonePe, Paytm, QR Scanner) and Cash on Delivery (COD).
* **Live Order Tracking (`/track.html`)**: Real-time status progression (`Placed` ➔ `Confirmed` ➔ `Preparing` ➔ `On the Way` ➔ `Delivered`) powered by WebSockets.
* **Instant PDF Invoices**: Auto-generated downloadable receipts for each confirmed order.

### 📱 Automated WhatsApp Notification Gateway
* **Direct WhatsApp Integration**: Automatically dispatches rich order confirmations, itemized bills, tracking URLs, and invoice download links directly to the customer's WhatsApp using Baileys.

### 👑 Real-Time Admin Dashboard (`/admin.html`)
* **Live Orders Kanban/Feed**: Instant notification sound and real-time status update controls via WebSocket.
* **Kitchen & Dispatch Management**: One-click order status transitions (`Confirmed`, `Preparing`, `Out for Delivery`, `Delivered`, `Cancelled`).
* **Menu Management**: Add, edit, or remove menu items, pricing, and availability.
* **Promo Code Center**: Create and manage percentage & flat discount codes with usage tracking.
* **Analytics & Reports**: Visual overview of daily revenue, top-selling dishes, customer feedback, and total orders.

### 🗄️ SQLite Database (v2 — Upgraded)
* **Relational SQL Storage**: All data (orders, users, menu items, promos, contacts, reviews, WhatsApp logs) is stored in a robust **SQLite** database file (`flavorez.db`).
* **WAL Mode Enabled**: Write-Ahead Logging ensures concurrent read performance.
* **Auto-Seeded**: Database auto-seeds with sample menu items, orders, promo codes, and reviews on first run — zero manual setup required.

---

## 📂 Project Structure

```text
Flavorez-restaurant/
├── backend/
│   ├── routes/
│   │   ├── admin.js           # Admin operations & analytics API
│   │   ├── auth.js            # User / Admin authentication & JWT
│   │   ├── contact.js         # Contact & feedback submissions
│   │   ├── menu.js            # Dynamic menu CRUD endpoints
│   │   ├── orders.js          # Order creation, tracking & PDF receipts
│   │   └── promo.js           # Discount & coupon validation
│   ├── database.js            # SQLite engine (better-sqlite3) & schema
│   ├── flavorez.db            # SQLite database file (auto-created)
│   ├── flavorez.json          # Legacy JSON data (reference only)
│   ├── server.js              # Express app & WebSocket server
│   └── whatsapp-gateway.js    # WhatsApp automation service (Baileys)
├── frontend/
│   ├── about.html             # Restaurant story & information
│   ├── admin.html             # Comprehensive Admin Dashboard
│   ├── contact.html           # Contact & reservation inquiries
│   ├── index.html             # Hero landing page & showcase
│   ├── menu.html              # Full interactive digital menu
│   ├── order.html             # Cart, checkout & payment portal
│   ├── track.html             # Live real-time order tracking
│   ├── backend-connect.js     # Frontend-to-Backend API bridge
│   ├── effects.js             # UI animations & particle effects
│   ├── script.js              # Frontend client logic & cart handling
│   ├── style.css              # Global responsive stylesheet
│   └── *.png, *.jpeg          # Logos, icons, & visual assets
├── package.json               # Backend dependencies & run scripts
├── .env.example               # Environment variables template
├── .gitignore                 # Files excluded from Git version control
└── README.md                  # Project documentation
```

---

## 🛠️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | HTML5, CSS3 (Glassmorphism), JavaScript ES6+, WebSockets |
| **Backend** | Node.js, Express.js, WebSocket (`ws`) |
| **Database** | **SQLite** via `better-sqlite3` (WAL mode) |
| **WhatsApp Bot** | `@whiskeysockets/baileys` |
| **PDF Invoicing** | `pdfkit` |
| **Auth & Security** | `bcryptjs`, `jsonwebtoken` (JWT) |
| **QR Code** | `qrcode` |

---

## ⚡ Quick Start & Installation

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) (v16 or higher) installed on your system.

### 1. Clone the Repository
```bash
git clone https://github.com/bala-vishnu-27/Flavourez-Restaurant.git
cd Flavourez-Restaurant
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration (Optional)
Copy the example `.env` file if you plan to use custom ports or Twilio:
```bash
cp .env.example .env
```

### 4. Start the Server
```bash
npm start
```
> The application will start and serve both the frontend and backend API at: **`http://localhost:3000`**

> 💡 **On first run**, the SQLite database (`flavorez.db`) is auto-created and seeded with sample menu items, promo codes, and orders — no manual DB setup needed!

---

## 🔑 Default Credentials & Access Links

| Page | URL | Access / Credentials |
| :--- | :--- | :--- |
| **Storefront Landing** | `http://localhost:3000/index.html` | Public |
| **Menu & Ordering** | `http://localhost:3000/menu.html` | Public |
| **Live Order Tracking** | `http://localhost:3000/track.html` | Public (Requires Tracking ID) |
| **Admin Dashboard** | `http://localhost:3000/admin.html` | **Email:** `admin@flavourez.com`<br>**Password:** `admin123` |

---

## 📡 API Endpoints Overview

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register a new customer |
| `POST` | `/api/auth/login` | Authenticate customer or admin |
| `GET` | `/api/menu` | Fetch all menu categories and items |
| `POST` | `/api/orders` | Place a new order & trigger WhatsApp alert |
| `GET` | `/api/orders/:tracking_id` | Get live order details |
| `GET` | `/api/orders/:tracking_id/receipt` | Download generated PDF bill |
| `POST` | `/api/promo/apply` | Validate & apply promo code |
| `POST` | `/api/contact` | Submit contact / feedback form |
| `GET` | `/api/admin/orders` | Fetch orders feed for Admin |
| `PUT` | `/api/admin/orders/:id/status` | Update order preparation status |

---

## 🗄️ Database Schema (SQLite)

The SQLite database consists of the following tables:

```
users         — Customer accounts (name, email, phone, hashed password)
orders        — All placed orders with full details & tracking status
menu_items    — Menu catalog with categories, pricing, and availability
promo_codes   — Discount codes with type (percent/flat), limits & usage
promo_usage   — Per-order promo usage audit log
contacts      — Customer contact & reservation submissions
reviews       — Customer ratings & comments linked to orders
whatsapp_logs — WhatsApp message dispatch history & status
```

---

## 👨‍💻 Author & Maintainer

* **Bala Vishnu**
* GitHub: [@bala-vishnu-27](https://github.com/bala-vishnu-27)
* Email: sbvishnu9432@gmail.com

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
