const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { formatMoney } = require('../src/lib/currency');

const prisma = new PrismaClient();

async function main() {
  let admin = await prisma.user.findUnique({ where: { username: 'admin' } });

  if (!admin) {
    const hashed = await bcrypt.hash('admin123', 10);
    admin = await prisma.user.create({
      data: {
        username: 'admin',
        email: 'admin@rentmanager.com',
        password: hashed,
        name: 'Admin User',
        phone: '+233201234567',
        role: 'admin',
      },
    });

    const property = await prisma.property.create({
      data: {
        name: 'East Legon Apartments',
        address: '12 Boundary Road, East Legon, Accra',
        latitude: 5.6350,
        longitude: -0.1670,
        type: 'apartment',
        totalRooms: 4,
        description: 'Modern apartment complex with great amenities',
        imageUrl: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80',
          'https://images.unsplash.com/photo-1502672260266-1c1ef2cd9361?w=800&q=80',
        ]),
        userId: admin.id,
        rooms: {
          create: [
            { roomNumber: 'Unit 101', rentAmount: 1200, status: 'occupied', imageUrl: 'https://images.unsplash.com/photo-1502672260266-1c1ef2cd9361?w=800&q=80' },
            { roomNumber: 'Unit 102', rentAmount: 1100, status: 'occupied', imageUrl: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80' },
            { roomNumber: 'Unit 103', rentAmount: 1150, status: 'vacant', imageUrl: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80' },
            { roomNumber: 'Unit 104', rentAmount: 1250, status: 'vacant', imageUrl: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&q=80' },
          ],
        },
      },
      include: { rooms: true },
    });

    const property2 = await prisma.property.create({
      data: {
        name: 'Osu Residential Houses',
        address: '8 Oxford Street, Osu, Accra',
        latitude: 5.5560,
        longitude: -0.1820,
        type: 'house',
        totalRooms: 2,
        imageUrl: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80',
          'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80',
        ]),
        userId: admin.id,
        rooms: {
          create: [
            { roomNumber: 'House A', rentAmount: 1800, status: 'occupied', imageUrl: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80' },
            { roomNumber: 'House B', rentAmount: 1650, status: 'vacant', imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80' },
          ],
        },
      },
      include: { rooms: true },
    });

    const tenant1 = await prisma.tenant.create({
      data: {
        name: 'John Smith',
        email: 'john@email.com',
        phone: '+233244987654',
        leaseStart: new Date('2025-01-01'),
        leaseEnd: new Date('2026-12-31'),
        roomId: property.rooms[0].id,
        userId: admin.id,
      },
    });

    const tenant2 = await prisma.tenant.create({
      data: {
        name: 'Jane Doe',
        email: 'jane@email.com',
        phone: '+233244123456',
        leaseStart: new Date('2025-06-01'),
        leaseEnd: new Date('2026-05-31'),
        roomId: property.rooms[1].id,
        userId: admin.id,
      },
    });

    await prisma.tenant.create({
      data: {
        name: 'Bob Wilson',
        email: 'bob@email.com',
        phone: '+233244444444',
        leaseStart: new Date('2024-03-01'),
        leaseEnd: new Date('2026-02-28'),
        roomId: property2.rooms[0].id,
        userId: admin.id,
      },
    });

    await prisma.payment.createMany({
      data: [
        { tenantId: tenant1.id, amount: 1200, method: 'bank_transfer', receiptNumber: 'RCP-SEED-001' },
        { tenantId: tenant2.id, amount: 1100, method: 'cash', receiptNumber: 'RCP-SEED-002' },
      ],
    });

    const maintenanceRequest = await prisma.maintenanceRequest.create({
      data: {
        title: 'Leaky faucet',
        description: 'Kitchen faucet is dripping constantly',
        status: 'pending',
        priority: 'medium',
        propertyId: property.id,
        tenantId: tenant1.id,
        requestedBy: 'tenant',
      },
    });

    await prisma.notification.createMany({
      data: [
        {
          userId: admin.id,
          type: 'rent_due',
          title: 'Rent Due Reminder',
          message: `Jane Doe has an outstanding balance of ${formatMoney(1100)}`,
        },
        {
          userId: admin.id,
          type: 'maintenance',
          title: 'Maintenance Update',
          message: 'Leaky faucet request is pending review',
        },
      ],
    });

    console.log('Base seed data created.');
  }

  const tenantUser = await prisma.user.findUnique({ where: { username: 'john' } });
  if (!tenantUser) {
    const tenant1 = await prisma.tenant.findFirst({
      where: { name: 'John Smith', userId: admin.id },
    });
    if (tenant1) {
      await prisma.user.create({
        data: {
          username: 'john',
          email: 'john.tenant@rentmanager.com',
          password: await bcrypt.hash('tenant123', 10),
          name: 'John Smith',
          phone: '+233244987654',
          role: 'tenant',
          landlordId: admin.id,
          tenantProfileId: tenant1.id,
        },
      });
      console.log('Tenant account created: john / tenant123');
    }
  }

  const staffUser = await prisma.user.findUnique({ where: { username: 'maint' } });
  if (!staffUser) {
    const staff = await prisma.user.create({
      data: {
        username: 'maint',
        email: 'maintenance@rentmanager.com',
        password: await bcrypt.hash('maint123', 10),
        name: 'Mike Technician',
        phone: '+233244555111',
        role: 'maintenance',
        landlordId: admin.id,
      },
    });

    const pendingRequest = await prisma.maintenanceRequest.findFirst({
      where: { title: 'Leaky faucet', property: { userId: admin.id } },
    });
    if (pendingRequest) {
      await prisma.maintenanceRequest.update({
        where: { id: pendingRequest.id },
        data: { assignedToId: staff.id, status: 'in_progress' },
      });
    }
    console.log('Maintenance account created: maint / maint123');
  }

  console.log('Login credentials:');
  console.log('  Admin: admin / admin123');
  console.log('  Tenant: john / tenant123');
  console.log('  Maintenance: maint / maint123');

  const legacyPropertyPatches = [
    {
      from: 'Sunset Apartments',
      to: 'East Legon Apartments',
      address: '12 Boundary Road, East Legon, Accra',
      latitude: 5.6350,
      longitude: -0.1670,
    },
    {
      from: 'Oak Grove Houses',
      to: 'Osu Residential Houses',
      address: '8 Oxford Street, Osu, Accra',
      latitude: 5.5560,
      longitude: -0.1820,
    },
  ];
  for (const patch of legacyPropertyPatches) {
    await prisma.property.updateMany({
      where: { name: patch.from },
      data: {
        name: patch.to,
        address: patch.address,
        latitude: patch.latitude,
        longitude: patch.longitude,
      },
    });
  }

  const coordPatches = [
    { name: 'East Legon Apartments', latitude: 5.6350, longitude: -0.1670 },
    { name: 'Osu Residential Houses', latitude: 5.5560, longitude: -0.1820 },
    { name: 'Sunset Apartments', latitude: 5.6350, longitude: -0.1670 },
    { name: 'Oak Grove Houses', latitude: 5.5560, longitude: -0.1820 },
  ];
  for (const patch of coordPatches) {
    await prisma.property.updateMany({
      where: { name: patch.name, latitude: null },
      data: { latitude: patch.latitude, longitude: patch.longitude },
    });
  }

  const imagePatches = [
    {
      name: 'East Legon Apartments',
      imageUrl: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80',
      images: [
        'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80',
        'https://images.unsplash.com/photo-1502672260266-1c1ef2cd9361?w=800&q=80',
      ],
    },
    {
      name: 'Osu Residential Houses',
      imageUrl: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80',
      images: [
        'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80',
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80',
      ],
    },
  ];
  for (const patch of imagePatches) {
    await prisma.property.updateMany({
      where: { name: patch.name },
      data: { imageUrl: patch.imageUrl, images: JSON.stringify(patch.images) },
    });
  }

  const roomImages = [
    { property: 'East Legon Apartments', roomNumber: 'Unit 103', imageUrl: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80' },
    { property: 'East Legon Apartments', roomNumber: 'Unit 104', imageUrl: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&q=80' },
    { property: 'Osu Residential Houses', roomNumber: 'House B', imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80' },
    { property: 'Sunset Apartments', roomNumber: 'Unit 103', imageUrl: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80' },
    { property: 'Sunset Apartments', roomNumber: 'Unit 104', imageUrl: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&q=80' },
    { property: 'Oak Grove Houses', roomNumber: 'House B', imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80' },
  ];
  for (const patch of roomImages) {
    const prop = await prisma.property.findFirst({ where: { name: patch.property } });
    if (prop) {
      await prisma.room.updateMany({
        where: { propertyId: prop.id, roomNumber: patch.roomNumber, imageUrl: null },
        data: { imageUrl: patch.imageUrl },
      });
    }
  }

  const legacyNotifications = await prisma.notification.findMany({
    where: { message: { contains: '$' } },
  });
  for (const n of legacyNotifications) {
    await prisma.notification.update({
      where: { id: n.id },
      data: {
        message: n.message.replace(/\$(\d+(?:\.\d+)?)/g, (_, amt) => formatMoney(amt)),
      },
    });
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
