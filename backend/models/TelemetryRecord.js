const mongoose = require('mongoose');

const telemetryRecordSchema = new mongoose.Schema(
  {
    machineId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    deviceId: {
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
    sampleRateHz: {
      type: Number,
      required: true,
      min: 0,
    },
    accel: {
      x: { type: [Number], default: [] },
      y: { type: [Number], default: [] },
      z: { type: [Number], default: [] },
    },
    magnitude: {
      type: [Number],
      default: [],
    },
    vibrationRms: {
      type: Number,
      default: 0,
    },
    peakAcceleration: {
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
  },
  {
    timestamps: true,
  },
);

telemetryRecordSchema.index({ machineId: 1, timestamp: -1 });

module.exports = mongoose.model('TelemetryRecord', telemetryRecordSchema);
