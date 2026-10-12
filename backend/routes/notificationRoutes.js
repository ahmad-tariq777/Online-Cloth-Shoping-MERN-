const express = require('express');
const notifications = require('../controllers/notificationController');
const { authenticate, adminAuth } = require('../middleware/auth');
const { paramObjectId } = require('../middleware/validate');

const router = express.Router();

router.param('id', paramObjectId);

router.get('/', authenticate, notifications.listMyNotifications);
router.post('/', adminAuth, notifications.createNotification);
router.patch('/read-all', authenticate, notifications.markAllRead);
router.patch('/:id/read', authenticate, notifications.markRead);

module.exports = router;
