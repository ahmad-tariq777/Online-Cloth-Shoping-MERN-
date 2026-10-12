const express = require('express');
const categories = require('../controllers/categoryController');
const { moderatorAuth } = require('../middleware/auth');
const { paramObjectId } = require('../middleware/validate');

const router = express.Router();

router.param('id', paramObjectId);

router.get('/', categories.listCategories);
router.get('/:id', categories.getCategory);
router.post('/', moderatorAuth, categories.createCategory);
router.put('/:id', moderatorAuth, categories.updateCategory);
router.delete('/:id', moderatorAuth, categories.deleteCategory);

module.exports = router;
