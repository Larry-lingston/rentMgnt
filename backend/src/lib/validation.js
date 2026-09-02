const PROPERTY_TYPES = ['apartment', 'house', 'commercial'];
const PAYMENT_METHODS = ['cash', 'bank_transfer', 'check', 'mobile_money', 'app_card'];
const PRIORITIES = ['low', 'medium', 'high'];
const ACCOUNT_TYPES = ['landlord', 'renter', 'seeker', 'tenant', 'maintenance'];

function trim(value) {
  return typeof value === 'string' ? value.trim() : value;
}

function isRequired(value) {
  return !!trim(value);
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trim(value));
}

function isPassword(value, minLength = 6) {
  return trim(value).length >= minLength;
}

function isPhone(value) {
  const digits = trim(value).replace(/\D/g, '');
  return digits.length >= 6;
}

function parsePositiveAmount(value) {
  const amount = parseFloat(value);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return amount;
}

function parsePositiveInt(value, min = 1) {
  const number = parseInt(value, 10);
  if (!Number.isFinite(number) || number < min) return null;
  return number;
}

function parseOptionalCoord(value, min, max) {
  if (value == null || trim(value) === '') return null;
  const number = parseFloat(value);
  if (!Number.isFinite(number) || number < min || number > max) return undefined;
  return number;
}

function isOneOf(value, allowed) {
  return allowed.includes(value);
}

function validateOptionalEmail(value) {
  if (!trim(value)) return null;
  return isEmail(value) ? null : 'Enter a valid email address';
}

function validateDateRange(start, end) {
  if (!start || !end) return null;
  const startDate = new Date(start);
  const endDate = new Date(end);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return 'Enter valid lease dates';
  }
  if (endDate <= startDate) {
    return 'Lease end date must be after the start date';
  }
  return null;
}

module.exports = {
  PROPERTY_TYPES,
  PAYMENT_METHODS,
  PRIORITIES,
  ACCOUNT_TYPES,
  trim,
  isRequired,
  isEmail,
  isPassword,
  isPhone,
  parsePositiveAmount,
  parsePositiveInt,
  parseOptionalCoord,
  isOneOf,
  validateOptionalEmail,
  validateDateRange,
};
