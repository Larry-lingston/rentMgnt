const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { parsePositiveAmount, isOneOf, PAYMENT_METHODS } = require('../lib/validation');

const router = express.Router();
const prisma = new PrismaClient();

router.use(authMiddleware, requireRole('admin'));

function generateReceiptNumber() {
  return `RCP-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
}

router.get('/', async (req, res) => {
  try {
    const payments = await prisma.payment.findMany({
      where: { tenant: { userId: req.user.id } },
      include: {
        tenant: {
          include: { room: { include: { property: true } } },
        },
      },
      orderBy: { paymentDate: 'desc' },
    });
    res.json(payments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/outstanding', async (req, res) => {
  try {
    const tenants = await prisma.tenant.findMany({
      where: { userId: req.user.id, roomId: { not: null } },
      include: {
        room: true,
        payments: {
          where: {
            paymentDate: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            },
          },
        },
      },
    });

    const outstanding = tenants.map((t) => {
      const monthlyRent = t.room?.rentAmount || 0;
      const paidThisMonth = t.payments.reduce((sum, p) => sum + p.amount, 0);
      const balance = Math.max(0, monthlyRent - paidThisMonth);
      return {
        tenantId: t.id,
        tenantName: t.name,
        roomNumber: t.room?.roomNumber,
        monthlyRent,
        paidThisMonth,
        outstanding: balance,
        dueDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      };
    }).filter((o) => o.outstanding > 0);

    res.json(outstanding);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/tenant/:tenantId', async (req, res) => {
  try {
    const payments = await prisma.payment.findMany({
      where: {
        tenantId: req.params.tenantId,
        tenant: { userId: req.user.id },
      },
      orderBy: { paymentDate: 'desc' },
    });
    res.json(payments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { tenantId, amount, paymentDate, method, notes } = req.body;
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant is required' });
    }
    const parsedAmount = parsePositiveAmount(amount);
    if (!parsedAmount) {
      return res.status(400).json({ error: 'Enter a valid amount greater than 0' });
    }
    if (method && !isOneOf(method, PAYMENT_METHODS)) {
      return res.status(400).json({ error: 'Invalid payment method' });
    }

    const tenant = await prisma.tenant.findFirst({
      where: { id: tenantId, userId: req.user.id },
    });
    if (!tenant) return res.status(404).json({ error: 'Tenant not found' });

    const payment = await prisma.payment.create({
      data: {
        tenantId,
        amount: parsedAmount,
        paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
        method: method || 'cash',
        receiptNumber: generateReceiptNumber(),
        notes,
      },
      include: {
        tenant: { include: { room: { include: { property: true } } } },
      },
    });

    res.status(201).json(payment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/receipt/:id', async (req, res) => {
  try {
    const payment = await prisma.payment.findFirst({
      where: {
        id: req.params.id,
        tenant: { userId: req.user.id },
      },
      include: {
        tenant: { include: { room: { include: { property: true } } } },
      },
    });
    if (!payment) return res.status(404).json({ error: 'Payment not found' });
    res.json(payment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
