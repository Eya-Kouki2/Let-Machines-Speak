const mongoose = require('mongoose');

const platformSettingsSchema = new mongoose.Schema(
  {
    singleton: { type: Boolean, default: true, unique: true },
    machineThresholdDefaults: {
      type: Object,
      default: {
        vibrationRms: { warning: 4.5, critical: 7.1 },
        peakAcceleration: { warning: 2.0, critical: 4.0 },
        temperature: { warning: 70, critical: 85 },
        current: { warning: 8, critical: 10 },
        anomalyScore: { warning: 0.7, critical: 0.9 },
      },
    },
    registrationDefaults: {
      type: Object,
      default: {
        defaultRole: 'USER',
        adminApprovalRequired: true,
      },
    },
    notificationDefaults: {
      type: Object,
      default: {
        machineAlerts: true,
        criticalMachineAlerts: true,
        safetyAlerts: true,
        emailNotifications: true,
        inAppNotifications: true,
        dailySummary: false,
      },
    },
    applicationName: { type: String, default: 'LABES' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

platformSettingsSchema.pre('save', function setUpdatedAt(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('PlatformSettings', platformSettingsSchema);
