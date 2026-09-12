const User = require('../models/user');

function safeUser(user) {
  return user.toSafeObject ? user.toSafeObject() : {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    active: user.active,
  };
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
    const user = await User.create(req.body);
    return res.status(201).json({ success: true, data: safeUser(user) });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ success: false, message: 'Email already exists' });
    return next(error);
  }
};

exports.updateUser = async (req, res, next) => {
  try {
    const allowed = ['name', 'email', 'role', 'active', 'firstName', 'lastName', 'workZone', 'yearsOfExperience'];
    const update = {};
    allowed.forEach((key) => {
      if (req.body[key] !== undefined) update[key] = req.body[key];
    });
    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
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
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    return res.json({ success: true, data: safeUser(user) });
  } catch (error) {
    return next(error);
  }
};
