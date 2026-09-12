const express = require('express');
const adminController = require('../controllers/adminController');
const { requireAdmin, requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(requireAuth, requireAdmin);
router.get('/pending-admins', adminController.listPendingAdmins);
router.patch('/users/:id/approve', adminController.approveAdmin);
router.patch('/users/:id/reject', adminController.rejectAdmin);

module.exports = router;
