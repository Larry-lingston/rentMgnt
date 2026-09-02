const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { parseImageUrls, serializePropertyImages } = require('../lib/property-images');
const {
  trim, isRequired, parsePositiveInt, parseOptionalCoord, isOneOf, PROPERTY_TYPES,
} = require('../lib/validation');

const router = express.Router();
const prisma = new PrismaClient();

router.use(authMiddleware, requireRole('admin'));

router.get('/', async (req, res) => {
  try {
    const properties = await prisma.property.findMany({
      where: { userId: req.user.id },
      include: {
        rooms: { include: { tenant: true } },
        _count: { select: { rooms: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const enriched = properties.map((p) => {
      const occupied = p.rooms.filter((r) => r.status === 'occupied').length;
      const vacant = p.rooms.filter((r) => r.status === 'vacant').length;
      return { ...p, occupiedRooms: occupied, vacantRooms: vacant };
    });

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const property = await prisma.property.findFirst({
      where: { id: req.params.id, userId: req.user.id },
      include: { rooms: { include: { tenant: true } } },
    });
    if (!property) return res.status(404).json({ error: 'Property not found' });
    res.json(property);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, address, type, totalRooms, description, rooms, latitude, longitude } = req.body;
    if (!isRequired(name) || !isRequired(address)) {
      return res.status(400).json({ error: 'Name and address are required' });
    }
    if (type && !isOneOf(type, PROPERTY_TYPES)) {
      return res.status(400).json({ error: 'Invalid property type' });
    }

    const imageUrls = parseImageUrls(req.body);
    if (imageUrls.length === 0) {
      return res.status(400).json({
        error: 'At least one property photo is required so renters can view images before booking',
      });
    }

    const roomCount = parsePositiveInt(totalRooms) || 1;
    const lat = parseOptionalCoord(latitude, -90, 90);
    const lng = parseOptionalCoord(longitude, -180, 180);
    if (latitude != null && trim(latitude) !== '' && lat === undefined) {
      return res.status(400).json({ error: 'Latitude must be between -90 and 90' });
    }
    if (longitude != null && trim(longitude) !== '' && lng === undefined) {
      return res.status(400).json({ error: 'Longitude must be between -180 and 180' });
    }

    const coverImage = imageUrls[0];
    const roomData = rooms || Array.from({ length: roomCount }, (_, i) => ({
      roomNumber: `Room ${i + 1}`,
      rentAmount: 0,
      status: 'vacant',
      imageUrl: coverImage,
    }));

    const property = await prisma.property.create({
      data: {
        name: trim(name),
        address: trim(address),
        type: type || 'apartment',
        totalRooms: roomCount,
        description: trim(description) || null,
        ...serializePropertyImages(imageUrls),
        latitude: lat,
        longitude: lng,
        userId: req.user.id,
        rooms: {
          create: roomData.map((r) => ({
            ...r,
            imageUrl: r.imageUrl || coverImage,
          })),
        },
      },
      include: { rooms: true },
    });

    res.status(201).json(property);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const existing = await prisma.property.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!existing) return res.status(404).json({ error: 'Property not found' });

    const { name, address, type, description, latitude, longitude } = req.body;
    const imageUrls = parseImageUrls(req.body);
    if (imageUrls.length === 0) {
      return res.status(400).json({
        error: 'At least one property photo is required',
      });
    }
    if (name !== undefined && !isRequired(name)) {
      return res.status(400).json({ error: 'Name is required' });
    }
    if (address !== undefined && !isRequired(address)) {
      return res.status(400).json({ error: 'Address is required' });
    }
    if (type && !isOneOf(type, PROPERTY_TYPES)) {
      return res.status(400).json({ error: 'Invalid property type' });
    }

    const lat = parseOptionalCoord(latitude, -90, 90);
    const lng = parseOptionalCoord(longitude, -180, 180);
    if (latitude != null && trim(latitude) !== '' && lat === undefined) {
      return res.status(400).json({ error: 'Latitude must be between -90 and 90' });
    }
    if (longitude != null && trim(longitude) !== '' && lng === undefined) {
      return res.status(400).json({ error: 'Longitude must be between -180 and 180' });
    }

    const property = await prisma.property.update({
      where: { id: req.params.id },
      data: {
        name: name !== undefined ? trim(name) : undefined,
        address: address !== undefined ? trim(address) : undefined,
        type,
        description: description !== undefined ? (trim(description) || null) : undefined,
        ...serializePropertyImages(imageUrls),
        latitude: latitude !== undefined ? lat : undefined,
        longitude: longitude !== undefined ? lng : undefined,
      },
      include: { rooms: { include: { tenant: true } } },
    });

    res.json(property);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const existing = await prisma.property.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!existing) return res.status(404).json({ error: 'Property not found' });

    await prisma.property.delete({ where: { id: req.params.id } });
    res.json({ message: 'Property deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
