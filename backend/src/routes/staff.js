const express = require('express');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { trim, isRequired, isEmail, isPassword } = require('../lib/validation');

const router = express.Router();
const prisma = new PrismaClient();

router.use(authMiddleware, requireRole('admin'));

router.get('/', async (req, res) => {
  try {
    const { search } = req.query;
    const staff = await prisma.user.findMany({
      where: {
        role: 'maintenance',
        landlordId: req.user.id,
        ...(search
          ? {
              OR: [
                { name: { contains: search } },
                { username: { contains: search } },
                { email: { contains: search } },
              ],
            }
          : {}),
      },
      select: { id: true, name: true, email: true, phone: true, username: true, createdAt: true },
      orderBy: { name: 'asc' },
    });
    res.json(staff);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { username, email, password, name, phone } = req.body;
    if (!isRequired(username) || !isRequired(email) || !isRequired(password) || !isRequired(name)) {
      return res.status(400).json({ error: 'Username, email, password, and name are required' });
    }
    if (!isEmail(email)) {
      return res.status(400).json({ error: 'Enter a valid email address' });
    }
    if (!isPassword(password)) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const cleanUsername = trim(username);
    const cleanEmail = trim(email);

    const existing = await prisma.user.findFirst({
      where: { OR: [{ email: cleanEmail }, { username: cleanUsername }] },
    });
    if (existing) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const staff = await prisma.user.create({
      data: {
        username: cleanUsername,
        email: cleanEmail,
        password: hashed,
        name: trim(name),
        phone: trim(phone) || null,
        role: 'maintenance',
        landlordId: req.user.id,
      },
      select: { id: true, name: true, email: true, phone: true, username: true },
    });

    res.status(201).json(staff);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
