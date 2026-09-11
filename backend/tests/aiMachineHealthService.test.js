const test = require('node:test');
const assert = require('node:assert/strict');
const { mockPredict, statusFromScore } = require('../services/aiMachineHealthService');

test('maps scores to green, yellow, and red statuses', () => {
  assert.equal(statusFromScore(90), 'green');
  assert.equal(statusFromScore(65), 'yellow');
  assert.equal(statusFromScore(30), 'red');
});

test('supports configurable thresholds', () => {
  assert.equal(statusFromScore(75, { green: 90, yellow: 70 }), 'yellow');
  assert.equal(statusFromScore(65, { green: 90, yellow: 70 }), 'red');
});

test('mock prediction returns a bounded score and status', async () => {
  const prediction = await mockPredict({ rms: 0.5, peak: 1, fft_bands: [0.1, 0.2] });

  assert.equal(typeof prediction.health_score, 'number');
  assert.ok(prediction.health_score >= 0);
  assert.ok(prediction.health_score <= 100);
  assert.match(prediction.status, /green|yellow|red/);
});
