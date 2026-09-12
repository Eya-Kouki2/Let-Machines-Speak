const jwt = require('jsonwebtoken');
const User = require('../models/user');
const { getJwtSecret } = require('../middleware/authMiddleware');
const { validatePassword, generateTemporaryPassword } = require('../utils/passwordValidation');
const { sendPasswordResetEmail } = require('../utils/emailService');

function normalizeRole(role) {
  if (role === 'ADMIN_REQUEST' || role === 'Admin' || role === 'ADMIN') return 'ADMIN';
  return 'USER';
}

function approvalForRole(role) {
  if (role === 'ADMIN') {
    return { isApproved: false, approvalStatus: 'PENDING', approvedAt: null };
  }
  return { isApproved: true, approvalStatus: 'APPROVED', approvedAt: new Date() };
}

function signToken(user) {
  return jwt.sign(
    { userId: user._id.toString(), role: user.role, isApproved: user.isApproved },
    getJwtSecret(),
    { subject: user._id.toString(), expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
  );
}

exports.signUp = async (req, res, next) => {
  try {
    const role = normalizeRole(req.body.accountType || req.body.role);
    const approval = approvalForRole(role);
    const user = await User.create({
      name: req.body.name || [req.body.firstName, req.body.lastName].filter(Boolean).join(' '),
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      password: req.body.password,
      role,
      ...approval,
      age: req.body.age,
      yearsOfExperience: req.body.yearsOfExperience,
      workZone: req.body.workZone,
    });
    const safeUser = user.toSafeObject();
    if (role === 'ADMIN') {
      return res.status(201).json({
        success: true,
        message: 'Your admin request is pending approval by an existing administrator.',
        data: { user: safeUser },
        user: safeUser,
      });
    }
    const token = signToken(user);
    return res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      data: { token, user: safeUser },
      token,
      user: safeUser,
    });
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
    if (!user.isApproved || user.approvalStatus !== 'APPROVED') {
      return res.status(403).json({
        success: false,
        message: user.approvalStatus === 'REJECTED'
          ? 'Your administrator request was rejected.'
          : 'Your administrator request is pending approval.',
        data: { user: user.toSafeObject() },
      });
    }
    user.lastLoginAt = new Date();
    await user.save();

    const token = signToken(user);
    const safeUser = user.toSafeObject();
    return res.status(200).json({ success: true, data: { token, user: safeUser }, token, user: safeUser });
  } catch (error) {
    return next(error);
  }
};

exports.forgotPassword = async (req, res, next) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ success: false, message: 'A valid email is required.' });
    }

    const user = await User.findOne({ email });
    if (user) {
      const temporaryPassword = generateTemporaryPassword();
      const validation = validatePassword(temporaryPassword);
      if (!validation.valid) {
        return res.status(500).json({ success: false, message: 'Unable to generate a secure temporary password.' });
      }

      try {
        user.password = temporaryPassword;
        user.mustChangePassword = true;
        user.temporaryPasswordIssuedAt = new Date();
        user.passwordChangedAt = null;
        await user.save();

        try {
          await sendPasswordResetEmail(user, temporaryPassword);
        } catch (emailError) {
          user.password = undefined;
          await user.save();
          throw new Error('Temporary password email could not be sent.');
        }
      } catch (error) {
        return res.status(500).json({ success: false, message: 'Unable to process password reset right now.' });
      }
    }

    return res.status(200).json({
      success: true,
      message: 'If an account exists for this email, password instructions have been sent.',
    });
  } catch (error) {
    return next(error);
  }
};

exports.me = async (req, res) => {
  return res.json({ success: true, data: req.user.toSafeObject() });
};
