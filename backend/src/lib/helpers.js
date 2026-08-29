const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const MAINTENANCE_STATUSES = ['pending', 'cancelled', 'completed'];

async function notifyMaintenanceParties({ landlordId, tenantUserId, staffUserId, title, message }) {
  const notifications = [];
  if (landlordId) notifications.push({ userId: landlordId, type: 'maintenance', title, message });
  if (tenantUserId) notifications.push({ userId: tenantUserId, type: 'maintenance', title, message });
  if (staffUserId) notifications.push({ userId: staffUserId, type: 'maintenance', title, message });
  if (notifications.length > 0) {
    await prisma.notification.createMany({ data: notifications });
  }
}

async function notifyAllLandlordCrew(landlordId, title, message) {
  const crew = await prisma.user.findMany({
    where: { role: 'maintenance', landlordId },
    select: { id: true },
  });
  if (crew.length > 0) {
    await prisma.notification.createMany({
      data: crew.map((c) => ({ userId: c.id, type: 'maintenance', title, message })),
    });
  }
}

async function validateLandlordStaff(landlordId, staffId) {
  return prisma.user.findFirst({
    where: { id: staffId, role: 'maintenance', landlordId },
  });
}

function generateReceiptNumber() {
  return `RCP-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
}

function generateTransactionRef() {
  return `TXN-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
}

module.exports = {
  prisma,
  MAINTENANCE_STATUSES,
  notifyMaintenanceParties,
  notifyAllLandlordCrew,
  validateLandlordStaff,
  generateReceiptNumber,
  generateTransactionRef,
};
