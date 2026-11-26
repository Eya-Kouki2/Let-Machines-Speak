const mongoose = require('mongoose');

const ALERT_SEVERITIES = ['INFO', 'SUCCESS', 'WARNING', 'CRITICAL'];
const ALERT_CATEGORIES = ['MACHINE', 'WORKER_SAFETY', 'USER', 'SYSTEM'];
const ALERT_VISIBILITY = ['ALL', 'ADMINS', 'USER'];
const ALERT_TYPES = [
  'MACHINE_ADDED',
  'MACHINE_UPDATED',
  'MACHINE_DELETED',
  'MACHINE_WARNING',
  'MACHINE_CRITICAL',
  'MACHINE_OFFLINE',
  'MACHINE_RECOVERED',
  'NO_HELMET',
  'RESTRICTED_ZONE_ENTRY',
  'SAFETY_VIOLATION',
  'ZONE_WARNING',
  'ZONE_SAFE_AGAIN',
  'USER_ADDED',
  'USER_UPDATED',
  'USER_DEACTIVATED',
  'USER_DELETED',
  'ADMIN_REQUEST',
  'ADMIN_APPROVED',
  'ADMIN_REJECTED',
  'PASSWORD_CHANGED',
  'PROFILE_UPDATED',
  'SYSTEM_INFO',
];

const alertSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      trim: true,
      enum: ALERT_TYPES,
      index: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
      enum: ALERT_CATEGORIES,
      index: true,
    },
    severity: {
      type: String,
      enum: ALERT_SEVERITIES,
      default: 'INFO',
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    sourceType: {
      type: String,
      trim: true,
      default: 'SYSTEM',
      index: true,
    },
    sourceId: {
      type: String,
      trim: true,
      default: '',
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    visibleTo: {
      type: String,
      enum: ALERT_VISIBILITY,
      default: 'ALL',
      index: true,
    },
    readBy: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: [],
    }],
    acknowledgedBy: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: [],
    }],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

alertSchema.index({ createdAt: -1 });
alertSchema.index({ category: 1, severity: 1, createdAt: -1 });
alertSchema.index({ visibleTo: 1, createdAt: -1 });

module.exports = mongoose.model('Alert', alertSchema);
module.exports.ALERT_TYPES = ALERT_TYPES;
module.exports.ALERT_CATEGORIES = ALERT_CATEGORIES;
module.exports.ALERT_SEVERITIES = ALERT_SEVERITIES;
module.exports.ALERT_VISIBILITY = ALERT_VISIBILITY;
