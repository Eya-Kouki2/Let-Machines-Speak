const express = require('express');
const machineHealthController = require('../controllers/machineHealthController');

const router = express.Router();

router.get('/', machineHealthController.listMachines);
router.post('/simulate', machineHealthController.simulateMachineData);
router.get('/:id', machineHealthController.getMachine);
router.get('/:id/health', machineHealthController.getCurrentHealth);
router.get('/:id/history', machineHealthController.getHealthHistory);
router.get('/:id/metrics', machineHealthController.getMetrics);

module.exports = router;
