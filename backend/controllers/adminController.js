const User = require('../models/user');

function safeUser(user) {
  return user.toSafeObject();
}

exports.listPendingAdmins = async (req, res, next) => {
  try {
    const users = await User.find({ role: 'ADMIN', approvalStatus: 'PENDING' }).sort({ createdAt: -1 });
    return res.json({ success: true, data: users.map(safeUser) });
  } catch (error) {
    return next(error);
  }
};

exports.approveAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.role !== 'ADMIN') return res.status(400).json({ success: false, message: 'Only admin requests can be approved' });
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Admin requests must be approved by another approved admin' });
    }

    user.isApproved = true;
    user.approvalStatus = 'APPROVED';
    user.approvedBy = req.user._id;
    user.approvedAt = new Date();
    await user.save();

    return res.json({ success: true, data: safeUser(user) });
  } catch (error) {
    return next(error);
  }
};

exports.rejectAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.role !== 'ADMIN') return res.status(400).json({ success: false, message: 'Only admin requests can be rejected' });

    user.isApproved = false;
    user.approvalStatus = 'REJECTED';
    user.approvedBy = req.user._id;
    user.approvedAt = new Date();
    await user.save();

    return res.json({ success: true, data: safeUser(user) });
  } catch (error) {
    return next(error);
  }
};
