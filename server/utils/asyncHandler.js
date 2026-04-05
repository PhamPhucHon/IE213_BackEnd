/**
 * utils/asyncHandler.js
 *
 * Tiện ích giúp loại bỏ khối try/catch lặp đi lặp lại trong các route handler.
 *
 * Cách dùng:
 *   const { asyncHandler, AppError } = require('../utils/asyncHandler');
 *
 *   exports.getProduct = asyncHandler(async (req, res) => {
 *     const product = await productService.getProductById(req.params.id);
 *     return successResponse(res, 200, 'Thành công', product);
 *   });
 *
 *   // Ném lỗi với HTTP status code rõ ràng từ service hoặc controller:
 *   throw new AppError('Không tìm thấy sản phẩm', 404);
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
 *   throw new AppError('Không tìm thấy người dùng', 404);
 *   throw new AppError('Sai mật khẩu', 401);
 */
class AppError extends Error {
  /**
   * @param {string} message    - Thông báo lỗi
   * @param {number} statusCode - HTTP status code (mặc định 500)
   */
  constructor(message, statusCode = 500) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    /** Phân biệt lỗi nghiệp vụ (operational) với lỗi lập trình bất ngờ */
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = { asyncHandler, AppError };
