const express = require('express');
const reviews = require('../controllers/reviewController');
const { authenticate } = require('../middleware/auth');
const { createUpload } = require('../middleware/upload');
const { paramObjectId } = require('../middleware/validate');

const router = express.Router();
const upload = createUpload();

router.param('productId', paramObjectId);
router.param('reviewId', paramObjectId);

router.get('/:productId', reviews.listReviews);
router.post('/:productId', authenticate, upload.array('images', 3), reviews.createReview);
router.put('/:reviewId', authenticate, reviews.updateReview);
router.delete('/:reviewId', authenticate, reviews.deleteReview);
router.post('/:reviewId/helpful', authenticate, reviews.markHelpful);

module.exports = router;
