const mongoose = require('mongoose');
const SafetyEvent = require('../models/SafetyEvent');
const { emit } = require('../services/socketService');
const { persistSafetyEvent } = require('../services/safetyService');

exports.listEvents = async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 100);
    const filter = {};
    if (req.query.zone) filter.zone = req.query.zone;
    if (req.query.status) filter.status = req.query.status;

    const events = await SafetyEvent.find(filter)
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();

    return res.json({ success: true, data: events });
  } catch (error) {
    return next(error);
  }
};

exports.createEvent = async (req, res, next) => {
  try {
    const event = await persistSafetyEvent(req.body);
    return res.status(201).json({ success: true, data: event });
  } catch (error) {
    return next(error);
  }
};

exports.updateEvent = async (req, res, next) => {
  try {
    const { id } = req.params;
    let event = null;

    if (mongoose.Types.ObjectId.isValid(id)) {
      event = await SafetyEvent.findByIdAndUpdate(
        id,
        { $set: req.body },
        { returnDocument: 'after', runValidators: true }
      );
    }

    if (!event) {
      event = await SafetyEvent.findOneAndUpdate(
        { event_id: id },
        { $set: req.body },
        { returnDocument: 'after', runValidators: true }
      );
    }

    if (!event) {
      return res.status(404).json({ success: false, message: 'Safety event not found' });
    }

    emit('safety:updated', { event });
    emit('dashboard:updated');
    return res.json({ success: true, data: event });
  } catch (error) {
    return next(error);
  }
};
