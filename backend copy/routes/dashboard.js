const express = require('express');
const dashboardController = require('../controllers/dashboardController');
const { requireApproved, requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

// All dashboard endpoints require an authenticated & approved user
router.use(requireAuth, requireApproved);

router.get('/summary', dashboardController.getSummary);
router.get('/recent-activity', dashboardController.getRecentActivity);
router.get('/health-trend', dashboardController.getHealthTrend);

module.exports = router;
