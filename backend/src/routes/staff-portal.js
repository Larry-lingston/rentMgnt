const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { MAINTENANCE_STATUSES, notifyMaintenanceParties } = require('../lib/helpers');

const router = express.Router();
const prisma = new PrismaClient();

router.use(authMiddleware, requireRole('maintenance'));

router.get('/available', async (req, res) => {
  try {
    const jobs = await prisma.maintenanceRequest.findMany({
      where: {
        assignmentMode: 'open',
        assignedToId: null,
        status: 'pending',
        property: { userId: req.user.landlordId },
      },
      include: { tenant: true, property: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/available/:id/claim', async (req, res) => {
  try {
    const result = await prisma.$transaction(async (tx) => {
      const job = await tx.maintenanceRequest.findFirst({
        where: {
          id: req.params.id,
          assignmentMode: 'open',
          assignedToId: null,
          status: 'pending',
          property: { userId: req.user.landlordId },
        },
        include: { tenant: { include: { accountUser: true } }, property: true },
      });

      if (!job) throw new Error('Job already claimed or no longer available');

      return tx.maintenanceRequest.update({
        where: { id: job.id },
        data: { assignedToId: req.user.id, claimedAt: new Date() },
        include: { tenant: true, property: true, assignedTo: { select: { id: true, name: true } } },
      });
    });

    await notifyMaintenanceParties({
      landlordId: req.user.landlordId,
      tenantUserId: result.tenant?.accountUser?.id,
      title: 'Maintenance Job Claimed',
      message: `${req.user.username} claimed "${result.title}"`,
    });

    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/tasks', async (req, res) => {
  try {
    const tasks = await prisma.maintenanceRequest.findMany({
      where: { assignedToId: req.user.id },
      include: { tenant: true, property: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/tasks/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!MAINTENANCE_STATUSES.includes(status)) {
      return res.status(400).json({ error: 'Status must be pending, cancelled, or completed' });
    }

    const existing = await prisma.maintenanceRequest.findFirst({
      where: { id: req.params.id, assignedToId: req.user.id },
      include: { tenant: { include: { accountUser: true } }, property: true },
    });
    if (!existing) return res.status(404).json({ error: 'Task not found' });

    const task = await prisma.maintenanceRequest.update({
      where: { id: req.params.id },
      data: { status },
      include: { tenant: true, property: true },
    });

    await notifyMaintenanceParties({
      landlordId: existing.property?.userId,
      tenantUserId: existing.tenant?.accountUser?.id,
      title: 'Maintenance Status Updated',
      message: `"${existing.title}" is now ${status}`,
    });

    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
