const express = require('express');
const { getDb } = require('../db/database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

router.get('/summary', (req, res) => {
  const db = getDb();
  const totalRevenue = db.prepare("SELECT COALESCE(SUM(total_value),0) as val FROM orders WHERE status != 'cancelled'").get().val;
  const totalOrders = db.prepare("SELECT COUNT(*) as cnt FROM orders WHERE status != 'cancelled'").get().cnt;
  const totalCustomers = db.prepare('SELECT COUNT(*) as cnt FROM customers').get().cnt;
  const pendingOrders = db.prepare("SELECT COUNT(*) as cnt FROM orders WHERE status = 'pending'").get().cnt;

  const recentRevenue = db.prepare(`
    SELECT COALESCE(SUM(total_value),0) as val FROM orders
    WHERE status != 'cancelled' AND order_date >= date('now','-30 days')
  `).get().val;

  const topCustomers = db.prepare(`
    SELECT c.name, COUNT(o.id) as orders, COALESCE(SUM(o.total_value),0) as revenue
    FROM customers c LEFT JOIN orders o ON o.customer_id = c.id AND o.status != 'cancelled'
    GROUP BY c.id ORDER BY revenue DESC LIMIT 5
  `).all();

  const topFish = db.prepare(`
    SELECT fish_type, SUM(quantity) as total_qty, SUM(total_value) as revenue
    FROM orders WHERE status != 'cancelled'
    GROUP BY fish_type ORDER BY revenue DESC LIMIT 5
  `).all();

  res.json({ totalRevenue, totalOrders, totalCustomers, pendingOrders, recentRevenue, topCustomers, topFish });
});

router.get('/daily', (req, res) => {
  const days = parseInt(req.query.days) || 30;
  const data = getDb().prepare(`
    SELECT order_date as date,
           COUNT(*) as orders,
           COALESCE(SUM(total_value), 0) as revenue
    FROM orders
    WHERE status != 'cancelled'
      AND order_date >= date('now', ? || ' days')
    GROUP BY order_date
    ORDER BY order_date ASC
  `).all(`-${days}`);
  res.json(data);
});

router.get('/weekly', (req, res) => {
  const weeks = parseInt(req.query.weeks) || 12;
  const data = getDb().prepare(`
    SELECT strftime('%Y-W%W', order_date) as week,
           COUNT(*) as orders,
           COALESCE(SUM(total_value), 0) as revenue
    FROM orders
    WHERE status != 'cancelled'
      AND order_date >= date('now', ? || ' days')
    GROUP BY week
    ORDER BY week ASC
  `).all(`-${weeks * 7}`);
  res.json(data);
});

router.get('/monthly', (req, res) => {
  const months = parseInt(req.query.months) || 12;
  const data = getDb().prepare(`
    SELECT strftime('%Y-%m', order_date) as month,
           COUNT(*) as orders,
           COALESCE(SUM(total_value), 0) as revenue
    FROM orders
    WHERE status != 'cancelled'
      AND order_date >= date('now', ? || ' months')
    GROUP BY month
    ORDER BY month ASC
  `).all(`-${months}`);
  res.json(data);
});

module.exports = router;
