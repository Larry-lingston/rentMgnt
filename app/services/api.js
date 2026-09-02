import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../constants/theme';

const TOKEN_KEY = 'auth_token';

class ApiService {
  constructor() {
    this.token = null;
  }

  async init() {
    this.token = await AsyncStorage.getItem(TOKEN_KEY);
  }

  async setToken(token) {
    this.token = token;
    if (token) {
      await AsyncStorage.setItem(TOKEN_KEY, token);
    } else {
      await AsyncStorage.removeItem(TOKEN_KEY);
    }
  }

  async request(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.error || `Request failed (${response.status})`);
    }

    return data;
  }

  // Auth
  login(username, password) {
    return this.request('/auth/login', { method: 'POST', body: { username, password } });
  }

  register(data) {
    return this.request('/auth/register', { method: 'POST', body: data });
  }

  forgotPassword(email) {
    return this.request('/auth/forgot-password', { method: 'POST', body: { email } });
  }

  getProfile() {
    return this.request('/auth/profile');
  }

  updateProfile(data) {
    return this.request('/auth/profile', { method: 'PUT', body: data });
  }

  changePassword(currentPassword, newPassword) {
    return this.request('/auth/change-password', {
      method: 'PUT',
      body: { currentPassword, newPassword },
    });
  }

  // Dashboard
  getDashboard() {
    return this.request('/dashboard');
  }

  // Properties
  getProperties() {
    return this.request('/properties');
  }

  getProperty(id) {
    return this.request(`/properties/${id}`);
  }

  createProperty(data) {
    return this.request('/properties', { method: 'POST', body: data });
  }

  updateProperty(id, data) {
    return this.request(`/properties/${id}`, { method: 'PUT', body: data });
  }

  deleteProperty(id) {
    return this.request(`/properties/${id}`, { method: 'DELETE' });
  }

  // Tenants
  getTenants() {
    return this.request('/tenants');
  }

  getTenant(id) {
    return this.request(`/tenants/${id}`);
  }

  createTenant(data) {
    return this.request('/tenants', { method: 'POST', body: data });
  }

  updateTenant(id, data) {
    return this.request(`/tenants/${id}`, { method: 'PUT', body: data });
  }

  deleteTenant(id) {
    return this.request(`/tenants/${id}`, { method: 'DELETE' });
  }

  // Payments
  getPayments() {
    return this.request('/payments');
  }

  getOutstanding() {
    return this.request('/payments/outstanding');
  }

  getTenantPayments(tenantId) {
    return this.request(`/payments/tenant/${tenantId}`);
  }

  recordPayment(data) {
    return this.request('/payments', { method: 'POST', body: data });
  }

  getReceipt(id) {
    return this.request(`/payments/receipt/${id}`);
  }

  // Maintenance
  getMaintenanceRequests() {
    return this.request('/maintenance');
  }

  createMaintenanceRequest(data) {
    return this.request('/maintenance', { method: 'POST', body: data });
  }

  updateMaintenanceStatus(id, status) {
    return this.request(`/maintenance/${id}/status`, { method: 'PUT', body: { status } });
  }

  // Notifications
  getNotifications() {
    return this.request('/notifications');
  }

  getUnreadNotificationCount() {
    return this.request('/notifications/unread-count');
  }

  markNotificationRead(id) {
    return this.request(`/notifications/${id}/read`, { method: 'PUT' });
  }

  generateNotifications() {
    return this.request('/notifications/generate', { method: 'POST' });
  }

  // Reports
  getMonthlyCollection(month, year) {
    const params = new URLSearchParams();
    if (month !== undefined) params.set('month', month);
    if (year !== undefined) params.set('year', year);
    const qs = params.toString();
    return this.request(`/reports/monthly-collection${qs ? `?${qs}` : ''}`);
  }

  getOutstandingReport() {
    return this.request('/reports/outstanding-balances');
  }

  getOccupancyReport() {
    return this.request('/reports/occupancy');
  }

  getTenantReport() {
    return this.request('/reports/tenants');
  }

  // Tenant portal
  getTenantDashboard() {
    return this.request('/tenant-portal/dashboard');
  }

  getTenantPayments() {
    return this.request('/tenant-portal/payments');
  }

  getTenantReceipt(id) {
    return this.request(`/tenant-portal/payments/${id}/receipt`);
  }

  payRent(amount, method = 'app_card') {
    return this.request('/tenant-portal/payments/pay', { method: 'POST', body: { amount, method } });
  }

  searchCrew(search) {
    const qs = search ? `?search=${encodeURIComponent(search)}` : '';
    return this.request(`/tenant-portal/crew${qs}`);
  }

  getTenantMaintenance() {
    return this.request('/tenant-portal/maintenance');
  }

  submitTenantMaintenance(data) {
    return this.request('/tenant-portal/maintenance', { method: 'POST', body: data });
  }

  // Staff portal
  getStaffAvailableJobs() {
    return this.request('/staff-portal/available');
  }

  claimStaffJob(id) {
    return this.request(`/staff-portal/available/${id}/claim`, { method: 'POST' });
  }

  getStaffTasks() {
    return this.request('/staff-portal/tasks');
  }

  updateStaffTaskStatus(id, status) {
    return this.request(`/staff-portal/tasks/${id}/status`, { method: 'PUT', body: { status } });
  }

  // Admin staff management
  getStaffMembers(search) {
    const qs = search ? `?search=${encodeURIComponent(search)}` : '';
    return this.request(`/staff${qs}`);
  }

  createStaffMember(data) {
    return this.request('/staff', { method: 'POST', body: data });
  }

  assignMaintenance(id, assignedToId) {
    return this.request(`/maintenance/${id}/assign`, { method: 'PUT', body: { assignedToId } });
  }

  getMapLocations() {
    return this.request('/map/locations');
  }

  getMapLocation(propertyId) {
    return this.request(`/map/locations/${propertyId}`);
  }

  getPublicMapLocation(propertyId) {
    return this.request(`/map/public/${propertyId}`);
  }

  async uploadImage(uri, mimeType, fileName) {
    const formData = new FormData();
    const name = fileName || `photo-${Date.now()}.jpg`;
    const type = mimeType || 'image/jpeg';
    formData.append('image', {
      uri,
      name,
      type,
    });

    const headers = {};
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_BASE_URL}/uploads/image`, {
      method: 'POST',
      headers,
      body: formData,
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || `Upload failed (${response.status})`);
    }
    return data;
  }

  // Public listings & bookings
  getListings() {
    return this.request('/listings');
  }

  getListing(roomId) {
    return this.request(`/listings/${roomId}`);
  }

  createBooking(roomId, message) {
    return this.request('/bookings', { method: 'POST', body: { roomId, message } });
  }

  getMyBookings() {
    return this.request('/bookings/mine');
  }

  getLandlordBookings() {
    return this.request('/bookings');
  }

  approveBooking(id) {
    return this.request(`/bookings/${id}/approve`, { method: 'PUT' });
  }

  rejectBooking(id) {
    return this.request(`/bookings/${id}/reject`, { method: 'PUT' });
  }
}

export const api = new ApiService();
