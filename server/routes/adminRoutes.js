const express = require('express');
const adminController = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/adminMiddleware');
const { validateBody, validateObjectId, body } = require('../middleware/validateMiddleware');

const router = express.Router();

router.use(protect, isAdmin);

router.get('/stats/overview', adminController.getStatsOverview);
router.get('/stats/top-products', adminController.getTopProducts);

router.get('/users', adminController.getAllUsers);
router.get('/users/:id', validateObjectId('id'), adminController.getUserById);
router.put('/users/:id/toggle-status', validateObjectId('id'), adminController.toggleUserStatus);

router.get('/orders', adminController.getAllOrders);
router.get('/orders/:id', validateObjectId('id'), adminController.getOrderById);
router.put(
	'/orders/:id/status',
	validateObjectId('id'),
	validateBody([body('status').notEmpty().withMessage('status là bắt buộc')]),
	adminController.updateOrderStatus
);

router.delete('/reviews/:id', validateObjectId('id'), adminController.deleteReview);

module.exports = router;
