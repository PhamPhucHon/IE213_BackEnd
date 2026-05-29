const productService = require('../services/productService');
const { successResponse } = require('../utils/apiResponse');
const { HTTP_STATUS, MESSAGES, PAGINATION } = require('../config/constants');
const { asyncHandler } = require('../utils/asyncHandler');

// GET /api/products
exports.getProducts = asyncHandler(async (req, res) => {
  const { keyword, categoryId, brand, minPrice, maxPrice, sort, type } = req.query;
  const page = Number(req.query.page) || PAGINATION.DEFAULT_PAGE;
  const limit = Math.min(Number(req.query.limit) || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT);

  const result = await productService.getProducts(
    { keyword, categoryId, brand, minPrice, maxPrice, type },
    page,
    limit,
    sort
  );
  return successResponse(res, HTTP_STATUS.OK, MESSAGES.SUCCESS, result.products, {}, result.pagination);
});

// GET /api/products/type/:type
exports.getProductsByType = asyncHandler(async (req, res) => {
  const { sort } = req.query;
  const page = Number(req.query.page) || PAGINATION.DEFAULT_PAGE;
  const limit = Math.min(Number(req.query.limit) || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT);

  const result = await productService.getProducts(
    { type: req.params.type },
    page,
    limit,
    sort
  );

  return successResponse(res, HTTP_STATUS.OK, MESSAGES.SUCCESS, result.products, {}, result.pagination);
});

// GET /api/products/category/:categoryId
exports.getProductsByCategory = asyncHandler(async (req, res) => {
  const { sort } = req.query;
  const page = Number(req.query.page) || PAGINATION.DEFAULT_PAGE;
  const limit = Math.min(Number(req.query.limit) || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT);

  const result = await productService.getProducts(
    { categoryId: req.params.categoryId },
    page,
    limit,
    sort
  );

  return successResponse(res, HTTP_STATUS.OK, MESSAGES.SUCCESS, result.products, {}, result.pagination);
});

// GET /api/products/:id
exports.getProductById = asyncHandler(async (req, res) => {
  const product = await productService.getProductById(req.params.id);
  return successResponse(res, HTTP_STATUS.OK, MESSAGES.SUCCESS, product);
});

// GET /api/products/slug/:slug
exports.getProductBySlug = asyncHandler(async (req, res) => {
  const product = await productService.getProductBySlug(req.params.slug);
  return successResponse(res, HTTP_STATUS.OK, MESSAGES.SUCCESS, product);
});

// POST /api/products  (Admin only)
exports.createProduct = asyncHandler(async (req, res) => {
  const product = await productService.createProduct(req.body);
  return successResponse(res, HTTP_STATUS.CREATED, 'Tạo sản phẩm thành công', product);
});

// PUT /api/products/:id  (Admin only)
exports.updateProduct = asyncHandler(async (req, res) => {
  const product = await productService.updateProduct(req.params.id, req.body);
  return successResponse(res, HTTP_STATUS.OK, 'Cập nhật sản phẩm thành công', product);
});

// DELETE /api/products/:id  (Admin only)
exports.deleteProduct = asyncHandler(async (req, res) => {
  const result = await productService.deleteProduct(req.params.id);
  return successResponse(res, HTTP_STATUS.OK, result.message, null);
});
