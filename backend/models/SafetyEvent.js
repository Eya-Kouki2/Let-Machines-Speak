const mongoose = require('mongoose');

const SAFETY_EVENT_STATUSES = ['open', 'acknowledged', 'resolved'];
const SAFETY_EVENT_TYPES = ['no_helmet', 'restricted_zone_entry', 'fall_detected', 'unsafe_distance'];

const safetyEventSchema = new mongoose.Schema(
  {
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    zone: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    event: {
      type: String,
      required: true,
      trim: true,
      enum: SAFETY_EVENT_TYPES,
      index: true,
    },
    confidence: {
      type: Number,
      required: true,
      min: 0,
      max: 1,
    },
    status: {
      type: String,
      enum: SAFETY_EVENT_STATUSES,
      default: 'open',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('SafetyEvent', safetyEventSchema);
module.exports.SAFETY_EVENT_STATUSES = SAFETY_EVENT_STATUSES;
module.exports.SAFETY_EVENT_TYPES = SAFETY_EVENT_TYPES;
