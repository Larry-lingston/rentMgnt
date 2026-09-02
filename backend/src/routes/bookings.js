const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware, requireRole, userSelect } = require('../middleware/auth');
const { trim } = require('../lib/validation');

const router = express.Router();
const prisma = new PrismaClient();

async function notifyUser(userId, type, title, message) {
  await prisma.notification.create({ data: { userId, type, title, message } });
}

router.post('/', authMiddleware, requireRole('seeker'), async (req, res) => {
  try {
    const { roomId, message } = req.body;
    if (!roomId) return res.status(400).json({ error: 'Room is required' });
    if (message && trim(message).length > 500) {
      return res.status(400).json({ error: 'Message must be 500 characters or less' });
    }

    const room = await prisma.room.findFirst({
      where: { id: roomId, status: 'vacant', tenant: null },
      include: { property: true },
    });
    if (!room) return res.status(404).json({ error: 'Room is no longer available' });

    const existing = await prisma.roomBooking.findFirst({
      where: { roomId, applicantUserId: req.user.id, status: 'pending' },
    });
    if (existing) {
      return res.status(400).json({ error: 'You already have a pending request for this room' });
    }

    const booking = await prisma.roomBooking.create({
      data: {
        roomId,
        applicantUserId: req.user.id,
        landlordId: room.property.userId,
        message: message ? trim(message) : null,
      },
      include: {
        room: { include: { property: true } },
        applicant: { select: { id: true, name: true, email: true, phone: true } },
      },
    });

    await notifyUser(
      room.property.userId,
      'booking',
      'New room booking request',
      `${req.user.name || booking.applicant.name} requested ${room.roomNumber} at ${room.property.name}`
    );

    res.status(201).json(booking);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/mine', authMiddleware, requireRole('seeker'), async (req, res) => {
  try {
    const bookings = await prisma.roomBooking.findMany({
      where: { applicantUserId: req.user.id },
      include: {
        room: { include: { property: true } },
        landlord: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.use(authMiddleware, requireRole('admin'));

router.get('/', async (req, res) => {
  try {
    const bookings = await prisma.roomBooking.findMany({
      where: { landlordId: req.user.id },
      include: {
        room: { include: { property: true } },
        applicant: { select: { id: true, name: true, email: true, phone: true, username: true } },
      },
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id/approve', async (req, res) => {
  try {
    const result = await prisma.$transaction(async (tx) => {
      const booking = await tx.roomBooking.findFirst({
        where: { id: req.params.id, landlordId: req.user.id, status: 'pending' },
        include: {
          room: { include: { property: true, tenant: true } },
          applicant: true,
        },
      });

      if (!booking) throw new Error('Booking not found or already processed');
      if (booking.room.status !== 'vacant' || booking.room.tenant) {
        throw new Error('Room is no longer available');
      }

      const applicant = booking.applicant;
      if (applicant.role === 'tenant' && applicant.tenantProfileId) {
        throw new Error('Applicant is already a tenant elsewhere');
      }

      const tenant = await tx.tenant.create({
        data: {
          name: applicant.name,
          email: applicant.email,
          phone: applicant.phone || 'N/A',
          roomId: booking.roomId,
          userId: booking.landlordId,
          leaseStart: new Date(),
        },
      });

      const updatedUser = await tx.user.update({
        where: { id: applicant.id },
        data: {
          role: 'tenant',
          landlordId: booking.landlordId,
          tenantProfileId: tenant.id,
        },
        select: userSelect,
      });

      await tx.room.update({
        where: { id: booking.roomId },
        data: { status: 'occupied' },
      });

      await tx.roomBooking.update({
        where: { id: booking.id },
        data: { status: 'approved', reviewedAt: new Date() },
      });

      await tx.roomBooking.updateMany({
        where: {
          roomId: booking.roomId,
          id: { not: booking.id },
          status: 'pending',
        },
        data: { status: 'rejected', reviewedAt: new Date() },
      });

      return { booking, tenant, updatedUser };
    });

    await notifyUser(
      result.booking.applicantUserId,
      'booking',
      'Booking approved!',
      `Your request for ${result.booking.room.roomNumber} at ${result.booking.room.property.name} was approved. You are now a tenant.`
    );

    const rejected = await prisma.roomBooking.findMany({
      where: {
        roomId: result.booking.roomId,
        status: 'rejected',
        reviewedAt: { not: null },
        applicantUserId: { not: result.booking.applicantUserId },
      },
    });
    for (const b of rejected) {
      await notifyUser(
        b.applicantUserId,
        'booking',
        'Booking not approved',
        `Another applicant was approved for ${result.booking.room.roomNumber}.`
      );
    }

    res.json({
      message: 'Booking approved. Applicant is now a tenant.',
      booking: result.booking,
      tenant: result.tenant,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id/reject', async (req, res) => {
  try {
    const booking = await prisma.roomBooking.findFirst({
      where: { id: req.params.id, landlordId: req.user.id, status: 'pending' },
      include: { room: { include: { property: true } } },
    });
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    await prisma.roomBooking.update({
      where: { id: booking.id },
      data: { status: 'rejected', reviewedAt: new Date() },
    });

    await notifyUser(
      booking.applicantUserId,
      'booking',
      'Booking declined',
      `Your request for ${booking.room.roomNumber} at ${booking.room.property.name} was declined.`
    );

    res.json({ message: 'Booking rejected' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
