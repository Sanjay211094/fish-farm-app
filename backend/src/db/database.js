const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

// On Render, /data is a persistent disk; locally falls back to project root
const DB_PATH = process.env.DB_PATH ||
  (process.env.NODE_ENV === 'production'
    ? '/data/fish_farm.db'
    : path.join(__dirname, '../../fish_farm.db'));

let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

function initializeDatabase() {
  const database = getDb();

  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      email TEXT,
      full_name TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      address TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL,
      fish_type TEXT NOT NULL,
      quantity REAL NOT NULL,
      unit TEXT DEFAULT 'kg',
      price_per_unit REAL NOT NULL,
      total_value REAL NOT NULL,
      order_date DATE NOT NULL,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending','confirmed','delivered','cancelled')),
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
    );
  `);

  // Seed default admin user
  const existing = database.prepare('SELECT id FROM users WHERE username = ?').get('admin');
  if (!existing) {
    const hashed = bcrypt.hashSync('admin123', 10);
    database.prepare(
      'INSERT INTO users (username, password, email, full_name) VALUES (?, ?, ?, ?)'
    ).run('admin', hashed, 'admin@fishfarm.com', 'Farm Administrator');

    // Seed demo customers
    const insertCustomer = database.prepare(
      'INSERT INTO customers (name, email, phone, address) VALUES (?, ?, ?, ?)'
    );
    const c1 = insertCustomer.run('Ravi Seafoods', 'ravi@seafoods.com', '9876543210', 'Chennai, TN');
    const c2 = insertCustomer.run('Blue Ocean Traders', 'blue@ocean.com', '9123456789', 'Kochi, KL');
    const c3 = insertCustomer.run('Fresh Catch Co.', 'fresh@catch.com', '9988776655', 'Vizag, AP');

    // Seed demo orders (last 30 days)
    const insertOrder = database.prepare(`
      INSERT INTO orders (customer_id, fish_type, quantity, unit, price_per_unit, total_value, order_date, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const sampleOrders = [
      [c1.lastInsertRowid, 'Rohu', 50, 'kg', 180, 9000, '2026-05-18', 'delivered'],
      [c2.lastInsertRowid, 'Catla', 30, 'kg', 200, 6000, '2026-05-17', 'delivered'],
      [c3.lastInsertRowid, 'Tilapia', 80, 'kg', 150, 12000, '2026-05-15', 'delivered'],
      [c1.lastInsertRowid, 'Pomfret', 20, 'kg', 350, 7000, '2026-05-14', 'delivered'],
      [c2.lastInsertRowid, 'Rohu', 60, 'kg', 180, 10800, '2026-05-12', 'delivered'],
      [c3.lastInsertRowid, 'Catla', 45, 'kg', 200, 9000, '2026-05-10', 'delivered'],
      [c1.lastInsertRowid, 'Tilapia', 100, 'kg', 150, 15000, '2026-05-08', 'delivered'],
      [c2.lastInsertRowid, 'Pomfret', 25, 'kg', 350, 8750, '2026-05-05', 'delivered'],
      [c3.lastInsertRowid, 'Rohu', 70, 'kg', 180, 12600, '2026-05-03', 'delivered'],
      [c1.lastInsertRowid, 'Catla', 35, 'kg', 200, 7000, '2026-04-30', 'delivered'],
      [c2.lastInsertRowid, 'Tilapia', 90, 'kg', 150, 13500, '2026-04-25', 'delivered'],
      [c3.lastInsertRowid, 'Pomfret', 15, 'kg', 350, 5250, '2026-04-20', 'delivered'],
      [c1.lastInsertRowid, 'Rohu', 55, 'kg', 180, 9900, '2026-04-15', 'delivered'],
      [c2.lastInsertRowid, 'Catla', 40, 'kg', 200, 8000, '2026-04-10', 'delivered'],
      [c3.lastInsertRowid, 'Tilapia', 75, 'kg', 150, 11250, '2026-04-05', 'delivered'],
    ];
    sampleOrders.forEach(o => insertOrder.run(...o));
  }

  console.log('Database initialized at:', DB_PATH);
}

module.exports = { getDb, initializeDatabase };
