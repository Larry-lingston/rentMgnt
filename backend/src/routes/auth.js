const express = require('express');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware, signToken, userSelect } = require('../middleware/auth');
const {
  trim, isRequired, isEmail, isPassword, isPhone, ACCOUNT_TYPES, validateOptionalEmail,
} = require('../lib/validation');

const router = express.Router();
const prisma = new PrismaClient();

router.post('/register', async (req, res) => {
  try {
    const { username, email, password, name, phone, accountType, landlordUsername } = req.body;

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
    const cleanName = trim(name);

    const existing = await prisma.user.findFirst({
      where: { OR: [{ email: cleanEmail }, { username: cleanUsername }] },
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
    if (accountType && !ACCOUNT_TYPES.includes(accountType)) {
      return res.status(400).json({ error: 'Invalid account type' });
    }

    if ((role === 'tenant' || role === 'maintenance') && !isRequired(landlordUsername)) {
      return res.status(400).json({ error: 'Landlord username is required for this account type' });
    }

    let landlordId = null;
    if (role === 'tenant' || role === 'maintenance') {
      const landlord = await prisma.user.findFirst({
        where: {
          role: 'admin',
          OR: [
            { username: trim(landlordUsername) },
            { email: trim(landlordUsername) },
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
            name: cleanName,
            email: cleanEmail,
            phone: trim(phone) || 'N/A',
            userId: landlordId,
          },
        });
        return tx.user.create({
          data: {
            username: cleanUsername,
            email: cleanEmail,
            password: hashed,
            name: cleanName,
            phone: trim(phone) || null,
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
          username: cleanUsername,
          email: cleanEmail,
          password: hashed,
          name: cleanName,
          phone: trim(phone) || null,
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
    if (!isRequired(username) || !isRequired(password)) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const identifier = trim(username);
    const user = await prisma.user.findFirst({
      where: { OR: [{ username: identifier }, { email: identifier }] },
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
  try {
    const { email } = req.body;
    if (!isRequired(email)) {
      return res.status(400).json({ error: 'Email is required' });
    }
    if (!isEmail(email)) {
      return res.status(400).json({ error: 'Enter a valid email address' });
    }

    const user = await prisma.user.findUnique({ where: { email: trim(email) } });
    if (!user) {
      return res.json({ message: 'If that email exists, a reset link has been sent' });
    }
    res.json({ message: 'If that email exists, a reset link has been sent' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
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
    const data = {};

    if (name !== undefined) {
      if (!isRequired(name)) {
        return res.status(400).json({ error: 'Name is required' });
      }
      data.name = trim(name);
    }
    if (email !== undefined) {
      if (!isRequired(email)) {
        return res.status(400).json({ error: 'Email is required' });
      }
      if (!isEmail(email)) {
        return res.status(400).json({ error: 'Enter a valid email address' });
      }
      const cleanEmail = trim(email);
      const existing = await prisma.user.findFirst({
        where: { email: cleanEmail, NOT: { id: req.user.id } },
      });
      if (existing) {
        return res.status(400).json({ error: 'Email is already in use' });
      }
      data.email = cleanEmail;
    }
    if (phone !== undefined) {
      data.phone = trim(phone) || null;
    }
    if (password) {
      if (!isPassword(password)) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
      }
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
