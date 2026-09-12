const mongoose = require('mongoose');

const ALERT_SEVERITIES = ['INFO', 'WARNING', 'CRITICAL'];
const ALERT_SOURCES = ['MACHINE_HEALTH', 'WORKER_SAFETY', 'SYSTEM'];

const alertSchema = new mongoose.Schema(
  {
    source: {
      type: String,
      required: true,
      trim: true,
      enum: ALERT_SOURCES,
      index: true,
    },
    machineId: {
      type: String,
      trim: true,
      index: true,
    },
    zone: {
      type: String,
      trim: true,
      index: true,
    },
    severity: {
      type: String,
      enum: ALERT_SEVERITIES,
      default: 'INFO',
      index: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
    acknowledged: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Alert', alertSchema);
module.exports.ALERT_SEVERITIES = ALERT_SEVERITIES;
module.exports.ALERT_SOURCES = ALERT_SOURCES;
