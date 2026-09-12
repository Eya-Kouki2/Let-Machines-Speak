const fs = require('fs');
const path = require('path');
const User = require('../models/user');

function safeUser(user) {
  return user.toSafeObject ? user.toSafeObject() : {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    active: user.active,
    firstName: user.firstName,
    lastName: user.lastName,
    age: user.age,
    workZone: user.workZone,
    profileImage: user.profileImage,
  };
}

function normalizeProfileName(firstName, lastName, fallbackName = '') {
  const combined = [firstName, lastName].filter(Boolean).join(' ').trim();
  return combined || fallbackName;
}

function removeUploadedAvatar(filePath) {
  if (!filePath || typeof filePath !== 'string') return;
  if (!filePath.startsWith('/uploads/profiles/')) return;

  const safePath = path.join(__dirname, '..', 'uploads', 'profiles', path.basename(filePath));
  if (fs.existsSync(safePath)) {
    fs.unlinkSync(safePath);
  }
}

async function countApprovedAdmins(excludeId = null) {
  const filters = { role: 'ADMIN', active: true, isApproved: true, approvalStatus: 'APPROVED' };
  if (excludeId) filters._id = { $ne: excludeId };
  return User.countDocuments(filters);
}

exports.listUsers = async (req, res, next) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    return res.json({ success: true, data: users.map(safeUser) });
  } catch (error) {
    return next(error);
  }
};

exports.getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    return res.json({ success: true, data: safeUser(user) });
  } catch (error) {
    return next(error);
  }
};

exports.createUser = async (req, res, next) => {
  try {
    const role = req.body.role === 'ADMIN' ? 'ADMIN' : 'USER';
    const approval = role === 'ADMIN'
      ? { isApproved: false, approvalStatus: 'PENDING', approvedAt: null }
      : { isApproved: true, approvalStatus: 'APPROVED', approvedAt: new Date(), approvedBy: req.user._id };
    const user = await User.create({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      role,
      active: req.body.active !== false,
      age: req.body.age,
      yearsOfExperience: req.body.yearsOfExperience,
      workZone: req.body.workZone,
      ...approval,
    });
    return res.status(201).json({ success: true, data: safeUser(user) });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ success: false, message: 'Email already exists' });
    return next(error);
  }
};

exports.getCurrentUser = async (req, res) => {
  return res.json({ success: true, data: safeUser(req.user) });
};

exports.updateCurrentUser = async (req, res, next) => {
  try {
    const allowed = ['firstName', 'lastName', 'age', 'workZone'];
    const update = {};

    allowed.forEach((key) => {
      if (req.body[key] !== undefined) update[key] = req.body[key];
    });

    if (Object.keys(update).length === 0) {
      return res.status(400).json({ success: false, message: 'No valid profile fields provided.' });
    }

    if (update.age !== undefined && (Number.isNaN(Number(update.age)) || Number(update.age) < 0 || Number(update.age) > 120)) {
      return res.status(400).json({ success: false, message: 'Age must be a number between 0 and 120.' });
    }
    if (update.age !== undefined) update.age = Number(update.age);
    if (update.firstName !== undefined) update.firstName = String(update.firstName).trim();
    if (update.lastName !== undefined) update.lastName = String(update.lastName).trim();
    if (update.workZone !== undefined) update.workZone = String(update.workZone).trim();

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    Object.assign(user, update);
    user.name = normalizeProfileName(user.firstName, user.lastName, user.name || user.email);
    await user.save();

    return res.json({ success: true, data: safeUser(user) });
  } catch (error) {
    return next(error);
  }
};

exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body || {};

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current password and new password are required.' });
    }

    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const matchesCurrent = await user.comparePassword(currentPassword);
    if (!matchesCurrent) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
    }

    const passwordValidation = require('../utils/passwordValidation').validatePassword(newPassword);
    if (!passwordValidation.valid) {
      return res.status(400).json({ success: false, message: passwordValidation.message });
    }

    user.password = newPassword;
    user.mustChangePassword = false;
    user.passwordChangedAt = new Date();
    user.temporaryPasswordIssuedAt = null;
    await user.save();

    return res.json({
      success: true,
      message: 'Password updated successfully.',
      user: safeUser(user),
    });
  } catch (error) {
    return next(error);
  }
};

exports.uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file was uploaded.' });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const previousImage = user.profileImage;
    const newProfileImage = `/uploads/profiles/${req.file.filename}`;

    user.profileImage = newProfileImage;
    await user.save();

    if (previousImage && previousImage.startsWith('/uploads/profiles/')) {
      try {
        removeUploadedAvatar(previousImage);
      } catch (error) {
        // Ignore failed cleanup, but preserve user record.
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        profileImage: newProfileImage,
        user: safeUser(user),
      },
    });
  } catch (error) {
    return next(error);
  }
};

exports.updateUser = async (req, res, next) => {
  try {
    const existingUser = await User.findById(req.params.id);
    if (!existingUser) return res.status(404).json({ success: false, message: 'User not found' });
    if (req.user._id.toString() === req.params.id && req.body.active === false) {
      return res.status(400).json({ success: false, message: 'You cannot deactivate your own admin account' });
    }
    if (
      existingUser.role === 'ADMIN' &&
      existingUser.active &&
      existingUser.isApproved &&
      existingUser.approvalStatus === 'APPROVED' &&
      (req.body.active === false || req.body.role === 'USER') &&
      (await countApprovedAdmins(existingUser._id)) === 0
    ) {
      return res.status(400).json({ success: false, message: 'At least one approved admin must remain active' });
    }
    const allowed = ['name', 'email', 'active', 'firstName', 'lastName', 'workZone', 'yearsOfExperience'];
    const update = {};
    allowed.forEach((key) => {
      if (req.body[key] !== undefined) update[key] = req.body[key];
    });
    if (req.body.role !== undefined) {
      update.role = req.body.role === 'ADMIN' ? 'ADMIN' : 'USER';
      if (update.role === 'ADMIN') {
        update.isApproved = false;
        update.approvalStatus = 'PENDING';
        update.approvedBy = null;
        update.approvedAt = null;
      } else {
        update.isApproved = true;
        update.approvalStatus = 'APPROVED';
        update.approvedBy = req.user._id;
        update.approvedAt = new Date();
      }
    }
    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    return res.json({ success: true, data: safeUser(user) });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ success: false, message: 'Email already exists' });
    return next(error);
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    if (req.user._id.toString() === req.params.id) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own admin account' });
    }
    const existingUser = await User.findById(req.params.id);
    if (!existingUser) return res.status(404).json({ success: false, message: 'User not found' });
    if (
      existingUser.role === 'ADMIN' &&
      existingUser.active &&
      existingUser.isApproved &&
      existingUser.approvalStatus === 'APPROVED' &&
      (await countApprovedAdmins(existingUser._id)) === 0
    ) {
      return res.status(400).json({ success: false, message: 'At least one approved admin must remain active' });
    }
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    return res.json({ success: true, data: safeUser(user) });
  } catch (error) {
    return next(error);
  }
};
