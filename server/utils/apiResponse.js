const { HTTP_STATUS, MESSAGES } = require('../config/constants');
const config = require('../config/env');
const logger = require('../config/logger');

/**
 * Kiểm tra response object hợp lệ
 */
const isValidRes = (res) => res && typeof res.status === 'function';

/**
 * Build metadata cho response
 * @param {Object} req - Express request object
 * @param {Object} extra - Các trường bổ sung
 */
const buildMeta = (req, extra = {}) => ({
  timestamp: new Date().toISOString(),
  requestId: req?.id || req?.headers?.['x-request-id'] || null,
  ...extra,
});

/**
 * Chuẩn hóa status code HTTP
 */
const normalizeStatusCode = (code, fallback = 200) => {
  const num = Number(code);
  return (num >= 100 && num < 600) ? num : fallback;
};

/**
 * Phản hồi thành công (200, 201, ...)
 * @param {Object} res - Express response object
 * @param {number} statusCode - Mã HTTP (mặc định 200)
 * @param {string} message - Thông báo
 * @param {any} data - Dữ liệu trả về
 * @param {Object} headers - Header tùy chỉnh
 * @param {Object} extraMeta - Metadata bổ sung (ví dụ pagination)
 */
exports.successResponse = (
  res,
  statusCode = HTTP_STATUS.OK,
  message = MESSAGES.SUCCESS,
  data = null,
  headers = {},
  extraMeta = {}
) => {
  if (!isValidRes(res)) throw new Error('Invalid Express response object');

  const finalStatusCode = normalizeStatusCode(statusCode, 200);

  // Set headers nếu có (chỉ nhận plain object)
  if (headers && typeof headers === 'object' && !Array.isArray(headers)) {
    Object.entries(headers).forEach(([key, value]) => {
      if (key && value !== undefined) res.setHeader(key, value);
    });
  }

  return res.status(finalStatusCode).json({
    success: true,
    message: message || 'Success',
    data: data ?? null,
    meta: buildMeta(res?.req, extraMeta),
  });
};

/**
 * Phản hồi lỗi
 * @param {Object} res - Express response object
 * @param {number} statusCode - Mã HTTP lỗi
 * @param {string} message - Thông báo lỗi
 * @param {Error|any} error - Đối tượng lỗi chi tiết
 * @param {boolean} logError - Có ghi log không
 */
exports.errorResponse = (
  res,
  statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR,
  message = MESSAGES.ERROR,
  error = null,
  logError = true
) => {
  if (!isValidRes(res)) throw new Error('Invalid Express response object');

  let finalStatusCode = normalizeStatusCode(statusCode, 500);
  let finalMessage = message || 'Error';
  let errorPayload = null;

  // Xử lý các loại lỗi phổ biến
  if (error) {
    if (error.name === 'ValidationError') {
      finalStatusCode = HTTP_STATUS.BAD_REQUEST;
      finalMessage = 'Dữ liệu không hợp lệ';
      errorPayload = Object.values(error.errors).map(e => e.message);
    } else if (error.code === 11000) {
      finalStatusCode = HTTP_STATUS.BAD_REQUEST;
      finalMessage = 'Dữ liệu bị trùng';
      errorPayload = error.keyValue; // Có thể chứa email, username – OK
    } else if (error.name === 'JsonWebTokenError') {
      finalStatusCode = HTTP_STATUS.UNAUTHORIZED;
      finalMessage = 'Token không hợp lệ';
    } else if (error.name === 'TokenExpiredError') {
      finalStatusCode = HTTP_STATUS.UNAUTHORIZED;
      finalMessage = 'Token đã hết hạn';
    } else {
      errorPayload = error.message || error;
    }
  }

  // Ghi log lỗi (ẩn stack khi production)
  if (logError && error) {
    logger.error(`[API Error] ${finalStatusCode} - ${finalMessage}`, {
      error: error.message || error,
      stack: config.env === 'development' ? error.stack : undefined,
      url: res?.req?.originalUrl || 'unknown',
    });
  }

  const response = {
    success: false,
    message: finalMessage,
    meta: buildMeta(res.req),
  };

  // Chỉ trả chi tiết lỗi trong môi trường development
  if (config.env === 'development' && error) {
    response.error = errorPayload;
    if (error.stack) response.stack = error.stack;
  }

  return res.status(finalStatusCode).json(response);
};

/**
 * Phản hồi lỗi validation (422) - tái sử dụng errorResponse
 */
exports.validationErrorResponse = (res, errors, message = 'Validation failed') => {
  return exports.errorResponse(
    res,
    HTTP_STATUS.UNPROCESSABLE_ENTITY,
    message,
    { details: errors },
    false // không log vì lỗi validation là do client
  );
};

/**
 * Phản hồi phân trang (tự động gắn meta.pagination)
 */
exports.paginatedResponse = (
  res,
  data = [],
  total = 0,
  page = 1,
  limit = 10,
  message = MESSAGES.SUCCESS
) => {
  if (!isValidRes(res)) throw new Error('Invalid Express response object');

  // Ép kiểu và validate an toàn
  const safeLimit = Math.max(1, Number(limit) || 100);
  const safePage = Math.max(1, Number(page) || 1);
  const safeTotal = Math.max(0, Number(total) || 0);
  const safeData = Array.isArray(data) ? data : [];

  const totalPages = Math.ceil(safeTotal / safeLimit);

  return exports.successResponse(
    res,
    HTTP_STATUS.OK,
    message,
    safeData,
    {}, // không headers đặc biệt
    {
      pagination: {
        total: safeTotal,
        page: safePage,
        limit: safeLimit,
        totalPages,
        hasNext: safePage < totalPages,
        hasPrev: safePage > 1,
      },
    }
  );
};

/**
 * Tiện ích: Response 201 Created (thường dùng khi tạo resource)
 */
exports.createdResponse = (res, data = null, message = MESSAGES.CREATED, location = null) => {
  const headers = {};
  if (location) headers.Location = location;
  return exports.successResponse(res, HTTP_STATUS.CREATED, message, data, headers);
};

/**
 * Tiện ích: Response 204 No Content (thành công nhưng không trả data)
 */
exports.noContentResponse = (res) => {
  if (!isValidRes(res)) throw new Error('Invalid Express response object');
  return res.status(HTTP_STATUS.NO_CONTENT).send();
};

/**
 * Tiện ích: Response 404 Not Found
 */
exports.notFoundResponse = (res, message = MESSAGES.NOT_FOUND) => {
  return exports.errorResponse(res, HTTP_STATUS.NOT_FOUND, message, null, false);
};

/**
 * Tiện ích: Response 403 Forbidden
 */
exports.forbiddenResponse = (res, message = MESSAGES.FORBIDDEN) => {
  return exports.errorResponse(res, HTTP_STATUS.FORBIDDEN, message, null, false);
};