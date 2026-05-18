# Fish Farm Management System

Full-stack web app for managing fish farm operations — customers, orders, and sales analytics.

## Tech Stack

| Layer    | Technology                          |
|----------|-------------------------------------|
| Frontend | React 18 + Vite + Tailwind CSS      |
| Backend  | Node.js + Express                   |
| Database | SQLite (via better-sqlite3)         |
| Auth     | JWT (jsonwebtoken + bcryptjs)       |
| Charts   | Recharts                            |

---

## Quick Start

### Option A — One command (both servers)
```bash
./start.sh
```
Then open http://localhost:3000

### Option B — Run separately

**Terminal 1 — Backend**
```bash
cd backend
npm install        # first time only
npm start
# API running at http://localhost:5000
```

**Terminal 2 — Frontend**
```bash
cd frontend
npm install        # first time only
npm run dev
# App running at http://localhost:3000
```

---

## Default Login

| Field    | Value      |
|----------|------------|
| Username | `admin`    |
| Password | `admin123` |

---

## Project Structure

```
Fish_farm_app_test/
├── backend/
│   ├── src/
│   │   ├── db/database.js        # SQLite init + seeding
│   │   ├── middleware/auth.js     # JWT middleware
│   │   ├── routes/
│   │   │   ├── auth.js           # POST /login, /register, GET /me
│   │   │   ├── customers.js      # CRUD /customers
│   │   │   ├── orders.js         # CRUD /orders
│   │   │   └── analytics.js      # /summary, /daily, /weekly, /monthly
│   │   └── server.js
│   ├── .env
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/axios.js          # Axios with JWT interceptor
│   │   ├── context/AuthContext.jsx
│   │   ├── components/
│   │   │   ├── Layout.jsx        # Sidebar + nav
│   │   │   └── Modal.jsx
│   │   └── pages/
│   │       ├── Login.jsx
│   │       ├── Dashboard.jsx     # Charts + stats
│   │       ├── Customers.jsx
│   │       └── Orders.jsx
│   └── package.json
├── start.sh
└── README.md
```

---

## API Reference

### Auth
| Method | Endpoint            | Body / Notes           |
|--------|---------------------|------------------------|
| POST   | /api/auth/login     | `{ username, password }` → `{ token, user }` |
| POST   | /api/auth/register  | `{ username, password, email, full_name }` |
| GET    | /api/auth/me        | Requires `Authorization: Bearer <token>` |

### Customers (all require auth)
| Method | Endpoint             | Description         |
|--------|----------------------|---------------------|
| GET    | /api/customers       | List all + stats    |
| GET    | /api/customers/:id   | Detail + orders     |
| POST   | /api/customers       | Create customer     |
| PUT    | /api/customers/:id   | Update customer     |
| DELETE | /api/customers/:id   | Delete + cascade    |

### Orders (all require auth)
| Method | Endpoint           | Query params                       |
|--------|--------------------|------------------------------------|
| GET    | /api/orders        | `?status=&customer_id=&from=&to=`  |
| GET    | /api/orders/:id    | —                                  |
| POST   | /api/orders        | Create order                       |
| PUT    | /api/orders/:id    | Update order                       |
| DELETE | /api/orders/:id    | Delete order                       |

### Analytics (all require auth)
| Method | Endpoint                   | Query params      |
|--------|----------------------------|-------------------|
| GET    | /api/analytics/summary     | —                 |
| GET    | /api/analytics/daily       | `?days=30`        |
| GET    | /api/analytics/weekly      | `?weeks=12`       |
| GET    | /api/analytics/monthly     | `?months=12`      |

---

## Database Schema

```sql
-- Users
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,         -- bcrypt hashed
  email TEXT,
  full_name TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Customers
CREATE TABLE customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT, phone TEXT, address TEXT, notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Orders
CREATE TABLE orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  fish_type TEXT NOT NULL,
  quantity REAL NOT NULL,
  unit TEXT DEFAULT 'kg',
  price_per_unit REAL NOT NULL,
  total_value REAL NOT NULL,      -- auto-calculated: quantity × price_per_unit
  order_date DATE NOT NULL,
  status TEXT DEFAULT 'pending'   -- pending | confirmed | delivered | cancelled
         CHECK(status IN ('pending','confirmed','delivered','cancelled')),
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## Environment Variables (`backend/.env`)

```
PORT=5000
JWT_SECRET=fish_farm_super_secret_key_2024
JWT_EXPIRES_IN=7d
NODE_ENV=development
```

Change `JWT_SECRET` to a strong random string in production.
