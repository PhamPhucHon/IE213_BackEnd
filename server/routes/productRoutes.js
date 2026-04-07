const express = require('express');
const productController = require('../controllers/productController');
const reviewController = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/adminMiddleware');
const upload = require('../middleware/uploadMiddleware');
const { validateBody, validateQuery, validateObjectId, body, query } = require('../middleware/validateMiddleware');

const router = express.Router();

router.get(
	'/',
	validateQuery([
		query('page').optional().isInt({ min: 1 }).withMessage('page phải là số nguyên dương'),
		query('limit').optional().isInt({ min: 1 }).withMessage('limit phải là số nguyên dương'),
		query('minPrice').optional().isFloat({ min: 0 }).withMessage('minPrice không hợp lệ'),
		query('maxPrice').optional().isFloat({ min: 0 }).withMessage('maxPrice không hợp lệ'),
	]),
	productController.getProducts
);

router.get('/slug/:slug', productController.getProductBySlug);

router.get(
	'/:productId/reviews',
	validateObjectId('productId'),
	reviewController.getReviewsByProduct
);

router.post(
	'/:productId/reviews',
	protect,
	validateObjectId('productId'),
	validateBody([
		body('rating').isInt({ min: 1, max: 5 }).withMessage('rating phải từ 1 đến 5'),
		body('comment').notEmpty().withMessage('Nội dung đánh giá là bắt buộc'),
		body('title').optional().isString().trim(),
		body('images').optional().isArray().withMessage('images phải là mảng'),
	]),
	reviewController.createReview
);

router.get('/:id', validateObjectId('id'), productController.getProductById);

router.post(
	'/upload-image',
	protect,
	isAdmin,
	upload.uploadSingle('image'),
	upload.handleUploadError,
	productController.uploadImage
);

router.post(
	'/',
	protect,
	isAdmin,
	validateBody([
		body('name').notEmpty().withMessage('Tên sản phẩm là bắt buộc'),
		body('categoryId').notEmpty().withMessage('categoryId là bắt buộc'),
		body('variants').isArray({ min: 1 }).withMessage('variants phải là mảng và không được rỗng'),
	]),
	productController.createProduct
);

router.put('/:id', protect, isAdmin, validateObjectId('id'), productController.updateProduct);
router.delete('/:id', protect, isAdmin, validateObjectId('id'), productController.deleteProduct);

module.exports = router;
