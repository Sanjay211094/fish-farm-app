# 🐟 Fish Farm Management System

A full-stack web application for managing fish farm operations — customers, orders, and sales analytics.

🌐 **Live App:** https://fish-farm-app-d802e.web.app  
🔧 **API:** https://fish-farm-app.onrender.com/api/health

---

## Features

- **Authentication** — Secure JWT login with session management
- **Dashboard** — Sales charts (daily/monthly revenue, fish-type breakdown, top customers)
- **Customer Management** — Add, edit, delete customers with order history
- **Order Management** — Full order lifecycle with status tracking (pending → confirmed → delivered)
- **Settings** — Profile editing, password change with strength meter
- **Responsive UI** — Clean sidebar layout with Tailwind CSS

---

## Tech Stack

| Layer    | Technology                          |
|----------|-------------------------------------|
| Frontend | React 18 + Vite + Tailwind CSS      |
| Backend  | Node.js + Express                   |
| Database | SQLite (via better-sqlite3)         |
| Auth     | JWT (jsonwebtoken + bcryptjs)       |
| Charts   | Recharts                            |
| Hosting  | Firebase Hosting (frontend)         |
| API Host | Render.com (backend)                |

---

## Project Structure

```
fish-farm-app/
├── backend/
│   ├── src/
│   │   ├── db/database.js        # SQLite schema + seed data
│   │   ├── middleware/auth.js    # JWT auth middleware
│   │   └── routes/
│   │       ├── auth.js           # Login, register, profile, password
│   │       ├── customers.js      # Customer CRUD
│   │       ├── orders.js         # Order CRUD with filters
│   │       └── analytics.js      # Daily/weekly/monthly sales data
│   └── src/server.js
├── frontend/
│   └── src/
│       ├── pages/
│       │   ├── Login.jsx
│       │   ├── Dashboard.jsx     # Charts and KPI cards
│       │   ├── Customers.jsx
│       │   ├── Orders.jsx
│       │   └── Settings.jsx      # Profile + password change
│       ├── components/
│       │   ├── Layout.jsx        # Sidebar navigation
│       │   └── Modal.jsx
│       ├── context/AuthContext.jsx
│       └── api/axios.js          # Axios with JWT interceptor
├── firebase.json
└── README.md
```

---

## API Endpoints

### Auth
| Method | Endpoint             | Description                  |
|--------|----------------------|------------------------------|
| POST   | /api/auth/login      | Login → returns JWT token    |
| POST   | /api/auth/register   | Register new user            |
| GET    | /api/auth/me         | Get current user profile     |
| PUT    | /api/auth/profile    | Update name and email        |
| PUT    | /api/auth/password   | Change password              |

### Customers
| Method | Endpoint              | Description                  |
|--------|-----------------------|------------------------------|
| GET    | /api/customers        | List all + order stats       |
| POST   | /api/customers        | Create customer              |
| PUT    | /api/customers/:id    | Update customer              |
| DELETE | /api/customers/:id    | Delete + cascade orders      |

### Orders
| Method | Endpoint              | Description                  |
|--------|-----------------------|------------------------------|
| GET    | /api/orders           | List with filters            |
| POST   | /api/orders           | Create order                 |
| PUT    | /api/orders/:id       | Update order                 |
| DELETE | /api/orders/:id       | Delete order                 |

### Analytics
| Method | Endpoint                    | Description              |
|--------|-----------------------------|--------------------------|
| GET    | /api/analytics/summary      | KPIs and top lists       |
| GET    | /api/analytics/daily        | Daily revenue trend      |
| GET    | /api/analytics/weekly       | Weekly revenue trend     |
| GET    | /api/analytics/monthly      | Monthly revenue trend    |

---

## Database Schema

```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,   -- bcrypt hashed
  email TEXT, full_name TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT, phone TEXT, address TEXT, notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  fish_type TEXT NOT NULL,
  quantity REAL NOT NULL, unit TEXT DEFAULT 'kg',
  price_per_unit REAL NOT NULL,
  total_value REAL NOT NULL,
  order_date DATE NOT NULL,
  status TEXT DEFAULT 'pending'
    CHECK(status IN ('pending','confirmed','delivered','cancelled')),
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## Run Locally

### Prerequisites
- Node.js v18+
- npm

### Setup

```bash
# Clone the repo
git clone https://github.com/Sanjay211094/fish-farm-app.git
cd fish-farm-app

# Backend
cd backend
npm install
cp .env.example .env          # add your JWT_SECRET
node src/server.js            # runs on http://localhost:5000

# Frontend (new terminal)
cd frontend
npm install
npm run dev                   # runs on http://localhost:3000
```

### Default Login
| Field    | Value      |
|----------|------------|
| Username | `admin`    |
| Password | `admin123` |

---

## Deployment

| Service          | Purpose          | Plan  |
|------------------|------------------|-------|
| Firebase Hosting | React frontend   | Free  |
| Render.com       | Express backend  | Free  |
