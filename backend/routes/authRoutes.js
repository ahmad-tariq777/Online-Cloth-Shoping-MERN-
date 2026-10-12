const express = require('express');
const auth = require('../controllers/authController');
const users = require('../controllers/userController');
const { authenticate, superAdminAuth } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiters');
const { paramObjectId } = require('../middleware/validate');

const router = express.Router();

router.param('userId', paramObjectId);

router.post('/signup', authLimiter, auth.register);
router.post('/login', authLimiter, auth.login);
router.post('/logout', auth.logout);

router.get('/me', authenticate, auth.me);
router.put('/profile', authenticate, auth.updateProfile);
router.put('/change-password', authenticate, auth.changePassword);

router.get('/users', superAdminAuth, users.listUsers);
router.post('/users', superAdminAuth, users.createUser);
router.get('/users/:userId', superAdminAuth, users.getUser);
router.put('/users/:userId', superAdminAuth, users.updateUser);
router.put('/users/:userId/role', superAdminAuth, users.updateUserRole);
router.put('/users/:userId/toggle-status', superAdminAuth, users.toggleUserStatus);
router.delete('/users/:userId', superAdminAuth, users.deleteUser);

module.exports = router;
