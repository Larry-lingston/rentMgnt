const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { generateRentNotificationsForLandlord } = require('../lib/rent-notifications');

const router = express.Router();
const prisma = new PrismaClient();

router.use(authMiddleware, requireRole('admin'));

router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    await generateRentNotificationsForLandlord(userId);
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const [properties, tenants, rooms, monthlyPayments, recentPayments] = await Promise.all([
      prisma.property.count({ where: { userId } }),
      prisma.tenant.count({ where: { userId } }),
      prisma.room.findMany({
        where: { property: { userId } },
        include: { tenant: true },
      }),
      prisma.payment.aggregate({
        where: {
          tenant: { userId },
          paymentDate: { gte: startOfMonth, lte: endOfMonth },
        },
        _sum: { amount: true },
      }),
      prisma.payment.findMany({
        where: { tenant: { userId } },
        include: {
          tenant: { include: { room: { include: { property: true } } } },
        },
        orderBy: { paymentDate: 'desc' },
        take: 5,
      }),
    ]);

    const occupiedRooms = rooms.filter((r) => r.status === 'occupied').length;
    const vacantRooms = rooms.filter((r) => r.status === 'vacant').length;

    const tenantsWithRooms = await prisma.tenant.findMany({
      where: { userId, roomId: { not: null } },
      include: {
        room: true,
        payments: {
          where: { paymentDate: { gte: startOfMonth } },
        },
      },
    });

    const outstandingTotal = tenantsWithRooms.reduce((sum, t) => {
      const rent = t.room?.rentAmount || 0;
      const paid = t.payments.reduce((s, p) => s + p.amount, 0);
      return sum + Math.max(0, rent - paid);
    }, 0);

    res.json({
      totalProperties: properties,
      totalTenants: tenants,
      occupiedRooms,
      vacantRooms,
      monthlyIncome: monthlyPayments._sum.amount || 0,
      outstandingPayments: outstandingTotal,
      recentTransactions: recentPayments,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
