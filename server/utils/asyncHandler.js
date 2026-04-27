const ApiError = require('./apiError');

/**
 * utils/asyncHandler.js
 *
 * Tiện ích giúp loại bỏ khối try/catch lặp đi lặp lại trong các route handler.
 *
 * Cách dùng:
 *   const { asyncHandler } = require('../utils/asyncHandler');
 *   const ApiError = require('../utils/apiError');
 *
 *   exports.getProduct = asyncHandler(async (req, res) => {
 *     const product = await productService.getProductById(req.params.id);
 *     return successResponse(res, 200, 'Thành công', product);
 *   });
 *
 *   // Ném lỗi với HTTP status code rõ ràng từ service hoặc controller:
 *   throw new ApiError('Không tìm thấy sản phẩm', 404);
 */

/**
 * Bọc async route handler — bắt lỗi và chuyển qua next() để
 * errorMiddleware xử lý tập trung, tránh UnhandledPromiseRejection.
 *
 * @param {Function} fn - Async (req, res, next) handler
 * @returns {Function} Express middleware
 */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

/**
 * Custom error class dùng trong service / controller khi cần
 * trả về HTTP status code cụ thể (không phải 500 mặc định).
 *
 * @example
 *   throw new ApiError('Không tìm thấy người dùng', 404);
 *   throw new ApiError('Sai mật khẩu', 401);
 */
module.exports = {
  asyncHandler,
  ApiError,
  AppError: ApiError,
};
