export function trim(value) {
  return typeof value === 'string' ? value.trim() : value;
}

export function isRequired(value) {
  return !!trim(value);
}

export function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trim(value));
}

export function isPassword(value, minLength = 6) {
  return trim(value).length >= minLength;
}

export function isPhone(value) {
  const digits = trim(value).replace(/\D/g, '');
  return digits.length >= 6;
}

export function isPositiveAmount(value) {
  const amount = parseFloat(value);
  return Number.isFinite(amount) && amount > 0;
}

export function isPositiveInt(value, min = 1) {
  const number = parseInt(value, 10);
  return Number.isFinite(number) && number >= min;
}

export function validateLatitude(value) {
  if (!trim(value)) return null;
  const latitude = parseFloat(value);
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
    return 'Latitude must be between -90 and 90';
  }
  return null;
}

export function validateLongitude(value) {
  if (!trim(value)) return null;
  const longitude = parseFloat(value);
  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    return 'Longitude must be between -180 and 180';
  }
  return null;
}

export function validateOptionalEmail(value) {
  if (!trim(value)) return null;
  return isEmail(value) ? null : 'Enter a valid email address';
}

export function validateDateRange(start, end) {
  if (!trim(start) || !trim(end)) return null;
  const startDate = new Date(start);
  const endDate = new Date(end);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return 'Enter valid lease dates (YYYY-MM-DD)';
  }
  if (endDate <= startDate) {
    return 'Lease end date must be after the start date';
  }
  return null;
}

export function validateProfile(form) {
  if (!isRequired(form.name)) return 'Name is required';
  if (!isRequired(form.email)) return 'Email is required';
  if (!isEmail(form.email)) return 'Enter a valid email address';
  return null;
}

export function validatePasswordChange(form) {
  if (!isRequired(form.currentPassword)) return 'Current password is required';
  if (!isRequired(form.newPassword)) return 'New password is required';
  if (!isPassword(form.newPassword)) return 'New password must be at least 6 characters';
  if (!isRequired(form.confirmPassword)) return 'Please confirm your new password';
  if (form.newPassword !== form.confirmPassword) return 'New passwords do not match';
  if (form.currentPassword === form.newPassword) return 'New password must be different from current password';
  return null;
}

export function validateStaffForm(form) {
  if (!isRequired(form.name)) return 'Name is required';
  if (!isRequired(form.username)) return 'Username is required';
  if (!isRequired(form.email)) return 'Email is required';
  if (!isEmail(form.email)) return 'Enter a valid email address';
  if (!isPassword(form.password)) return 'Password must be at least 6 characters';
  return null;
}
