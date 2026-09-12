const jwt = require('jsonwebtoken');
const User = require('../models/user');
const { getJwtSecret } = require('../middleware/authMiddleware');

function normalizeRole(role) {
  if (role === 'Admin') return 'ADMIN';
  if (role === 'Ouvrier') return 'OPERATOR';
  return role || 'VIEWER';
}

function signToken(user) {
  return jwt.sign(
    { role: user.role, email: user.email },
    getJwtSecret(),
    { subject: user._id.toString(), expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

exports.signUp = async (req, res, next) => {
  try {
    const user = await User.create({
      name: req.body.name || [req.body.firstName, req.body.lastName].filter(Boolean).join(' '),
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      password: req.body.password,
      role: normalizeRole(req.body.role),
      age: req.body.age,
      yearsOfExperience: req.body.yearsOfExperience,
      workZone: req.body.workZone,
    });
    const token = signToken(user);
    const safeUser = user.toSafeObject();
    return res.status(201).json({ success: true, data: { token, user: safeUser }, token, user: safeUser });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'Email is already used' });
    }
    return next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: String(req.body.email || '').toLowerCase() }).select('+password');
    if (!user || !(await user.comparePassword(req.body.password || ''))) {
      return res.status(401).json({ success: false, message: 'Email or password is incorrect' });
    }
    if (!user.active) {
      return res.status(403).json({ success: false, message: 'User account is disabled' });
    }
    const token = signToken(user);
    const safeUser = user.toSafeObject();
    return res.status(200).json({ success: true, data: { token, user: safeUser }, token, user: safeUser });
  } catch (error) {
    return next(error);
  }
};

exports.me = async (req, res) => {
  return res.json({ success: true, data: req.user.toSafeObject() });
};
