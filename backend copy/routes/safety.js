const express = require('express');
const safetyController = require('../controllers/safetyController');
const { requireApproved, requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(requireAuth, requireApproved);

router.get('/events', safetyController.listEvents);
router.post('/events', safetyController.createEvent);
router.patch('/events/:id', safetyController.updateEvent);

module.exports = router;
