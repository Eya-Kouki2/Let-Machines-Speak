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
    status: {
      type: String,
      enum: MACHINE_STATUSES,
      default: 'OFFLINE',
      index: true,
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

module.exports = mongoose.model('Machine', machineSchema);
module.exports.MACHINE_STATUSES = MACHINE_STATUSES;
