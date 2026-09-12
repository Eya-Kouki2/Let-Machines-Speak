const test = require('node:test');
const assert = require('node:assert/strict');
const SafetyEvent = require('../models/SafetyEvent');

test('safety event model creates and validates allowed event types', () => {
  const ev = new SafetyEvent({
    zone: 'Zone 1',
    event: 'no_helmet',
    confidence: 0.95,
    status: 'open',
  });

  assert.equal(ev.zone, 'Zone 1');
  assert.equal(ev.event, 'no_helmet');
  assert.equal(ev.status, 'open');
  assert.equal(ev.confidence, 0.95);
});

test('safety event rejects invalid event type', async () => {
  const ev = new SafetyEvent({
    zone: 'Zone 1',
    event: 'invalid_event_type',
    confidence: 0.9,
  });

  await assert.rejects(() => ev.validate(), /enum/);
});

test('safety event rejects confidence outside 0-1', async () => {
  const ev = new SafetyEvent({
    zone: 'Zone 1',
    event: 'no_helmet',
    confidence: 1.5,
  });

  await assert.rejects(() => ev.validate(), /max/);
});

test('getSummary returns structured data fallback when db disconnected', async () => {
  const { getSummary } = require('../controllers/dashboardController');
  let result = null;
  const mockRes = {
    json: (payload) => {
      result = payload;
      return payload;
    },
  };
  await getSummary({}, mockRes, (err) => {
    throw err;
  });
  assert.ok(result);
  assert.equal(result.success, true);
  assert.ok(result.data.machines);
  assert.ok(result.data.safety);
  assert.ok(result.data.alerts);
});

