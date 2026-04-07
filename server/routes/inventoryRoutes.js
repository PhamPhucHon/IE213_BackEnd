const express = require('express');
const adminController = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/adminMiddleware');
const { validateBody, body, param } = require('../middleware/validateMiddleware');

const router = express.Router();

router.use(protect, isAdmin);

router.get('/:sku', validateBody([param('sku').notEmpty().withMessage('sku không hợp lệ')]), adminController.getInventoryBySku);
router.put(
	'/:sku',
	validateBody([
		param('sku').notEmpty().withMessage('sku không hợp lệ'),
		body('stock').isInt({ min: 0 }).withMessage('stock phải là số nguyên không âm'),
	]),
	adminController.updateInventory
);

module.exports = router;
