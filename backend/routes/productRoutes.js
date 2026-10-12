const express = require('express');
const products = require('../controllers/productController');
const { optionalAuth, moderatorAuth } = require('../middleware/auth');
const { createUpload } = require('../middleware/upload');
const { paramObjectId } = require('../middleware/validate');

const router = express.Router();
const upload = createUpload();

router.param('id', paramObjectId);

router.get('/', optionalAuth, products.listProducts);
router.get('/subcategories', optionalAuth, products.listSubCategories);
router.get('/:id', optionalAuth, products.getProduct);
router.post('/', moderatorAuth, upload.array('images', 5), products.createProduct);
router.put('/:id', moderatorAuth, upload.array('images', 5), products.updateProduct);
router.delete('/:id', moderatorAuth, products.deleteProduct);

module.exports = router;
