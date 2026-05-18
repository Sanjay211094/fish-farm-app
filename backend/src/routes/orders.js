const express = require('express');
const { getDb } = require('../db/database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

router.get('/', (req, res) => {
  const { customer_id, status, from, to } = req.query;
  let query = `
    SELECT o.*, c.name as customer_name
    FROM orders o
    JOIN customers c ON c.id = o.customer_id
    WHERE 1=1
  `;
  const params = [];

  if (customer_id) { query += ' AND o.customer_id = ?'; params.push(customer_id); }
  if (status) { query += ' AND o.status = ?'; params.push(status); }
  if (from) { query += ' AND o.order_date >= ?'; params.push(from); }
  if (to) { query += ' AND o.order_date <= ?'; params.push(to); }

  query += ' ORDER BY o.order_date DESC';
  res.json(getDb().prepare(query).all(...params));
});

router.get('/:id', (req, res) => {
  const order = getDb().prepare(`
    SELECT o.*, c.name as customer_name
    FROM orders o JOIN customers c ON c.id = o.customer_id
    WHERE o.id = ?
  `).get(req.params.id);
  if (!order) return res.status(404).json({ message: 'Order not found' });
  res.json(order);
});

router.post('/', (req, res) => {
  const { customer_id, fish_type, quantity, unit, price_per_unit, order_date, status, notes } = req.body;

  if (!customer_id || !fish_type || !quantity || !price_per_unit || !order_date)
    return res.status(400).json({ message: 'customer_id, fish_type, quantity, price_per_unit, order_date are required' });

  const customer = getDb().prepare('SELECT id FROM customers WHERE id = ?').get(customer_id);
  if (!customer) return res.status(404).json({ message: 'Customer not found' });

  const total_value = parseFloat(quantity) * parseFloat(price_per_unit);
  const result = getDb().prepare(`
    INSERT INTO orders (customer_id, fish_type, quantity, unit, price_per_unit, total_value, order_date, status, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(customer_id, fish_type, quantity, unit || 'kg', price_per_unit, total_value, order_date, status || 'pending', notes || null);

  const order = getDb().prepare(`
    SELECT o.*, c.name as customer_name
    FROM orders o JOIN customers c ON c.id = o.customer_id
    WHERE o.id = ?
  `).get(result.lastInsertRowid);
  res.status(201).json(order);
});

router.put('/:id', (req, res) => {
  const { fish_type, quantity, unit, price_per_unit, order_date, status, notes } = req.body;
  const existing = getDb().prepare('SELECT id FROM orders WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ message: 'Order not found' });

  const total_value = parseFloat(quantity) * parseFloat(price_per_unit);
  getDb().prepare(`
    UPDATE orders SET fish_type=?, quantity=?, unit=?, price_per_unit=?, total_value=?,
    order_date=?, status=?, notes=? WHERE id=?
  `).run(fish_type, quantity, unit || 'kg', price_per_unit, total_value, order_date, status, notes || null, req.params.id);

  res.json(getDb().prepare(`
    SELECT o.*, c.name as customer_name FROM orders o JOIN customers c ON c.id = o.customer_id WHERE o.id = ?
  `).get(req.params.id));
});

router.delete('/:id', (req, res) => {
  const existing = getDb().prepare('SELECT id FROM orders WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ message: 'Order not found' });
  getDb().prepare('DELETE FROM orders WHERE id = ?').run(req.params.id);
  res.json({ message: 'Order deleted' });
});

module.exports = router;
