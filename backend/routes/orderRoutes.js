const express = require('express');
const orders = require('../controllers/orderController');
const { authenticate, adminAuth } = require('../middleware/auth');
const { orderCreateLimiter } = require('../middleware/rateLimiters');
const { paramObjectId, validateOrderInput } = require('../middleware/validate');

const router = express.Router();

router.param('id', paramObjectId);
router.param('userId', paramObjectId);

router.post('/', authenticate, orderCreateLimiter, validateOrderInput, orders.placeOrder);
router.get('/my', authenticate, orders.listMyOrders);
router.get('/user/:userId', authenticate, orders.listOrdersForUser);
router.get('/admin/all', adminAuth, orders.listAllOrders);
router.get('/:id', authenticate, orders.getOrder);
router.put('/:id/status', adminAuth, orders.updateStatus);
router.put('/:id/payment-verify', adminAuth, orders.verifyPayment);
router.post('/:id/refund-request', authenticate, orders.requestRefund);
router.delete('/:id', authenticate, orders.cancelMyOrder);

module.exports = router;
