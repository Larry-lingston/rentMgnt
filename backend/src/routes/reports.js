const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware, requireRole } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

router.use(authMiddleware, requireRole('admin'));

router.get('/monthly-collection', async (req, res) => {
  try {
    const { month, year } = req.query;
    const now = new Date();
    const parsedYear = parseInt(year, 10);
    const parsedMonth = parseInt(month, 10);
    const y = Number.isFinite(parsedYear) ? parsedYear : now.getFullYear();
    const m = Number.isFinite(parsedMonth) ? parsedMonth - 1 : now.getMonth();
    const start = new Date(y, m, 1);
    const end = new Date(y, m + 1, 0, 23, 59, 59);

    const payments = await prisma.payment.findMany({
      where: {
        tenant: { userId: req.user.id },
        paymentDate: { gte: start, lte: end },
      },
      include: {
        tenant: { include: { room: { include: { property: true } } } },
      },
      orderBy: { paymentDate: 'desc' },
    });

    const total = payments.reduce((sum, p) => sum + p.amount, 0);

    res.json({
      period: { month: m + 1, year: y },
      totalCollected: total,
      paymentCount: payments.length,
      payments,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/outstanding-balances', async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const tenants = await prisma.tenant.findMany({
      where: { userId: req.user.id, roomId: { not: null } },
      include: {
        room: { include: { property: true } },
        payments: { where: { paymentDate: { gte: startOfMonth } } },
      },
    });

    const balances = tenants.map((t) => {
      const monthlyRent = t.room?.rentAmount || 0;
      const paid = t.payments.reduce((s, p) => s + p.amount, 0);
      return {
        tenantId: t.id,
        tenantName: t.name,
        property: t.room?.property?.name,
        room: t.room?.roomNumber,
        monthlyRent,
        paid,
        outstanding: Math.max(0, monthlyRent - paid),
      };
    });

    const totalOutstanding = balances.reduce((s, b) => s + b.outstanding, 0);

    res.json({ totalOutstanding, balances: balances.filter((b) => b.outstanding > 0) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/occupancy', async (req, res) => {
  try {
    const properties = await prisma.property.findMany({
      where: { userId: req.user.id },
      include: {
        rooms: { include: { tenant: true } },
      },
    });

    const report = properties.map((p) => {
      const occupied = p.rooms.filter((r) => r.status === 'occupied').length;
      const vacant = p.rooms.filter((r) => r.status === 'vacant').length;
      const rate = p.rooms.length > 0 ? (occupied / p.rooms.length) * 100 : 0;
      return {
        propertyId: p.id,
        propertyName: p.name,
        address: p.address,
        totalRooms: p.rooms.length,
        occupied,
        vacant,
        occupancyRate: rate.toFixed(1),
        rooms: p.rooms.map((r) => ({
          roomNumber: r.roomNumber,
          status: r.status,
          tenant: r.tenant?.name || null,
          rentAmount: r.rentAmount,
        })),
      };
    });

    res.json(report);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/tenants', async (req, res) => {
  try {
    const tenants = await prisma.tenant.findMany({
      where: { userId: req.user.id },
      include: {
        room: { include: { property: true } },
        payments: { orderBy: { paymentDate: 'desc' }, take: 1 },
        _count: { select: { payments: true, maintenanceRequests: true } },
      },
      orderBy: { name: 'asc' },
    });

    const report = tenants.map((t) => ({
      id: t.id,
      name: t.name,
      email: t.email,
      phone: t.phone,
      property: t.room?.property?.name || 'Unassigned',
      room: t.room?.roomNumber || 'N/A',
      leaseStart: t.leaseStart,
      leaseEnd: t.leaseEnd,
      totalPayments: t._count.payments,
      maintenanceRequests: t._count.maintenanceRequests,
      lastPayment: t.payments[0] || null,
    }));

    res.json(report);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
