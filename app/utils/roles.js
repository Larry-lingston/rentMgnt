export const ACCOUNT_TYPES = [
  {
    id: 'landlord',
    label: 'Landlord',
    description: 'Manage properties, tenants & payments',
    icon: '🏢',
  },
  {
    id: 'renter',
    label: 'Looking for a room',
    description: 'Browse listings and book a room',
    icon: '🔍',
  },
  {
    id: 'tenant',
    label: 'Tenant',
    description: 'Already renting — join your landlord',
    icon: '🏠',
  },
  {
    id: 'maintenance',
    label: 'Maintenance crew',
    description: 'Work for a landlord on repairs',
    icon: '🔧',
  },
];

export function getHomeRoute(role) {
  switch (role) {
    case 'tenant':
      return '/(tenant-tabs)';
    case 'maintenance':
      return '/(staff-tabs)';
    case 'seeker':
      return '/(seeker-tabs)';
    default:
      return '/(tabs)';
  }
}

export const ROLES = {
  ADMIN: 'admin',
  TENANT: 'tenant',
  MAINTENANCE: 'maintenance',
  SEEKER: 'seeker',
};

export function accountTypeNeedsLandlord(accountType) {
  return accountType === 'tenant' || accountType === 'maintenance';
}
