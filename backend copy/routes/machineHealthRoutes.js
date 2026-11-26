const express = require('express');
const machineHealthController = require('../controllers/machineHealthController');
const { requireApproved, requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(requireAuth, requireApproved);
router.get('/', machineHealthController.listMachines);
router.post('/simulate', machineHealthController.simulateMachineData);
router.get('/:id', machineHealthController.getMachine);
router.get('/:id/health', machineHealthController.getCurrentHealth);
router.get('/:id/telemetry', machineHealthController.getTelemetry);
router.get('/:id/history', machineHealthController.getHealthHistory);
router.get('/:id/health-history', machineHealthController.getHealthHistory);
router.get('/:id/metrics', machineHealthController.getMetrics);

module.exports = router;
