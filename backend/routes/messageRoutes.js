const express = require('express');
const messages = require('../controllers/messageController');
const { authenticate, adminAuth } = require('../middleware/auth');
const { paramObjectId } = require('../middleware/validate');

const router = express.Router();

router.param('userId', paramObjectId);

router.post('/', authenticate, messages.sendMessage);
router.get('/conversations', adminAuth, messages.listConversations);
router.get('/:userId', authenticate, messages.getConversation);

module.exports = router;
