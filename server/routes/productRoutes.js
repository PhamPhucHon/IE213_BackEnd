const express = require('express');
const productController = require('../controllers/productController');
const reviewController = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/adminMiddleware');
const upload = require('../middleware/uploadMiddleware');
const { validateBody, validateQuery, validateParams, validateObjectId, body, query, param } = require('../middleware/validateMiddleware');

const router = express.Router();

router.get(
	'/',
	/*
	  #swagger.tags = ['Products']
	  #swagger.summary = 'Lấy danh sách sản phẩm với nhiều bộ lọc'
	  #swagger.description = 'Có thể lọc đồng thời theo type và categoryId, ví dụ: /api/products?type=Sunglasses&categoryId=<id>'
	  #swagger.parameters['page'] = {
	    in: 'query',
	    description: 'Trang hiện tại',
	    type: 'integer'
	  }
	  #swagger.parameters['limit'] = {
	    in: 'query',
	    description: 'Số sản phẩm mỗi trang',
	    type: 'integer'
	  }
	  #swagger.parameters['keyword'] = {
	    in: 'query',
	    description: 'Từ khóa tìm theo tên sản phẩm',
	    type: 'string'
	  }
	  #swagger.parameters['categoryId'] = {
	    in: 'query',
	    description: 'ID danh mục. Có thể dùng cùng type để lọc kết hợp',
	    type: 'string'
	  }
	  #swagger.parameters['brand'] = {
	    in: 'query',
	    description: 'Thương hiệu sản phẩm',
	    type: 'string'
	  }
	  #swagger.parameters['minPrice'] = {
	    in: 'query',
	    description: 'Giá thấp nhất',
	    type: 'number'
	  }
	  #swagger.parameters['maxPrice'] = {
	    in: 'query',
	    description: 'Giá cao nhất',
	    type: 'number'
	  }
	  #swagger.parameters['type'] = {
	    in: 'query',
	    description: 'Loại sản phẩm. Có thể dùng cùng categoryId để lọc kết hợp',
	    type: 'string',
	    enum: ['Sunglasses', 'Eyeglasses']
	  }
	  #swagger.parameters['sort'] = {
	    in: 'query',
	    description: 'Kiểu sắp xếp: newest, priceAsc, priceDesc, topRated',
	    type: 'string'
	  }
	*/
	validateQuery([
		query('page').optional().isInt({ min: 1 }).withMessage('page phải là số nguyên dương'),
		query('limit').optional().isInt({ min: 1 }).withMessage('limit phải là số nguyên dương'),
		query('minPrice').optional().isFloat({ min: 0 }).withMessage('minPrice không hợp lệ'),
		query('maxPrice').optional().isFloat({ min: 0 }).withMessage('maxPrice không hợp lệ'),
		query('categoryId').optional().isMongoId().withMessage('categoryId không hợp lệ'),
		query('type').optional().isIn(['Sunglasses', 'Eyeglasses']).withMessage('type không hợp lệ'),
		query('sort').optional().isIn(['newest', 'priceAsc', 'priceDesc', 'topRated']).withMessage('sort không hợp lệ'),
	]),
	productController.getProducts
);

router.get(
	'/type/:type',
	/*
	  #swagger.tags = ['Products']
	  #swagger.summary = 'Lấy danh sách sản phẩm theo type'
	  #swagger.description = 'Trả về danh sách sản phẩm đang hoạt động theo loại sản phẩm.'
	  #swagger.parameters['type'] = {
	    in: 'path',
	    description: 'Loại sản phẩm',
	    required: true,
	    type: 'string',
	    enum: ['Sunglasses', 'Eyeglasses']
	  }
	  #swagger.parameters['page'] = {
	    in: 'query',
	    description: 'Trang hiện tại',
	    type: 'integer'
	  }
	  #swagger.parameters['limit'] = {
	    in: 'query',
	    description: 'Số sản phẩm mỗi trang',
	    type: 'integer'
	  }
	  #swagger.parameters['sort'] = {
	    in: 'query',
	    description: 'Kiểu sắp xếp: newest, priceAsc, priceDesc, topRated',
	    type: 'string'
	  }
	*/
	validateParams([
		param('type').isIn(['Sunglasses', 'Eyeglasses']).withMessage('type không hợp lệ'),
	]),
	validateQuery([
		query('page').optional().isInt({ min: 1 }).withMessage('page phải là số nguyên dương'),
		query('limit').optional().isInt({ min: 1 }).withMessage('limit phải là số nguyên dương'),
	]),
	productController.getProductsByType
);

router.get(
	'/category/:categoryId',
	/*
	  #swagger.tags = ['Products']
	  #swagger.summary = 'Lấy danh sách sản phẩm theo category'
	  #swagger.description = 'Trả về danh sách sản phẩm đang hoạt động thuộc một danh mục cụ thể.'
	  #swagger.parameters['categoryId'] = {
	    in: 'path',
	    description: 'ID danh mục sản phẩm',
	    required: true,
	    type: 'string'
	  }
	  #swagger.parameters['page'] = {
	    in: 'query',
	    description: 'Trang hiện tại',
	    type: 'integer'
	  }
	  #swagger.parameters['limit'] = {
	    in: 'query',
	    description: 'Số sản phẩm mỗi trang',
	    type: 'integer'
	  }
	  #swagger.parameters['sort'] = {
	    in: 'query',
	    description: 'Kiểu sắp xếp: newest, priceAsc, priceDesc, topRated',
	    type: 'string'
	  }
	*/
	validateObjectId('categoryId'),
	validateQuery([
		query('page').optional().isInt({ min: 1 }).withMessage('page phải là số nguyên dương'),
		query('limit').optional().isInt({ min: 1 }).withMessage('limit phải là số nguyên dương'),
	]),
	productController.getProductsByCategory
);

router.get('/slug/:slug', productController.getProductBySlug);

router.get(
	'/:productId/reviews',
	validateObjectId('productId'),
	reviewController.getReviewsByProduct
);

router.post(
	'/upload-image',
	protect,
	isAdmin,
	upload.uploadSingle('image'),
	upload.handleUploadError,
	productController.uploadImage
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
