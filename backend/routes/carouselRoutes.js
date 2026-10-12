const express = require('express');
const carousel = require('../controllers/carouselController');
const { optionalAuth, adminAuth } = require('../middleware/auth');
const { createUpload } = require('../middleware/upload');
const { paramObjectId } = require('../middleware/validate');

const router = express.Router();
const upload = createUpload();

router.param('id', paramObjectId);

router.get('/', carousel.listActive);
router.get('/all', adminAuth, carousel.listAll);
router.get('/collection/:id', optionalAuth, carousel.getSlide);
router.post('/', adminAuth, upload.single('image'), carousel.createSlide);
router.put('/:id', adminAuth, upload.single('image'), carousel.updateSlide);
router.delete('/:id', adminAuth, carousel.deleteSlide);

module.exports = router;
