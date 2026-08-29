const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware, requireRole } = require('../middleware/auth');
const {
  MAINTENANCE_STATUSES,
  notifyMaintenanceParties,
  notifyAllLandlordCrew,
  validateLandlordStaff,
} = require('../lib/helpers');

const router = express.Router();
const prisma = new PrismaClient();

router.use(authMiddleware, requireRole('admin'));

router.get('/', async (req, res) => {
  try {
    const requests = await prisma.maintenanceRequest.findMany({
      where: { property: { userId: req.user.id } },
      include: {
        tenant: true,
        property: true,
        assignedTo: { select: { id: true, name: true, phone: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { title, description, propertyId, tenantId, priority, assignmentMode, assignedToId } = req.body;
    if (!title || !description || !propertyId) {
      return res.status(400).json({ error: 'Title, description, and property are required' });
    }

    const property = await prisma.property.findFirst({
      where: { id: propertyId, userId: req.user.id },
    });
    if (!property) return res.status(404).json({ error: 'Property not found' });

    const mode = assignmentMode === 'selected' ? 'selected' : 'open';
    let staffId = null;

    if (mode === 'selected') {
      if (!assignedToId) {
        return res.status(400).json({ error: 'Please select a crew member' });
      }
      const staff = await validateLandlordStaff(req.user.id, assignedToId);
      if (!staff) return res.status(404).json({ error: 'Crew member not found' });
      staffId = staff.id;
    }

    const request = await prisma.maintenanceRequest.create({
      data: {
        title,
        description,
        propertyId,
        tenantId: tenantId || null,
        priority: priority || 'medium',
        requestedBy: 'admin',
        assignmentMode: mode,
        assignedToId: staffId,
        claimedAt: staffId ? new Date() : null,
        status: 'pending',
      },
      include: {
        tenant: true,
        property: true,
        assignedTo: { select: { id: true, name: true } },
      },
    });

    if (mode === 'open') {
      await notifyAllLandlordCrew(req.user.id, 'Open Maintenance Job', `FCFS: ${title} at ${property.name}`);
    } else if (staffId) {
      await notifyMaintenanceParties({
        staffUserId: staffId,
        title: 'Maintenance Job Assigned',
        message: `You were selected for: ${title}`,
      });
    }

    res.status(201).json(request);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id/assign', async (req, res) => {
  try {
    const { assignedToId } = req.body;
    if (!assignedToId) {
      return res.status(400).json({ error: 'Staff member is required' });
    }

    const staff = await validateLandlordStaff(req.user.id, assignedToId);
    if (!staff) return res.status(404).json({ error: 'Maintenance staff not found' });

    const existing = await prisma.maintenanceRequest.findFirst({
      where: { id: req.params.id, property: { userId: req.user.id } },
      include: { tenant: { include: { accountUser: true } } },
    });
    if (!existing) return res.status(404).json({ error: 'Request not found' });

    const request = await prisma.maintenanceRequest.update({
      where: { id: req.params.id },
      data: {
        assignedToId,
        assignmentMode: 'selected',
        claimedAt: new Date(),
      },
      include: {
        tenant: true,
        property: true,
        assignedTo: { select: { id: true, name: true, phone: true } },
      },
    });

    await notifyMaintenanceParties({
      staffUserId: staff.id,
      tenantUserId: existing.tenant?.accountUser?.id,
      title: 'Maintenance Assigned',
      message: `You were assigned: ${existing.title}`,
    });

    res.json(request);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!MAINTENANCE_STATUSES.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const existing = await prisma.maintenanceRequest.findFirst({
      where: { id: req.params.id, property: { userId: req.user.id } },
      include: { tenant: { include: { accountUser: true } } },
    });
    if (!existing) return res.status(404).json({ error: 'Request not found' });

    const request = await prisma.maintenanceRequest.update({
      where: { id: req.params.id },
      data: { status },
      include: {
        tenant: true,
        property: true,
        assignedTo: { select: { id: true, name: true } },
      },
    });

    if (existing.tenant?.accountUser) {
      await notifyMaintenanceParties({
        tenantUserId: existing.tenant.accountUser.id,
        title: 'Maintenance Update',
        message: `Your request "${existing.title}" is now ${status}`,
      });
    }

    res.json(request);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
