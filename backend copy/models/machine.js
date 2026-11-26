const mongoose = require('mongoose');

const MACHINE_STATUSES = ['ONLINE', 'OFFLINE', 'WARNING', 'CRITICAL'];

const machineSchema = new mongoose.Schema(
  {
    machineId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    deviceId: {
      type: String,
      default: '',
      trim: true,
      unique: true,
      sparse: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    zone: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      default: '',
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    enabled: {
      type: Boolean,
      default: true,
      index: true,
    },
    status: {
      type: String,
      enum: MACHINE_STATUSES,
      default: 'OFFLINE',
      index: true,
    },
    connectionStatus: {
      type: String,
      enum: MACHINE_STATUSES,
      default: 'OFFLINE',
      index: true,
    },
    source: {
      type: String,
      default: 'MANUAL',
      trim: true,
      index: true,
    },
    thresholds: {
      vibrationRms: {
        warning: { type: Number, default: 4.5, min: 0 },
        critical: { type: Number, default: 7.1, min: 0 },
      },
      peakAcceleration: {
        warning: { type: Number, default: 2.0, min: 0 },
        critical: { type: Number, default: 4.0, min: 0 },
      },
      temperature: {
        warning: { type: Number, default: 70 },
        critical: { type: Number, default: 85 },
      },
      current: {
        warning: { type: Number, default: 8, min: 0 },
        critical: { type: Number, default: 10, min: 0 },
      },
      anomalyScore: {
        warning: { type: Number, default: 0.7, min: 0, max: 1 },
        critical: { type: Number, default: 0.9, min: 0, max: 1 },
      },
    },
    lastSeen: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

function validatePair(thresholds, key, options = {}) {
  const pair = thresholds?.[key] || {};
  if (options.zeroToOne) {
    if (pair.warning < 0 || pair.warning > 1 || pair.critical < 0 || pair.critical > 1) {
      throw new Error(`${key} thresholds must be between 0 and 1`);
    }
  }
  if (pair.warning < 0) {
    throw new Error(`${key} warning threshold must be >= 0`);
  }
  if (pair.critical <= pair.warning) {
    throw new Error(`${key} critical threshold must be greater than warning threshold`);
  }
}

machineSchema.pre('validate', function validateThresholds() {
  validatePair(this.thresholds, 'vibrationRms');
  validatePair(this.thresholds, 'peakAcceleration');
  validatePair(this.thresholds, 'temperature');
  validatePair(this.thresholds, 'current');
  validatePair(this.thresholds, 'anomalyScore', { zeroToOne: true });
});

module.exports = mongoose.model('Machine', machineSchema);
module.exports.MACHINE_STATUSES = MACHINE_STATUSES;
