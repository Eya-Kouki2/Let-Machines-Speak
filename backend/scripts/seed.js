const dotenv = require('dotenv');
const mongoose = require('mongoose');
const path = require('path');
const { connectDatabase } = require('../config/database');
const User = require('../models/user');
const Machine = require('../models/machine');
const HealthRecord = require('../models/HealthRecord');
const SafetyEvent = require('../models/SafetyEvent');
const Alert = require('../models/alert');

dotenv.config({ path: path.join(__dirname, '../.env') });

const defaultThresholds = {
  vibrationRms: { warning: 4.5, critical: 7.1 },
  peakAcceleration: { warning: 2.0, critical: 4.0 },
  temperature: { warning: 70, critical: 85 },
  current: { warning: 8, critical: 10 },
  anomalyScore: { warning: 0.7, critical: 0.9 },
};

const machines = [
  {
    machineId: 'MCH-001',
    deviceId: 'node01',
    name: 'Industrial Motor 01',
    type: 'Electric Motor',
    zone: 'Zone 1',
    description: 'Main production motor',
    enabled: true,
    status: 'ONLINE',
    thresholds: defaultThresholds,
    lastSeen: new Date(),
  },
  {
    machineId: 'MCH-002',
    name: 'Conveyor Motor 02',
    type: 'Conveyor Motor',
    zone: 'Zone 2',
    description: 'Packaging line conveyor drive',
    enabled: true,
    status: 'WARNING',
    thresholds: {
      vibrationRms: { warning: 4.0, critical: 6.5 },
      peakAcceleration: { warning: 1.8, critical: 3.6 },
      temperature: { warning: 68, critical: 82 },
      current: { warning: 7.5, critical: 9.5 },
      anomalyScore: { warning: 0.65, critical: 0.88 },
    },
    lastSeen: new Date(),
  },
  {
    machineId: 'MCH-003',
    name: 'Hydraulic Pump 03',
    type: 'Hydraulic Pump',
    zone: 'Zone 3',
    description: 'Hydraulic pressure system pump',
    enabled: true,
    status: 'OFFLINE',
    thresholds: {
      vibrationRms: { warning: 5.0, critical: 7.8 },
      peakAcceleration: { warning: 2.2, critical: 4.4 },
      temperature: { warning: 72, critical: 88 },
      current: { warning: 8.5, critical: 10.5 },
      anomalyScore: { warning: 0.72, critical: 0.92 },
    },
    lastSeen: new Date(Date.now() - 1000 * 60 * 30),
  },
];

async function seed() {
  await connectDatabase();

  const adminName = process.env.SEED_ADMIN_NAME || 'LABES Admin';
  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@labes.local';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'Admin123!';

  const existingAdmin = await User.findOne({ email: adminEmail }).select('+password');
  if (existingAdmin) {
    existingAdmin.name = adminName;
    existingAdmin.role = 'ADMIN';
    existingAdmin.active = true;
    existingAdmin.isApproved = true;
    existingAdmin.approvalStatus = 'APPROVED';
    existingAdmin.approvedAt = existingAdmin.approvedAt || new Date();
    await existingAdmin.save();
    console.log(`Admin already exists: ${adminEmail}`);
  } else {
    await User.create({
      name: adminName,
      email: adminEmail,
      password: adminPassword,
      role: 'ADMIN',
      active: true,
      isApproved: true,
      approvalStatus: 'APPROVED',
      approvedAt: new Date(),
    });
    console.log(`Admin created: ${adminEmail}`);
  }

  for (const machine of machines) {
    const result = await Machine.updateOne(
      { machineId: machine.machineId },
      { $set: machine },
      { upsert: true, runValidators: true }
    );
    console.log(`${result.upsertedCount ? 'Machine created' : 'Machine updated'}: ${machine.machineId}`);
  }

  const healthRecordCount = await HealthRecord.countDocuments({ machineId: 'MCH-001' });
  if (healthRecordCount === 0) {
    await HealthRecord.create({
      machineId: 'MCH-001',
      timestamp: new Date(),
      temperature: 64,
      current: 6.7,
      rms: 3.1,
      peak: 1.4,
      fftBands: [0.12, 0.22, 0.38, 0.31, 0.18, 0.11, 0.08, 0.04],
      healthScore: 92,
      status: 'green',
    });
    console.log('Health record created: MCH-001');
  } else {
    console.log('Health record already exists: MCH-001');
  }

  const safetyEventCount = await SafetyEvent.countDocuments();
  if (safetyEventCount === 0) {
    await SafetyEvent.create({
      timestamp: new Date(),
      zone: 'Zone 2',
      event: 'no_helmet',
      confidence: 0.94,
      status: 'open',
    });
    console.log('Safety event created');
  } else {
    console.log('Safety event already exists');
  }

  const alertCount = await Alert.countDocuments();
  if (alertCount === 0) {
    await Alert.create({
      source: 'MACHINE_HEALTH',
      machineId: 'MCH-002',
      zone: 'Zone 2',
      severity: 'WARNING',
      message: 'Conveyor Motor 02 vibration is above warning threshold.',
      active: true,
      acknowledged: false,
    });
    console.log('Alert created');
  } else {
    console.log('Alert already exists');
  }

  console.log('Seed complete');
}

seed()
  .catch((error) => {
    console.error('Seed failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
