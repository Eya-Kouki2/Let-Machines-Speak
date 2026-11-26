const express = require('express');
const Alert = require('../models/alert');
const { requireAuth, requireApproved } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(requireAuth, requireApproved);

function buildVisibilityFilter(user) {
  const isAdmin = user.role === 'ADMIN' && user.isApproved && user.approvalStatus === 'APPROVED';
  if (isAdmin) {
    return {
      $or: [
        { visibleTo: 'ALL' },
        { visibleTo: 'ADMINS' },
        { userId: user._id },
      ],
    };
  }

  return {
    $or: [
      { visibleTo: 'ALL' },
      { userId: user._id },
    ],
  };
}

router.get('/', async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(Math.max(1, Number(req.query.limit) || 20), 100);
    const filter = buildVisibilityFilter(req.user);

    if (req.query.category) filter.category = req.query.category;
    if (req.query.severity) filter.severity = req.query.severity;
    if (req.query.read === 'unread') filter.readBy = { $ne: req.user._id };
    if (req.query.read === 'read') filter.readBy = req.user._id;
    if (req.query.dateRange) {
      const now = new Date();
      const ranges = {
        today: 24 * 60 * 60 * 1000,
        '7d': 7 * 24 * 60 * 60 * 1000,
        '30d': 30 * 24 * 60 * 60 * 1000,
      };
      const span = ranges[String(req.query.dateRange).toLowerCase()];
      if (span) {
        filter.createdAt = { $gte: new Date(now.getTime() - span) };
      }
    }

    const [items, total] = await Promise.all([
      Alert.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Alert.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      data: {
        items,
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return next(error);
  }
});

router.get('/unread-count', async (req, res, next) => {
  try {
    const filter = buildVisibilityFilter(req.user);
    filter.readBy = { $ne: req.user._id };
    const count = await Alert.countDocuments(filter);
    return res.json({ success: true, data: { count } });
  } catch (error) {
    return next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const alert = await Alert.findOne({ _id: req.params.id, ...buildVisibilityFilter(req.user) }).lean();
    if (!alert) {
      return res.status(404).json({ success: false, message: 'Alert not found' });
    }
    return res.json({ success: true, data: alert });
  } catch (error) {
    return next(error);
  }
});

router.patch('/:id/read', async (req, res, next) => {
  try {
    const alert = await Alert.findOne({ _id: req.params.id, ...buildVisibilityFilter(req.user) });
    if (!alert) {
      return res.status(404).json({ success: false, message: 'Alert not found' });
    }

    if (!alert.readBy.some((id) => id.toString() === req.user._id.toString())) {
      alert.readBy.push(req.user._id);
      await alert.save();
      return res.json({ success: true, data: alert });
    }

    return res.json({ success: true, data: alert });
  } catch (error) {
    return next(error);
  }
});

router.patch('/read-all', async (req, res, next) => {
  try {
    const filter = buildVisibilityFilter(req.user);
    await Alert.updateMany(filter, {
      $addToSet: { readBy: req.user._id },
    });

    return res.json({ success: true, message: 'All visible alerts marked as read.' });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
