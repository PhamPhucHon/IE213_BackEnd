const { HTTP_STATUS } = require('../config/constants');
const { errorResponse } = require('../utils/apiResponse');

/**
 * Middleware kiểm tra quyền Admin
 * Lưu ý: phải chạy sau auth middleware để có req.user
 */
exports.isAdmin = (req, res, next) => {
	if (!req.user) {
		return errorResponse(res, HTTP_STATUS.UNAUTHORIZED, 'Chưa xác thực người dùng.');
	}

	if (!req.user.isAdmin) {
		return errorResponse(res, HTTP_STATUS.FORBIDDEN, 'Bạn không có quyền truy cập tài nguyên này.');
	}

	return next();
};

// Alias phổ biến
exports.adminOnly = exports.isAdmin;
