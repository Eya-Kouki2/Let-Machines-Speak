const jwt = require('jsonwebtoken');
const User = require('../models/user');

function getJwtSecret() {
  return process.env.JWT_SECRET || 'development-only-change-me';
}

async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    const payload = jwt.verify(token, getJwtSecret());
    const user = await User.findById(payload.sub);
    if (!user || !user.active) {
      return res.status(401).json({ success: false, message: 'User is not active or no longer exists' });
    }
    req.user = user;
    return next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
}

function requireAdmin(req, res, next) {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }
  return next();
}

module.exports = { getJwtSecret, requireAdmin, requireAuth };
