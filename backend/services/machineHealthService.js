const Machine = require('../models/Machine');
const HealthRecord = require('../models/HealthRecord');
const { extractFeatures } = require('./featureExtractionService');
const { mockPredict } = require('./aiMachineHealthService');

function machineStatusFromAiStatus(status) {
  if (status === 'red') {
    return 'CRITICAL';
  }

  if (status === 'yellow') {
    return 'WARNING';
  }

  return 'ONLINE';
}

function normalizeTimestamp(timestamp) {
  if (timestamp === undefined || timestamp === null) {
    return new Date();
  }

  const numericTimestamp = Number(timestamp);
  const date = Number.isFinite(numericTimestamp)
    ? new Date(numericTimestamp < 10_000_000_000 ? numericTimestamp * 1000 : numericTimestamp)
    : new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    throw new Error('timestamp is invalid');
  }

  return date;
}

function validatePayload(payload) {
  if (!payload || typeof payload !== 'object') {
    throw new Error('payload is required');
  }

  if (!Array.isArray(payload.vibration)) {
    throw new Error('vibration must be an array');
  }

  if (!Number.isFinite(Number(payload.temperature))) {
    throw new Error('temperature must be a number');
  }

  if (!Number.isFinite(Number(payload.current))) {
    throw new Error('current must be a number');
  }
}

function createMachineHealthService(dependencies = {}) {
  const MachineModel = dependencies.MachineModel || Machine;
  const HealthRecordModel = dependencies.HealthRecordModel || HealthRecord;
  const featureExtractor = dependencies.featureExtractor || extractFeatures;
  const aiPredict = dependencies.aiPredict || mockPredict;

  async function processMachineData(payload) {
    validatePayload(payload);

    const machineId = payload.machineId || payload.nodeId || 'machine-01';
    const timestamp = normalizeTimestamp(payload.timestamp);
    const features = featureExtractor(payload.vibration);
    const prediction = payload.targetScore
      ? {
          health_score: Number(payload.targetScore),
          status: payload.targetScore >= 80 ? 'green' : payload.targetScore >= 50 ? 'yellow' : 'red',
        }
      : await aiPredict(features);

    const machine = await MachineModel.findOneAndUpdate(
      { machineId },
      {
        $set: {
          name: payload.name || `Machine ${machineId}`,
          zone: payload.zone || 'Unassigned Zone',
          status: machineStatusFromAiStatus(prediction.status),
          lastSeen: timestamp,
        },
        $setOnInsert: { machineId },
      },
      { new: true, upsert: true, runValidators: true }
    );

    const record = await HealthRecordModel.create({
      machineId,
      timestamp,
      temperature: Number(payload.temperature),
      current: Number(payload.current),
      rms: features.rms,
      peak: features.peak,
      fftBands: features.fft_bands,
      vibrationPreview: payload.vibration.slice(0, 128),
      healthScore: prediction.health_score,
      status: prediction.status,
    });

    return {
      machine,
      health: record,
      features,
      ai: prediction,
    };
  }

  async function getMachines() {
    return MachineModel.find().sort({ machineId: 1 });
  }

  async function getMachine(machineId) {
    return MachineModel.findOne({ machineId });
  }

  async function getLatestHealth(machineId) {
    return HealthRecordModel.findOne({ machineId }).sort({ timestamp: -1 });
  }

  async function getHistory(machineId, query = {}) {
    const filters = { machineId };

    if (query.from || query.to) {
      filters.timestamp = {};
      if (query.from) {
        filters.timestamp.$gte = new Date(query.from);
      }
      if (query.to) {
        filters.timestamp.$lte = new Date(query.to);
      }
    }

    const limit = Math.min(Number(query.limit) || 50, 200);
    return HealthRecordModel.find(filters).sort({ timestamp: -1 }).limit(limit);
  }

  async function getMetrics(machineId) {
    const [machine, latestHealth, history] = await Promise.all([
      getMachine(machineId),
      getLatestHealth(machineId),
      getHistory(machineId, { limit: 25 }),
    ]);

    return {
      machine,
      latestHealth,
      history: history.slice().reverse(),
    };
  }

  return {
    getHistory,
    getLatestHealth,
    getMachine,
    getMachines,
    getMetrics,
    processMachineData,
  };
}

module.exports = createMachineHealthService();
module.exports.createMachineHealthService = createMachineHealthService;
module.exports.machineStatusFromAiStatus = machineStatusFromAiStatus;
module.exports.normalizeTimestamp = normalizeTimestamp;
module.exports.validatePayload = validatePayload;
