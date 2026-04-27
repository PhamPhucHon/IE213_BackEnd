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
		body('shippingAddress.fullName').notEmpty().withMessage('Họ tên người nhận là bắt buộc'),
		body('shippingAddress.phone').notEmpty().withMessage('Số điện thoại là bắt buộc')
			.matches(/^(0[1-9][0-9]{8})$/).withMessage('Số điện thoại không hợp lệ (VD: 0901234567)'),
		body('shippingAddress.address').notEmpty().withMessage('Địa chỉ giao hàng là bắt buộc'),
		body('paymentMethod')
  			.notEmpty().withMessage('paymentMethod là bắt buộc')
  			.isIn(['COD', 'Momo', 'BankTransfer']).withMessage('Phương thức thanh toán không hợp lệ'),
	]),
	orderController.createOrder
);

router.get('/', orderController.getUserOrders);

router.put('/:id/cancel', validateObjectId('id'), orderController.cancelOrder);
router.get('/:id', validateObjectId('id'), orderController.getOrderById);

module.exports = router;
