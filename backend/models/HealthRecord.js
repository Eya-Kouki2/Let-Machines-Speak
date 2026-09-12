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
    deviceId: {
      type: String,
      default: '',
      trim: true,
      index: true,
    },
    timestamp: {
      type: Date,
      required: true,
      index: true,
    },
    sampleRateHz: {
      type: Number,
      default: 0,
      min: 0,
    },
    temperature: {
      type: Number,
      default: null,
    },
    current: {
      type: Number,
      default: null,
    },
    vibrationRms: {
      type: Number,
      default: 0,
    },
    peakAcceleration: {
      type: Number,
      default: 0,
    },
    rms: {
      type: Number,
      default: 0,
    },
    peak: {
      type: Number,
      default: 0,
    },
    fftBands: {
      type: [Number],
      default: [],
    },
    fftSpectrum: {
      type: [{ frequency: Number, amplitude: Number }],
      default: [],
    },
    accel: {
      x: { type: [Number], default: [] },
      y: { type: [Number], default: [] },
      z: { type: [Number], default: [] },
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
    anomalyScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 1,
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
