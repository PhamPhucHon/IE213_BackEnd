const express = require('express');
const cartController = require('../controllers/cartController');
const { protect } = require('../middleware/authMiddleware');
const { validateBody, body, param } = require('../middleware/validateMiddleware');

const router = express.Router();

router.use(protect);

router.get('/', cartController.getCart);

router.post(
	'/',
	validateBody([
		body('sku').notEmpty().withMessage('sku là bắt buộc'),
		body('quantity').isInt({ min: 1 }).withMessage('quantity phải là số nguyên >= 1'),
	]),
	cartController.addToCart
);

router.put(
	'/:sku',
	validateBody([
		param('sku').notEmpty().withMessage('sku không hợp lệ'),
		body('quantity').isInt().withMessage('quantity phải là số nguyên'),
	]),
	cartController.updateCartItem
);

router.delete('/:sku', validateBody([param('sku').notEmpty().withMessage('sku không hợp lệ')]), cartController.removeCartItem);
router.delete('/', cartController.clearCart);

module.exports = router;
