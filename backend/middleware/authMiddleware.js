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
    if (user.approvalStatus === undefined || user.isApproved === undefined) {
      const seedAdminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@labes.local';
      const shouldApprove = user.role !== 'ADMIN' || user.email === seedAdminEmail;
      user.approvalStatus = shouldApprove ? 'APPROVED' : 'PENDING';
      user.isApproved = shouldApprove;
      user.approvedAt = shouldApprove ? (user.approvedAt || new Date()) : null;
      await user.save();
    }
    req.user = user;
    return next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
}

function isApprovedUser(user) {
  return user?.active && user?.isApproved === true && user?.approvalStatus === 'APPROVED';
}

function requireApproved(req, res, next) {
  if (!isApprovedUser(req.user)) {
    return res.status(403).json({ success: false, message: 'Account approval is required' });
  }
  return next();
}

function requireAdmin(req, res, next) {
  if (req.user?.role !== 'ADMIN' || !isApprovedUser(req.user)) {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }
  return next();
}

module.exports = { getJwtSecret, isApprovedUser, requireAdmin, requireApproved, requireAuth };
