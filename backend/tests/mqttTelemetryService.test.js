const { before, after, test } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');

const Machine = require('../models/machine');
const TelemetryRecord = require('../models/TelemetryRecord');
const { validateTelemetryPayload, validateSafetyAlertPayload, processTelemetryPayload, computeCentredMagnitude, computeRms, computePeakAcceleration, computeSpectrumBins } = require('../services/mqttService');

before(async () => {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/let-machines-speak');
});

after(async () => {
  await mongoose.disconnect();
});

test('validateTelemetryPayload accepts real MQTT packet structure', () => {
  const payload = {
    device_id: 'node01',
    timestamp: 1789238707326,
    sample_rate_hz: 500,
    accel: {
      x: [0.1, 0.2, -0.1],
      y: [0.2, 0.1, 0.0],
      z: [-0.1, 0.0, 0.2],
    },
  };

  assert.doesNotThrow(() => validateTelemetryPayload(payload));
});

test('validateSafetyAlertPayload accepts the new cv pipeline alert packet', () => {
  const payload = {
    timestamp: 1724539200,
    violations: ['Missing: Hardhat', 'Fall-Detected'],
    image_base64: Buffer.from('fake-jpeg-bytes', 'utf8').toString('base64'),
  };

  assert.doesNotThrow(() => validateSafetyAlertPayload(payload));
});

test('validateTelemetryPayload accepts optional temperature and current fields from live sensor packets', () => {
  const payload = {
    device_id: 'node01',
    timestamp: Date.now(),
    sample_rate_hz: 500,
    temperature: 48.1,
    current: 4.2,
    accel: {
      x: [0.1, 0.2, -0.1],
      y: [0.2, 0.1, 0.0],
      z: [-0.1, 0.0, 0.2],
    },
  };

  assert.doesNotThrow(() => validateTelemetryPayload(payload));
});

test('validateTelemetryPayload rejects invalid sensor arrays', () => {
  assert.throws(() => validateTelemetryPayload({
    device_id: 'node01',
    timestamp: Date.now(),
    sample_rate_hz: 0,
    accel: { x: [1, 2], y: [1], z: [1, 2] },
  }));
});

test('computeCentredMagnitude removes DC offset and produces signal', () => {
  const magnitude = computeCentredMagnitude([1, 2, 3], [2, 2, 2], [3, 4, 5]);
  assert.equal(Array.isArray(magnitude), true);
  assert.equal(magnitude.length, 3);
  assert.ok(magnitude.every((value) => Number.isFinite(value)));
});

test('computeRms and peakAcceleration produce finite values from centered signal', () => {
  const signal = [0.25, -0.5, 0.75, -0.25];
  const rms = computeRms(signal);
  const peak = computePeakAcceleration(signal);

  assert.ok(Number.isFinite(rms));
  assert.ok(Number.isFinite(peak));
  assert.ok(rms > 0);
  assert.ok(peak > 0);
});

test('computeSpectrumBins returns positive-frequency bins with correct range', () => {
  const bins = computeSpectrumBins([0.1, -0.2, 0.3, -0.4], 4);
  assert.equal(Array.isArray(bins), true);
  assert.ok(bins.length > 0);
  assert.ok(bins.every((bin) => Number.isFinite(bin.frequency) && Number.isFinite(bin.amplitude)));
  assert.ok(bins.every((bin) => bin.frequency >= 0));
});

test('processTelemetryPayload handles duplicate creation for the same device without crashing', async () => {
  const deviceId = 'node-concurrency-test';
  await Machine.deleteMany({ deviceId });
  await TelemetryRecord.deleteMany({ deviceId });

  const payload = {
    device_id: deviceId,
    timestamp: Date.now(),
    sample_rate_hz: 256,
    accel: {
      x: [0.1, 0.2, -0.1, 0.15, 0.05, -0.08, 0.12, 0.09],
      y: [0.2, -0.1, 0.14, 0.07, -0.04, 0.06, 0.08, 0.03],
      z: [-0.08, 0.11, 0.05, -0.06, 0.09, 0.02, 0.1, -0.03],
    },
  };

  const results = await Promise.allSettled([
    processTelemetryPayload(payload, 'devices/node-concurrency-test/telemetry'),
    processTelemetryPayload(payload, 'devices/node-concurrency-test/telemetry'),
  ]);

  const successful = results.filter((result) => result.status === 'fulfilled').length;
  const machines = await Machine.find({ deviceId }).lean();
  const telemetryRecords = await TelemetryRecord.find({ deviceId }).lean();

  assert.equal(successful >= 1, true);
  assert.equal(machines.length, 1);
  assert.ok(telemetryRecords.length >= 1);
});
