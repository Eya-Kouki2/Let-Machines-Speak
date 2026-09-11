const mongoose = require('mongoose');

const HEALTH_STATUSES = ['green', 'yellow', 'red'];

const healthRecordSchema = new mongoose.Schema(
  {
    machineId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    timestamp: {
      type: Date,
      required: true,
      index: true,
    },
    temperature: {
      type: Number,
      required: true,
    },
    current: {
      type: Number,
      required: true,
    },
    rms: {
      type: Number,
      required: true,
    },
    peak: {
      type: Number,
      required: true,
    },
    fftBands: {
      type: [Number],
      default: [],
    },
    vibrationPreview: {
      type: [Number],
      default: [],
    },
    healthScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    status: {
      type: String,
      enum: HEALTH_STATUSES,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

healthRecordSchema.index({ machineId: 1, timestamp: -1 });

module.exports = mongoose.model('HealthRecord', healthRecordSchema);
module.exports.HEALTH_STATUSES = HEALTH_STATUSES;
