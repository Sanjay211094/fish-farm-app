const express = require('express');
const { getDb } = require('../db/database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

router.get('/', (req, res) => {
  const customers = getDb().prepare(`
    SELECT c.*, COUNT(o.id) as order_count, COALESCE(SUM(o.total_value), 0) as total_spent
    FROM customers c
    LEFT JOIN orders o ON o.customer_id = c.id
    GROUP BY c.id
    ORDER BY c.created_at DESC
  `).all();
  res.json(customers);
});

router.get('/:id', (req, res) => {
  const customer = getDb()
    .prepare('SELECT * FROM customers WHERE id = ?')
    .get(req.params.id);
  if (!customer) return res.status(404).json({ message: 'Customer not found' });

  const orders = getDb()
    .prepare('SELECT * FROM orders WHERE customer_id = ? ORDER BY order_date DESC')
    .all(req.params.id);

  res.json({ ...customer, orders });
});

router.post('/', (req, res) => {
  const { name, email, phone, address, notes } = req.body;
  if (!name) return res.status(400).json({ message: 'Customer name is required' });

  const result = getDb()
    .prepare('INSERT INTO customers (name, email, phone, address, notes) VALUES (?, ?, ?, ?, ?)')
    .run(name, email || null, phone || null, address || null, notes || null);

  const customer = getDb()
    .prepare('SELECT * FROM customers WHERE id = ?')
    .get(result.lastInsertRowid);
  res.status(201).json(customer);
});

router.put('/:id', (req, res) => {
  const { name, email, phone, address, notes } = req.body;
  const existing = getDb().prepare('SELECT id FROM customers WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ message: 'Customer not found' });

  getDb().prepare(`
    UPDATE customers SET name=?, email=?, phone=?, address=?, notes=? WHERE id=?
  `).run(name, email || null, phone || null, address || null, notes || null, req.params.id);

  res.json(getDb().prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id));
});

router.delete('/:id', (req, res) => {
  const existing = getDb().prepare('SELECT id FROM customers WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ message: 'Customer not found' });

  getDb().prepare('DELETE FROM customers WHERE id = ?').run(req.params.id);
  res.json({ message: 'Customer deleted' });
});

module.exports = router;
