const express = require('express');
const machinesController = require('../controllers/machinesController');
const { requireAdmin, requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', requireAuth, machinesController.listMachines);
router.get('/:id', requireAuth, machinesController.getMachine);
router.post('/', requireAuth, requireAdmin, machinesController.createMachine);
router.patch('/:id', requireAuth, requireAdmin, machinesController.updateMachine);
router.delete('/:id', requireAuth, requireAdmin, machinesController.deleteMachine);

module.exports = router;
