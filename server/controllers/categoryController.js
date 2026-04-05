const categoryService = require('../services/categoryService');
const { successResponse } = require('../utils/apiResponse');
const { HTTP_STATUS, MESSAGES } = require('../config/constants');
const { asyncHandler } = require('../utils/asyncHandler');

// GET /api/categories
exports.getAllCategories = asyncHandler(async (req, res) => {
  const categories = await categoryService.getAllCategories();
  return successResponse(res, HTTP_STATUS.OK, MESSAGES.SUCCESS, categories);
});

// GET /api/categories/:id
exports.getCategoryById = asyncHandler(async (req, res) => {
  const category = await categoryService.getCategoryById(req.params.id);
  return successResponse(res, HTTP_STATUS.OK, MESSAGES.SUCCESS, category);
});

// GET /api/categories/slug/:slug
exports.getCategoryBySlug = asyncHandler(async (req, res) => {
  const category = await categoryService.getCategoryBySlug(req.params.slug);
  return successResponse(res, HTTP_STATUS.OK, MESSAGES.SUCCESS, category);
});

// POST /api/categories  (Admin only)
exports.createCategory = asyncHandler(async (req, res) => {
  const category = await categoryService.createCategory(req.body);
  return successResponse(res, HTTP_STATUS.CREATED, 'Tạo danh mục thành công', category);
});

// PUT /api/categories/:id  (Admin only)
exports.updateCategory = asyncHandler(async (req, res) => {
  const category = await categoryService.updateCategory(req.params.id, req.body);
  return successResponse(res, HTTP_STATUS.OK, 'Cập nhật danh mục thành công', category);
});

// DELETE /api/categories/:id  (Admin only)
exports.deleteCategory = asyncHandler(async (req, res) => {
  const result = await categoryService.deleteCategory(req.params.id);
  return successResponse(res, HTTP_STATUS.OK, result.message, null);
});
