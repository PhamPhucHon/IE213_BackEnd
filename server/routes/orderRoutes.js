const express = require('express');
const orderController = require('../controllers/orderController');
const { protect } = require('../middleware/authMiddleware');
const { validateBody, validateObjectId, body } = require('../middleware/validateMiddleware');

const router = express.Router();

router.use(protect);

router.post(
	'/',
	validateBody([
		body('shippingAddress').isObject().withMessage('shippingAddress là bắt buộc'),
		body('paymentMethod').notEmpty().withMessage('paymentMethod là bắt buộc'),
	]),
	orderController.createOrder
);

router.get('/', orderController.getUserOrders);

router.put('/:id/cancel', validateObjectId('id'), orderController.cancelOrder);
router.get('/:id', validateObjectId('id'), orderController.getOrderById);

module.exports = router;
