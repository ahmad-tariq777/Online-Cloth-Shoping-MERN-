const express = require('express');
const drops = require('../controllers/dropCollectionController');
const { optionalAuth, moderatorAuth } = require('../middleware/auth');
const { createUpload } = require('../middleware/upload');
const { paramObjectId } = require('../middleware/validate');

const router = express.Router();
const upload = createUpload();

router.param('id', paramObjectId);

router.get('/', drops.listActive);
router.get('/all', moderatorAuth, drops.listAll);
router.get('/:id', optionalAuth, drops.getCollection);
router.post('/', moderatorAuth, upload.single('image'), drops.createCollection);
router.put('/:id', moderatorAuth, upload.single('image'), drops.updateCollection);
router.delete('/:id', moderatorAuth, drops.deleteCollection);

module.exports = router;
