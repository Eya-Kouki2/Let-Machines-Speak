const machineHealthService = require('../services/machineHealthService');
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
  getHealthHistory,
  getMachine,
  getMetrics,
  listMachines,
  simulateMachineData,
};
