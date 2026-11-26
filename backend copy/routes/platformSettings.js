const express = require('express');
const PlatformSettings = require('../models/PlatformSettings');
const { requireAuth, requireAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

async function getOrCreateSettings() {
  const settings = await PlatformSettings.findOne({ singleton: true });
  if (settings) return settings;

  return PlatformSettings.create({ singleton: true });
}

router.get('/platform', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const settings = await getOrCreateSettings();
    return res.json({ success: true, data: settings });
  } catch (error) {
    return next(error);
  }
});

router.patch('/platform', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const settings = await getOrCreateSettings();
    const allowed = ['machineThresholdDefaults', 'registrationDefaults', 'notificationDefaults', 'applicationName'];
    const update = {};

    for (const key of allowed) {
      if (req.body[key] !== undefined) update[key] = req.body[key];
    }

    if (Object.keys(update).length === 0) {
      return res.status(400).json({ success: false, message: 'No valid platform settings provided.' });
    }

    Object.assign(settings, update, { updatedBy: req.user._id, updatedAt: new Date() });
    await settings.save();

    return res.json({ success: true, message: 'Platform settings updated.', data: settings });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
