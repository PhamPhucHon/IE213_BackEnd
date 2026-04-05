const productService = require('../services/productService');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const { HTTP_STATUS, MESSAGES, PAGINATION } = require('../config/constants');

// GET /api/products
exports.getProducts = async (req, res) => {
  try {
    const { keyword, categoryId, brand, minPrice, maxPrice, sort } = req.query;
    const page = Number(req.query.page) || PAGINATION.DEFAULT_PAGE;
    const limit = Math.min(Number(req.query.limit) || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT);

    const result = await productService.getProducts(
      { keyword, categoryId, brand, minPrice, maxPrice },
      page,
      limit,
      sort
    );
    return successResponse(res, HTTP_STATUS.OK, MESSAGES.SUCCESS, result.products, {}, result.pagination);
  } catch (error) {
    return errorResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message, error);
  }
};

// GET /api/products/:id
exports.getProductById = async (req, res) => {
  try {
    const product = await productService.getProductById(req.params.id);
    return successResponse(res, HTTP_STATUS.OK, MESSAGES.SUCCESS, product);
  } catch (error) {
    return errorResponse(res, HTTP_STATUS.NOT_FOUND, error.message, error);
  }
};

// GET /api/products/slug/:slug
exports.getProductBySlug = async (req, res) => {
  try {
    const product = await productService.getProductBySlug(req.params.slug);
    return successResponse(res, HTTP_STATUS.OK, MESSAGES.SUCCESS, product);
  } catch (error) {
    return errorResponse(res, HTTP_STATUS.NOT_FOUND, error.message, error);
  }
};

// POST /api/products  (Admin only)
exports.createProduct = async (req, res) => {
  try {
    const product = await productService.createProduct(req.body);
    return successResponse(res, HTTP_STATUS.CREATED, 'Tạo sản phẩm thành công', product);
  } catch (error) {
    return errorResponse(res, HTTP_STATUS.BAD_REQUEST, error.message, error);
  }
};

// PUT /api/products/:id  (Admin only)
exports.updateProduct = async (req, res) => {
  try {
    const product = await productService.updateProduct(req.params.id, req.body);
    return successResponse(res, HTTP_STATUS.OK, 'Cập nhật sản phẩm thành công', product);
  } catch (error) {
    return errorResponse(res, HTTP_STATUS.BAD_REQUEST, error.message, error);
  }
};

// DELETE /api/products/:id  (Admin only)
exports.deleteProduct = async (req, res) => {
  try {
    const result = await productService.deleteProduct(req.params.id);
    return successResponse(res, HTTP_STATUS.OK, result.message, null);
  } catch (error) {
    return errorResponse(res, HTTP_STATUS.BAD_REQUEST, error.message, error);
  }
};

// POST /api/products/upload-image  (Admin only)
exports.uploadImage = async (req, res) => {
  try {
    if (!req.file && !req.files) {
      return errorResponse(res, HTTP_STATUS.BAD_REQUEST, 'Không có file được tải lên');
    }
    const imageUrl = req.file.path;
    return successResponse(res, HTTP_STATUS.OK, 'Tải ảnh thành công', { imageUrl });
  } catch (error) {
    return errorResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message, error);
  }
};