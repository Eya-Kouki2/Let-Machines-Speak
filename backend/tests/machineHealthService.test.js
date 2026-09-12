const test = require('node:test');
const assert = require('node:assert/strict');
const {
  createMachineHealthService,
  machineStatusFromAiStatus,
} = require('../services/machineHealthService');

function createFindResult(value) {
  return {
    sort() {
      return value;
    },
  };
}

function createFindManyResult(value) {
  return {
    sort() {
      return {
        limit() {
          return value;
        },
      };
    },
  };
}

test('maps AI statuses to machine statuses', () => {
  assert.equal(machineStatusFromAiStatus('green'), 'ONLINE');
  assert.equal(machineStatusFromAiStatus('yellow'), 'WARNING');
  assert.equal(machineStatusFromAiStatus('red'), 'CRITICAL');
});

test('processes machine data and creates a machine plus health record', async () => {
  const createdRecords = [];
  const machineModel = {
    async findOneAndUpdate(filter, update) {
      return {
        machineId: filter.machineId,
        name: update.$set.name,
        zone: update.$set.zone,
        status: update.$set.status,
        lastSeen: update.$set.lastSeen,
      };
    },
  };
  const healthRecordModel = {
    async create(record) {
      createdRecords.push(record);
      return record;
    },
  };

  const service = createMachineHealthService({
    MachineModel: machineModel,
    HealthRecordModel: healthRecordModel,
    featureExtractor: () => ({ rms: 0.2, peak: 0.5, fft_bands: [0.1, 0.2] }),
    aiPredict: async () => ({ health_score: 88, status: 'green' }),
  });

  const result = await service.processMachineData({
    machineId: 'machine-99',
    name: 'Test Machine',
    zone: 'Test Zone',
    timestamp: 1717000000,
    vibration: [0.1, -0.1],
    temperature: 41.2,
    current: 0.85,
  });

  assert.equal(result.machine.machineId, 'machine-99');
  assert.equal(result.health.healthScore, 88);
  assert.equal(createdRecords[0].status, 'green');
});

test('retrieves latest health and history', async () => {
  const latest = { machineId: 'machine-01', healthScore: 91 };
  const history = [{ healthScore: 90 }, { healthScore: 88 }];
  const service = createMachineHealthService({
    MachineModel: { findOne: async () => ({ machineId: 'machine-01' }) },
    HealthRecordModel: {
      findOne: () => createFindResult(latest),
      find: () => createFindManyResult(history),
    },
  });

  assert.equal(await service.getLatestHealth('machine-01'), latest);
  assert.deepEqual(await service.getHistory('machine-01'), history);
});
