const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDb } = require('../db/database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ message: 'Username and password required' });

  const user = getDb().prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user || !bcrypt.compareSync(password, user.password))
    return res.status(401).json({ message: 'Invalid credentials' });

  const token = jwt.sign(
    { id: user.id, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );

  res.json({
    token,
    user: { id: user.id, username: user.username, email: user.email, full_name: user.full_name }
  });
});

router.post('/register', (req, res) => {
  const { username, password, email, full_name } = req.body;
  if (!username || !password)
    return res.status(400).json({ message: 'Username and password required' });

  const existing = getDb().prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (existing) return res.status(409).json({ message: 'Username already exists' });

  const hashed = bcrypt.hashSync(password, 10);
  const result = getDb()
    .prepare('INSERT INTO users (username, password, email, full_name) VALUES (?, ?, ?, ?)')
    .run(username, hashed, email || null, full_name || null);

  res.status(201).json({ message: 'User created', id: result.lastInsertRowid });
});

router.get('/me', authMiddleware, (req, res) => {
  const user = getDb()
    .prepare('SELECT id, username, email, full_name, created_at FROM users WHERE id = ?')
    .get(req.user.id);
  res.json(user);
});

router.put('/profile', authMiddleware, (req, res) => {
  const { full_name, email } = req.body;
  getDb()
    .prepare('UPDATE users SET full_name=?, email=? WHERE id=?')
    .run(full_name || null, email || null, req.user.id);
  const updated = getDb()
    .prepare('SELECT id, username, email, full_name, created_at FROM users WHERE id = ?')
    .get(req.user.id);
  res.json(updated);
});

router.put('/password', authMiddleware, (req, res) => {
  const { current_password, new_password } = req.body;
  if (!current_password || !new_password)
    return res.status(400).json({ message: 'current_password and new_password are required' });
  if (new_password.length < 6)
    return res.status(400).json({ message: 'New password must be at least 6 characters' });

  const user = getDb().prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!bcrypt.compareSync(current_password, user.password))
    return res.status(401).json({ message: 'Current password is incorrect' });

  const hashed = bcrypt.hashSync(new_password, 10);
  getDb().prepare('UPDATE users SET password=? WHERE id=?').run(hashed, req.user.id);
  res.json({ message: 'Password updated successfully' });
});

module.exports = router;
