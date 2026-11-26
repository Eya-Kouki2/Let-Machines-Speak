const mongoose = require('mongoose');

const SAFETY_EVENT_STATUSES = ['open', 'acknowledged', 'resolved'];
const SAFETY_EVENT_TYPES = [
  'no_helmet',
  'restricted_zone_entry',
  'fall_detected',
  'unsafe_distance',
  'ppe_violation',
  'helmet_ok',
];

const safetyEventSchema = new mongoose.Schema(
  {
    event_id: {
      type: String,
      trim: true,
      index: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    node_id: {
      type: String,
      trim: true,
      default: 'safety-cv-node',
      index: true,
    },
    zone: {
      type: String,
      required: true,
      trim: true,
      default: 'Zone 1',
      index: true,
    },
    event: {
      type: String,
      required: true,
      trim: true,
      enum: SAFETY_EVENT_TYPES,
      index: true,
    },
    person_track_id: {
      type: Number,
      default: 1,
    },
    confidence: {
      type: Number,
      required: true,
      min: 0,
      max: 1,
      default: 1,
    },
    status: {
      type: String,
      enum: SAFETY_EVENT_STATUSES,
      default: 'open',
      index: true,
    },
    violations: {
      type: [String],
      default: [],
    },
    snapshot_url: {
      type: String,
      trim: true,
      default: '',
    },
    image_path: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('SafetyEvent', safetyEventSchema);
module.exports.SAFETY_EVENT_STATUSES = SAFETY_EVENT_STATUSES;
module.exports.SAFETY_EVENT_TYPES = SAFETY_EVENT_TYPES;
