const express = require('express');

const router = express.Router();

router.use('/auth', require('./authRoutes'));
router.use('/products', require('./productRoutes'));
router.use('/orders', require('./orderRoutes'));
router.use('/notifications', require('./notificationRoutes'));
router.use('/messages', require('./messageRoutes'));
router.use('/categories', require('./categoryRoutes'));
router.use('/carousel', require('./carouselRoutes'));
router.use('/drop-collections', require('./dropCollectionRoutes'));
router.use('/reviews', require('./reviewRoutes'));
router.use('/sales', require('./salesRoutes'));

module.exports = router;
