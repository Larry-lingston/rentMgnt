const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware, requireRole } = require('../middleware/auth');
const {
  generateRentNotificationsForLandlord,
  generateRentNotificationsForTenant,
} = require('../lib/rent-notifications');

const router = express.Router();
const prisma = new PrismaClient();

router.use(authMiddleware);
router.use(requireRole('admin', 'tenant'));

async function syncRentNotifications(user) {
  if (user.role === 'admin') {
    await generateRentNotificationsForLandlord(user.id);
  } else if (user.tenantProfileId) {
    await generateRentNotificationsForTenant(user.tenantProfileId, user.id);
  }
}

router.get('/', async (req, res) => {
  try {
    await syncRentNotifications(req.user);
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/unread-count', async (req, res) => {
  try {
    await syncRentNotifications(req.user);
    const count = await prisma.notification.count({
      where: { userId: req.user.id, read: false },
    });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/read-all', async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user.id, read: false },
      data: { read: true },
    });
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id/read', async (req, res) => {
  try {
    const notification = await prisma.notification.updateMany({
      where: { id: req.params.id, userId: req.user.id },
      data: { read: true },
    });
    res.json({ updated: notification.count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/generate', requireRole('admin'), async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const rentCount = await generateRentNotificationsForLandlord(userId);

    const tenants = await prisma.tenant.findMany({
      where: { userId, roomId: { not: null } },
      include: {
        room: true,
        payments: { where: { paymentDate: { gte: startOfMonth } } },
      },
    });

    const leaseNotifications = [];
    for (const tenant of tenants) {
      if (tenant.leaseEnd) {
        const daysUntilExpiry = Math.ceil((tenant.leaseEnd - now) / (1000 * 60 * 60 * 24));
        if (daysUntilExpiry <= 30 && daysUntilExpiry > 0) {
          leaseNotifications.push({
            userId,
            type: 'lease_expiry',
            title: 'Lease Expiry Notice',
            message: `${tenant.name}'s lease expires in ${daysUntilExpiry} days`,
          });
        }
      }
    }

    if (leaseNotifications.length > 0) {
      await prisma.notification.createMany({ data: leaseNotifications });
    }

    res.json({ generated: rentCount + leaseNotifications.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
