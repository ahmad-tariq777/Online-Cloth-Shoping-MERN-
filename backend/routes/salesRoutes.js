const express = require('express');
const sales = require('../controllers/saleController');
const { moderatorAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/active', sales.listActiveSales);
router.get('/products', moderatorAuth, sales.listSaleProducts);
router.get('/filters', moderatorAuth, sales.getFilters);
router.post('/apply', moderatorAuth, sales.applySale);
router.post('/remove', moderatorAuth, sales.removeSale);

module.exports = router;
