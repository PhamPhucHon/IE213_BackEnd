const express = require('express');
const categoryController = require('../controllers/categoryController');
const { protect } = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/adminMiddleware');
const { validateBody, validateObjectId, body } = require('../middleware/validateMiddleware');

const router = express.Router();

router.get('/', categoryController.getAllCategories);
router.get('/slug/:slug', categoryController.getCategoryBySlug);
router.get('/:id', validateObjectId('id'), categoryController.getCategoryById);

router.post(
	'/',
	protect,
	isAdmin,
	validateBody([
		body('name').notEmpty().withMessage('Tên danh mục là bắt buộc'),
		body('description').optional().isString().trim(),
		body('order').optional().isInt({ min: 0 }).withMessage('order phải là số nguyên không âm'),
	]),
	categoryController.createCategory
);

router.put('/:id', protect, isAdmin, validateObjectId('id'), categoryController.updateCategory);
router.delete('/:id', protect, isAdmin, validateObjectId('id'), categoryController.deleteCategory);

module.exports = router;
