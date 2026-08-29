const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { parsePropertyImages } = require('../lib/property-images');

const router = express.Router();
const prisma = new PrismaClient();

function enrichRoom(room) {
  if (!room) return room;
  const propertyImages = parsePropertyImages(room.property);
  return {
    ...room,
    property: room.property
      ? { ...room.property, propertyImages }
      : room.property,
    galleryImages: [
      ...(room.imageUrl ? [room.imageUrl] : []),
      ...propertyImages.filter((u) => u !== room.imageUrl),
    ],
  };
}

router.get('/', async (_req, res) => {
  try {
    const rooms = await prisma.room.findMany({
      where: {
        status: 'vacant',
        tenant: null,
        property: { imageUrl: { not: null } },
      },
      include: {
        property: {
          select: {
            id: true,
            name: true,
            address: true,
            type: true,
            description: true,
            imageUrl: true,
            images: true,
            latitude: true,
            longitude: true,
            user: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { property: { name: 'asc' } },
    });

    res.json(rooms.map(enrichRoom));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:roomId', async (req, res) => {
  try {
    const room = await prisma.room.findFirst({
      where: {
        id: req.params.roomId,
        status: 'vacant',
        tenant: null,
        property: { imageUrl: { not: null } },
      },
      include: {
        property: {
          select: {
            id: true,
            name: true,
            address: true,
            type: true,
            description: true,
            imageUrl: true,
            images: true,
            latitude: true,
            longitude: true,
            user: { select: { id: true, name: true, phone: true } },
          },
        },
      },
    });

    if (!room) return res.status(404).json({ error: 'Room not available' });
    res.json(enrichRoom(room));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
