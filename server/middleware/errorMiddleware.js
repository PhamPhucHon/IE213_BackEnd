const { HTTP_STATUS, MESSAGES } = require('../config/constants');
const logger = require('../config/logger');
const ApiError = require('../utils/apiError');
const { errorResponse } = require('../utils/apiResponse');

const buildValidationErrors = (validationError = {}) => Object.values(validationError.errors || {}).map((item) => ({
	field: item.path,
	message: item.message,
	value: item.value,
}));

const buildDuplicateKeyErrors = (duplicateError = {}) => Object.entries(duplicateError.keyValue || {}).map(([field, value]) => ({
	field,
	message: `${field} đã tồn tại`,
	value,
}));

const normalizeError = (err, res) => {
	let statusCode = err.statusCode || (res.statusCode >= 400 ? res.statusCode : HTTP_STATUS.INTERNAL_SERVER_ERROR);
	let message = err.message || MESSAGES.ERROR;
	let errors = err.errors || null;

	if (err.name === 'ValidationError') {
		statusCode = HTTP_STATUS.UNPROCESSABLE_ENTITY;
		message = MESSAGES.VALIDATION_FAILED;
		errors = buildValidationErrors(err);
	} else if (err.code === 11000) {
		statusCode = HTTP_STATUS.CONFLICT;
		message = 'Dữ liệu bị trùng';
		errors = buildDuplicateKeyErrors(err);
	} else if (err.name === 'CastError') {
		statusCode = HTTP_STATUS.BAD_REQUEST;
		message = `ID không hợp lệ: ${err.path}`;
		errors = [{ field: err.path, message, value: err.value }];
	} else if (err.name === 'JsonWebTokenError') {
		statusCode = HTTP_STATUS.UNAUTHORIZED;
		message = 'Token không hợp lệ.';
	} else if (err.name === 'TokenExpiredError') {
		statusCode = HTTP_STATUS.UNAUTHORIZED;
		message = 'Token đã hết hạn. Vui lòng đăng nhập lại.';
	} else if (err instanceof SyntaxError && 'body' in err) {
		statusCode = HTTP_STATUS.BAD_REQUEST;
		message = 'JSON không hợp lệ';
	}

	return { statusCode, message, errors };
};

/**
 * Middleware 404 - route không tồn tại
 */
exports.notFound = (req, res, next) => {
	next(new ApiError(`Không tìm thấy endpoint: ${req.originalUrl}`, HTTP_STATUS.NOT_FOUND));
};

/**
 * Middleware xử lý lỗi tập trung
 */
exports.errorHandler = (err, req, res, next) => {
	if (res.headersSent) {
		return next(err);
	}

	const { statusCode, message, errors } = normalizeError(err, res);

	if (statusCode >= HTTP_STATUS.INTERNAL_SERVER_ERROR) {
		const requestLogger = req.log || logger.raw;
		requestLogger.error({
			err,
			requestId: req.requestId || req.id,
			url: req.originalUrl,
			method: req.method,
			userId: req.user?._id?.toString?.() || req.user?.id || null,
		}, 'Unhandled application error');
	}

	return errorResponse(res, statusCode, message, errors);
};
