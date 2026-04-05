const categoryService = require('../services/categoryService');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const { HTTP_STATUS, MESSAGES } = require('../config/constants');

// GET /api/categories
exports.getAllCategories = async (req, res) => {
  try {
    const categories = await categoryService.getAllCategories();
    return successResponse(res, HTTP_STATUS.OK, MESSAGES.SUCCESS, categories);
  } catch (error) {
    return errorResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message, error);
  }
};

// GET /api/categories/:id
exports.getCategoryById = async (req, res) => {
  try {
    const category = await categoryService.getCategoryById(req.params.id);
    return successResponse(res, HTTP_STATUS.OK, MESSAGES.SUCCESS, category);
  } catch (error) {
    return errorResponse(res, HTTP_STATUS.NOT_FOUND, error.message, error);
  }
};

// GET /api/categories/slug/:slug
exports.getCategoryBySlug = async (req, res) => {
  try {
    const category = await categoryService.getCategoryBySlug(req.params.slug);
    return successResponse(res, HTTP_STATUS.OK, MESSAGES.SUCCESS, category);
  } catch (error) {
    return errorResponse(res, HTTP_STATUS.NOT_FOUND, error.message, error);
  }
};

// POST /api/categories  (Admin only)
exports.createCategory = async (req, res) => {
  try {
    const category = await categoryService.createCategory(req.body);
    return successResponse(res, HTTP_STATUS.CREATED, 'Tạo danh mục thành công', category);
  } catch (error) {
    return errorResponse(res, HTTP_STATUS.BAD_REQUEST, error.message, error);
  }
};

// PUT /api/categories/:id  (Admin only)
exports.updateCategory = async (req, res) => {
  try {
    const category = await categoryService.updateCategory(req.params.id, req.body);
    return successResponse(res, HTTP_STATUS.OK, 'Cập nhật danh mục thành công', category);
  } catch (error) {
    return errorResponse(res, HTTP_STATUS.BAD_REQUEST, error.message, error);
  }
};

// DELETE /api/categories/:id  (Admin only)
exports.deleteCategory = async (req, res) => {
  try {
    const result = await categoryService.deleteCategory(req.params.id);
    return successResponse(res, HTTP_STATUS.OK, result.message, null);
  } catch (error) {
    return errorResponse(res, HTTP_STATUS.BAD_REQUEST, error.message, error);
  }
};
