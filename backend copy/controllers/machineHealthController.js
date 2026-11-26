const machineHealthService = require('../services/machineHealthService');
const TelemetryRecord = require('../models/TelemetryRecord');
const { buildSimulatedPayload } = require('../services/simulationService');
const { emit } = require('../services/socketService');

function success(res, data, statusCode = 200) {
  return res.status(statusCode).json({ success: true, data });
}

function notFound(res, message) {
  return res.status(404).json({ success: false, error: { message } });
}

async function listMachines(req, res, next) {
  try {
    const machines = await machineHealthService.getMachines();
    return success(res, machines);
  } catch (error) {
    return next(error);
  }
}

async function getMachine(req, res, next) {
  try {
    const machine = await machineHealthService.getMachine(req.params.id);
    if (!machine) return notFound(res, 'Machine not found');
    return success(res, machine);
  } catch (error) {
    return next(error);
  }
}

async function getCurrentHealth(req, res, next) {
  try {
    const health = await machineHealthService.getLatestHealth(req.params.id);
    if (!health) return notFound(res, 'No health data available yet');
    return success(res, health);
  } catch (error) {
    return next(error);
  }
}

async function getHealthHistory(req, res, next) {
  try {
    const history = await machineHealthService.getHistory(req.params.id, req.query);
    return success(res, history);
  } catch (error) {
    return next(error);
  }
}

async function getMetrics(req, res, next) {
  try {
    const metrics = await machineHealthService.getMetrics(req.params.id);
    if (!metrics.machine) return notFound(res, 'Machine not found');
    return success(res, metrics);
  } catch (error) {
    return next(error);
  }
}

async function getTelemetry(req, res, next) {
  try {
    const machineId = req.params.id;
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(Math.max(1, Number(req.query.limit) || 25), 200);
    const range = String(req.query.range || '24h').toLowerCase();
    const now = Date.now();
    const windows = {
      '1h': 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
    };

    const filter = { machineId };
    const span = windows[range] || windows['24h'];
    filter.timestamp = { $gte: new Date(now - span) };

    const [items, total] = await Promise.all([
      TelemetryRecord.find(filter).sort({ timestamp: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      TelemetryRecord.countDocuments(filter),
    ]);

    return success(res, {
      items: items.reverse(),
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (error) {
    return next(error);
  }
}

async function getHealthHistoryCompat(req, res, next) {
  try {
    const history = await machineHealthService.getHistory(req.params.id, req.query);
    return success(res, history);
  } catch (error) {
    return next(error);
  }
}

async function simulateMachineData(req, res, next) {
  try {
    const payload = buildSimulatedPayload(req.body.scenario, req.body.machineId);
    const result = await machineHealthService.processMachineData(payload);

    // Emit real-time events so connected clients update immediately
    emit('machine:health-updated', {
      machineId: result.machine?.machineId ?? payload.machineId,
      health: result.health,
      machine: result.machine,
    });
    emit('dashboard:updated');

    return success(res, result, 201);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getCurrentHealth,
  getHealthHistory: getHealthHistoryCompat,
  getMachine,
  getMetrics,
  getTelemetry,
  listMachines,
  simulateMachineData,
};
