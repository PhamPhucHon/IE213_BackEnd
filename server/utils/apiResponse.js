const { HTTP_STATUS, MESSAGES } = require('../config/constants');

/**
 * Kiểm tra response object hợp lệ
 */
const isValidRes = (res) => res && typeof res.status === 'function';

/**
 * Build metadata cho response
 * @param {Object} req - Express request object
 * @param {Object} extra - Các trường bổ sung
 */
const buildMeta = (req, extra = {}) => {
  const requestId = req?.headers?.['x-request-id'];
  return {
    timestamp: new Date().toISOString(),
    ...(requestId ? { requestId } : {}),
    ...extra,
  };
};

/**
 * Chuẩn hóa payload errors
 */
const normalizeErrors = (errors) => {
  if (errors == null) return null;
  if (Array.isArray(errors)) return errors;
  if (errors instanceof Error) return [{ message: errors.message }];
  if (typeof errors === 'string') return [{ message: errors }];
  return errors;
};

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
 * @param {Array|Object|string|null} errors - Chi tiết lỗi
 */
exports.errorResponse = (
  res,
  statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR,
  message = MESSAGES.ERROR,
  errors = null
) => {
  if (!isValidRes(res)) throw new Error('Invalid Express response object');

  return res.status(normalizeStatusCode(statusCode, 500)).json({
    success: false,
    message: message || MESSAGES.ERROR,
    errors: normalizeErrors(errors),
    meta: buildMeta(res.req),
  });
};

/**
 * Phản hồi lỗi validation (422) - tái sử dụng errorResponse
 */
exports.validationErrorResponse = (res, errors, message = 'Validation failed') => {
  return exports.errorResponse(
    res,
    HTTP_STATUS.UNPROCESSABLE_ENTITY,
    message,
    errors
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