const express = require('express');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware, signToken, userSelect } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

router.post('/register', async (req, res) => {
  try {
    const { username, email, password, name, phone, accountType, landlordUsername } = req.body;
    if (!username || !email || !password || !name) {
      return res.status(400).json({ error: 'Username, email, password, and name are required' });
    }

    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    });
    if (existing) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }

    const roleMap = {
      landlord: 'admin',
      renter: 'seeker',
      seeker: 'seeker',
      tenant: 'tenant',
      maintenance: 'maintenance',
    };
    const role = roleMap[accountType] || 'seeker';

    if ((role === 'tenant' || role === 'maintenance') && !landlordUsername?.trim()) {
      return res.status(400).json({ error: 'Landlord username is required for this account type' });
    }

    let landlordId = null;
    if (role === 'tenant' || role === 'maintenance') {
      const landlord = await prisma.user.findFirst({
        where: {
          role: 'admin',
          OR: [
            { username: landlordUsername.trim() },
            { email: landlordUsername.trim() },
          ],
        },
      });
      if (!landlord) {
        return res.status(400).json({ error: 'Landlord not found. Ask your landlord for their username.' });
      }
      landlordId = landlord.id;
    }

    const hashed = await bcrypt.hash(password, 10);

    let user;
    if (role === 'tenant') {
      user = await prisma.$transaction(async (tx) => {
        const tenant = await tx.tenant.create({
          data: {
            name,
            email,
            phone: phone || 'N/A',
            userId: landlordId,
          },
        });
        return tx.user.create({
          data: {
            username,
            email,
            password: hashed,
            name,
            phone,
            role: 'tenant',
            landlordId,
            tenantProfileId: tenant.id,
          },
          select: userSelect,
        });
      });
    } else {
      user = await prisma.user.create({
        data: {
          username,
          email,
          password: hashed,
          name,
          phone,
          role,
          landlordId,
        },
        select: userSelect,
      });
    }

    const token = signToken(user);
    res.status(201).json({ user, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const user = await prisma.user.findFirst({
      where: { OR: [{ username }, { email: username }] },
    });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = signToken(user);
    const { password: _, ...safeUser } = user;
    res.json({ user: safeUser, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.json({ message: 'If that email exists, a reset link has been sent' });
  }
  res.json({ message: 'If that email exists, a reset link has been sent' });
});

router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        ...userSelect,
        tenantProfile: {
          include: { room: { include: { property: true } } },
        },
      },
    });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    const data = { name, email, phone };
    if (password) {
      data.password = await bcrypt.hash(password, 10);
    }
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data,
      select: userSelect,
    });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
