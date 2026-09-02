const bcrypt = require('bcryptjs');
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware, requireRole } = require('../middleware/auth');
const {
  trim, isRequired, isPhone, isPassword, validateOptionalEmail, validateDateRange,
} = require('../lib/validation');

const router = express.Router();
const prisma = new PrismaClient();

router.use(authMiddleware, requireRole('admin'));

router.get('/', async (req, res) => {
  try {
    const tenants = await prisma.tenant.findMany({
      where: { userId: req.user.id },
      include: {
        room: { include: { property: true } },
        payments: { orderBy: { paymentDate: 'desc' }, take: 5 },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(tenants);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const tenant = await prisma.tenant.findFirst({
      where: { id: req.params.id, userId: req.user.id },
      include: {
        room: { include: { property: true } },
        payments: { orderBy: { paymentDate: 'desc' } },
        maintenanceRequests: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!tenant) return res.status(404).json({ error: 'Tenant not found' });
    res.json(tenant);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, email, phone, leaseStart, leaseEnd, roomId, accountUsername, accountPassword } = req.body;
    if (!isRequired(name) || !isRequired(phone)) {
      return res.status(400).json({ error: 'Name and phone are required' });
    }
    if (!isPhone(phone)) {
      return res.status(400).json({ error: 'Enter a valid phone number' });
    }
    const emailError = validateOptionalEmail(email);
    if (emailError) {
      return res.status(400).json({ error: emailError });
    }
    const leaseError = validateDateRange(leaseStart, leaseEnd);
    if (leaseError) {
      return res.status(400).json({ error: leaseError });
    }
    if ((accountUsername && !accountPassword) || (!accountUsername && accountPassword)) {
      return res.status(400).json({ error: 'Both account username and password are required to create a login' });
    }
    if (accountPassword && !isPassword(accountPassword)) {
      return res.status(400).json({ error: 'Account password must be at least 6 characters' });
    }

    if (roomId) {
      const room = await prisma.room.findFirst({
        where: { id: roomId, property: { userId: req.user.id } },
      });
      if (!room) return res.status(404).json({ error: 'Room not found' });
      if (room.status === 'occupied') {
        return res.status(400).json({ error: 'Room is already occupied' });
      }
    }

    const tenant = await prisma.$transaction(async (tx) => {
      const created = await tx.tenant.create({
        data: {
          name: trim(name),
          email: trim(email) || null,
          phone: trim(phone),
          leaseStart: leaseStart ? new Date(leaseStart) : null,
          leaseEnd: leaseEnd ? new Date(leaseEnd) : null,
          roomId: roomId || null,
          userId: req.user.id,
        },
        include: { room: { include: { property: true } } },
      });

      if (roomId) {
        await tx.room.update({ where: { id: roomId }, data: { status: 'occupied' } });
      }

      if (accountUsername && accountPassword) {
        const existingUser = await tx.user.findFirst({
          where: { OR: [{ username: trim(accountUsername) }, { email: trim(email) || `${trim(accountUsername)}@tenant.local` }] },
        });
        if (existingUser) {
          throw Object.assign(new Error('Account username or email already exists'), { status: 400 });
        }
        const hashed = await bcrypt.hash(accountPassword, 10);
        await tx.user.create({
          data: {
            username: trim(accountUsername),
            email: trim(email) || `${trim(accountUsername)}@tenant.local`,
            password: hashed,
            name: trim(name),
            phone: trim(phone),
            role: 'tenant',
            landlordId: req.user.id,
            tenantProfileId: created.id,
          },
        });
      }

      return created;
    });

    res.status(201).json(tenant);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const existing = await prisma.tenant.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!existing) return res.status(404).json({ error: 'Tenant not found' });

    const { name, email, phone, leaseStart, leaseEnd, roomId } = req.body;

    if (name !== undefined && !isRequired(name)) {
      return res.status(400).json({ error: 'Name is required' });
    }
    if (phone !== undefined && !isRequired(phone)) {
      return res.status(400).json({ error: 'Phone is required' });
    }
    if (phone !== undefined && !isPhone(phone)) {
      return res.status(400).json({ error: 'Enter a valid phone number' });
    }
    const emailError = validateOptionalEmail(email);
    if (emailError) {
      return res.status(400).json({ error: emailError });
    }
    const leaseError = validateDateRange(leaseStart, leaseEnd);
    if (leaseError) {
      return res.status(400).json({ error: leaseError });
    }

    const tenant = await prisma.$transaction(async (tx) => {
      if (existing.roomId && existing.roomId !== roomId) {
        await tx.room.update({ where: { id: existing.roomId }, data: { status: 'vacant' } });
      }

      if (roomId && roomId !== existing.roomId) {
        const room = await tx.room.findFirst({
          where: { id: roomId, property: { userId: req.user.id } },
        });
        if (!room) {
          const err = new Error('Room not found');
          err.status = 404;
          throw err;
        }
        if (room.status === 'occupied' && room.id !== existing.roomId) {
          const err = new Error('Room is already occupied');
          err.status = 400;
          throw err;
        }
        await tx.room.update({ where: { id: roomId }, data: { status: 'occupied' } });
      }

      return tx.tenant.update({
        where: { id: req.params.id },
        data: {
          name: name !== undefined ? trim(name) : undefined,
          email: email !== undefined ? (trim(email) || null) : undefined,
          phone: phone !== undefined ? trim(phone) : undefined,
          leaseStart: leaseStart ? new Date(leaseStart) : undefined,
          leaseEnd: leaseEnd ? new Date(leaseEnd) : undefined,
          roomId: roomId !== undefined ? roomId : undefined,
        },
        include: { room: { include: { property: true } } },
      });
    });

    res.json(tenant);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const existing = await prisma.tenant.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!existing) return res.status(404).json({ error: 'Tenant not found' });

    await prisma.$transaction(async (tx) => {
      if (existing.roomId) {
        await tx.room.update({ where: { id: existing.roomId }, data: { status: 'vacant' } });
      }
      await tx.tenant.delete({ where: { id: req.params.id } });
    });

    res.json({ message: 'Tenant deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
