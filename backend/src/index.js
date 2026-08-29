const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const propertyRoutes = require('./routes/properties');
const tenantRoutes = require('./routes/tenants');
const paymentRoutes = require('./routes/payments');
const maintenanceRoutes = require('./routes/maintenance');
const dashboardRoutes = require('./routes/dashboard');
const notificationRoutes = require('./routes/notifications');
const reportRoutes = require('./routes/reports');
const mapRoutes = require('./routes/map');
const listingsRoutes = require('./routes/listings');
const bookingsRoutes = require('./routes/bookings');
const tenantPortalRoutes = require('./routes/tenant-portal');
const staffPortalRoutes = require('./routes/staff-portal');
const staffRoutes = require('./routes/staff');
const uploadRoutes = require('./routes/uploads');
const { UPLOAD_DIR } = require('./lib/upload');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(UPLOAD_DIR));

app.get('/api/health', (_, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/tenants', tenantRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/map', mapRoutes);
app.use('/api/listings', listingsRoutes);
app.use('/api/bookings', bookingsRoutes);
app.use('/api/tenant-portal', tenantPortalRoutes);
app.use('/api/staff-portal', staffPortalRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/uploads', uploadRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Rent Management API running on http://0.0.0.0:${PORT}`);
});
