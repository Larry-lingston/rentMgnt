const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

function mapProperty(p) {
  return {
    id: p.id,
    name: p.name,
    address: p.address,
    latitude: p.latitude,
    longitude: p.longitude,
    type: p.type,
  };
}

/** Public pin for vacant listed rooms (browse / room detail without login) */
router.get('/public/:propertyId', async (req, res) => {
  try {
    const property = await prisma.property.findFirst({
      where: {
        id: req.params.propertyId,
        latitude: { not: null },
        longitude: { not: null },
        rooms: {
          some: {
            status: 'vacant',
            tenant: null,
          },
        },
      },
      select: { id: true, name: true, address: true, latitude: true, longitude: true, type: true },
    });
    if (!property) return res.status(404).json({ error: 'Property not found' });
    res.json(mapProperty(property));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/locations', authMiddleware, async (req, res) => {
  try {
    const { role, id: userId, tenantProfileId, landlordId } = req.user;
    let properties = [];

    if (role === 'admin') {
      properties = await prisma.property.findMany({
        where: { userId },
        select: { id: true, name: true, address: true, latitude: true, longitude: true, type: true },
      });
    } else if (role === 'tenant') {
      if (!tenantProfileId) return res.json([]);
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantProfileId },
        include: { room: { include: { property: true } } },
      });
      if (tenant?.room?.property) {
        properties = [tenant.room.property];
      }
    } else if (role === 'maintenance') {
      const [tasks, openJobs] = await Promise.all([
        prisma.maintenanceRequest.findMany({
          where: { assignedToId: userId },
          include: { property: true },
        }),
        prisma.maintenanceRequest.findMany({
          where: {
            assignmentMode: 'open',
            assignedToId: null,
            status: 'pending',
            property: { userId: landlordId },
          },
          include: { property: true },
        }),
      ]);
      const byId = new Map();
      [...tasks, ...openJobs].forEach((r) => {
        if (r.property) byId.set(r.property.id, r.property);
      });
      properties = Array.from(byId.values());
    } else {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(properties.map(mapProperty));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/locations/:propertyId', authMiddleware, async (req, res) => {
  try {
    const locations = await getAccessibleProperty(req.user, req.params.propertyId);
    if (!locations) return res.status(404).json({ error: 'Property not found' });
    res.json(mapProperty(locations));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

async function getAccessibleProperty(user, propertyId) {
  const { role, id: userId, tenantProfileId, landlordId } = user;

  if (role === 'admin') {
    return prisma.property.findFirst({
      where: { id: propertyId, userId },
      select: { id: true, name: true, address: true, latitude: true, longitude: true, type: true },
    });
  }

  if (role === 'tenant' && tenantProfileId) {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantProfileId },
      include: { room: { include: { property: true } } },
    });
    if (tenant?.room?.property?.id === propertyId) {
      return tenant.room.property;
    }
    return null;
  }

  if (role === 'maintenance') {
    const request = await prisma.maintenanceRequest.findFirst({
      where: {
        propertyId,
        OR: [
          { assignedToId: userId },
          {
            assignmentMode: 'open',
            assignedToId: null,
            status: 'pending',
            property: { userId: landlordId },
          },
        ],
      },
      include: { property: true },
    });
    return request?.property || null;
  }

  if (role === 'seeker') {
    return prisma.property.findFirst({
      where: {
        id: propertyId,
        latitude: { not: null },
        longitude: { not: null },
        rooms: { some: { status: 'vacant', tenant: null } },
      },
      select: { id: true, name: true, address: true, latitude: true, longitude: true, type: true },
    });
  }

  return null;
}

module.exports = router;
