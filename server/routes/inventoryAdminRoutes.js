const express = require('express');
const adminController = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/adminMiddleware');
const { validateBody, validateQuery, body, param, query } = require('../middleware/validateMiddleware');

const router = express.Router();

router.use(protect, isAdmin);

// GET /api/admin/inventory — Danh sách tồn kho có filter + phân trang
router.get(
  '/',
  validateQuery([
    query('productId').optional().isMongoId().withMessage('productId không hợp lệ'),
    query('lowStock').optional().isIn(['true', 'false']).withMessage('lowStock phải là true hoặc false'),
    query('page').optional().isInt({ min: 1 }).withMessage('page phải là số nguyên dương'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit phải từ 1 đến 100'),
  ]),
  adminController.getInventoryList
);

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