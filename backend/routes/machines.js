const express = require('express');
const machinesController = require('../controllers/machinesController');
const { requireAdmin, requireApproved, requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', requireAuth, requireApproved, machinesController.listMachines);
router.get('/:id', requireAuth, requireApproved, machinesController.getMachine);
router.post('/', requireAuth, requireAdmin, machinesController.createMachine);
router.patch('/:id', requireAuth, requireAdmin, machinesController.updateMachine);
router.delete('/:id', requireAuth, requireAdmin, machinesController.deleteMachine);

module.exports = router;
