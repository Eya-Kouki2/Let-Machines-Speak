const test = require('node:test');
const assert = require('node:assert/strict');
const Machine = require('../models/machine');
const { statusFromThresholds } = require('../services/machineHealthService');

test('machine model applies default threshold values', () => {
  const machine = new Machine({ machineId: 'MCH-T1', name: 'Test Motor', zone: 'Zone 1' });

  assert.equal(machine.thresholds.vibrationRms.warning, 4.5);
  assert.equal(machine.thresholds.vibrationRms.critical, 7.1);
  assert.equal(machine.thresholds.anomalyScore.warning, 0.7);
  assert.equal(machine.thresholds.anomalyScore.critical, 0.9);
});

test('machine threshold validation rejects warning greater than critical', async () => {
  const machine = new Machine({
    machineId: 'MCH-T2',
    name: 'Invalid Motor',
    zone: 'Zone 1',
    thresholds: {
      vibrationRms: { warning: 8, critical: 7 },
    },
  });

  await assert.rejects(() => machine.validate(), /critical threshold must be greater/);
});

test('machine threshold validation rejects anomaly score outside 0-1', async () => {
  const machine = new Machine({
    machineId: 'MCH-T3',
    name: 'Invalid AI',
    zone: 'Zone 1',
    thresholds: {
      anomalyScore: { warning: 0.7, critical: 1.2 },
    },
  });

  await assert.rejects(() => machine.validate(), /between 0 and 1/);
});

test('statusFromThresholds uses per-machine critical and warning thresholds', () => {
  const thresholds = {
    vibrationRms: { warning: 4.5, critical: 7.1 },
    peakAcceleration: { warning: 2, critical: 4 },
    temperature: { warning: 70, critical: 85 },
    current: { warning: 8, critical: 10 },
    anomalyScore: { warning: 0.7, critical: 0.9 },
  };

  assert.equal(statusFromThresholds({ rms: 3, peak: 1, temperature: 50, current: 3, anomalyScore: 0.2 }, thresholds), 'ONLINE');
  assert.equal(statusFromThresholds({ rms: 5, peak: 1, temperature: 50, current: 3, anomalyScore: 0.2 }, thresholds), 'WARNING');
  assert.equal(statusFromThresholds({ rms: 3, peak: 1, temperature: 90, current: 3, anomalyScore: 0.2 }, thresholds), 'CRITICAL');
});
