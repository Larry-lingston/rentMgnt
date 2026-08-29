const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'rent-management-secret-key';

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const token = header.split(' ')[1];
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user?.role || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    next();
  };
}

function signToken(user) {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      role: user.role,
      landlordId: user.landlordId,
      tenantProfileId: user.tenantProfileId,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

const userSelect = {
  id: true,
  username: true,
  email: true,
  name: true,
  phone: true,
  role: true,
  landlordId: true,
  tenantProfileId: true,
  createdAt: true,
};

module.exports = { authMiddleware, requireRole, signToken, userSelect, JWT_SECRET };
