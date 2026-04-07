const express = require('express');
const reviewController = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');
const { validateBody, validateObjectId, body } = require('../middleware/validateMiddleware');

const router = express.Router();

router.post('/:id/like', protect, validateObjectId('id'), reviewController.likeReview);

router.put(
	'/:id',
	protect,
	validateObjectId('id'),
	validateBody([
		body('rating').optional().isInt({ min: 1, max: 5 }).withMessage('rating phải từ 1 đến 5'),
		body('title').optional().isString().trim(),
		body('comment').optional().isString().trim(),
		body('images').optional().isArray().withMessage('images phải là mảng'),
	]),
	reviewController.updateReview
);

router.delete('/:id', protect, validateObjectId('id'), reviewController.deleteReview);

module.exports = router;
