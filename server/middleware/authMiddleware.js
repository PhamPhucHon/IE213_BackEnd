const jwt = require('jsonwebtoken');
const User = require('../models/User');
const TokenBlacklist = require('../models/TokenBlacklist');
const config = require('../config/env');
const { HTTP_STATUS } = require('../config/constants');
const { errorResponse } = require('../utils/apiResponse');

/**
 * Lấy token từ header Authorization: Bearer <token>
 */
const extractToken = (req) => {
	const authHeader = req.headers?.authorization;
	if (authHeader && authHeader.startsWith('Bearer ')) {
		return authHeader.split(' ')[1];
	}

	// Hỗ trợ thêm một số client cũ gửi token qua x-access-token
	if (req.headers?.['x-access-token']) {
		return req.headers['x-access-token'];
	}

	return null;
};

/**
 * Middleware xác thực JWT
 */
exports.protect = async (req, res, next) => {
	try {
		const token = extractToken(req);
		if (!token) {
			return errorResponse(res, HTTP_STATUS.UNAUTHORIZED, 'Bạn chưa đăng nhập. Vui lòng cung cấp token.');
		}

		const decoded = jwt.verify(token, config.jwtSecret);

		const isBlacklisted = await TokenBlacklist.exists({ token });
		if (isBlacklisted) {
			return errorResponse(res, HTTP_STATUS.UNAUTHORIZED, 'Token đã bị vô hiệu hóa. Vui lòng đăng nhập lại.');
		}

		const user = await User.findById(decoded.id).select('-password');

		if (!user) {
			return errorResponse(res, HTTP_STATUS.UNAUTHORIZED, 'Token không hợp lệ hoặc người dùng không tồn tại.');
		}

		req.user = user;
		return next();
	} catch (error) {
		let message = 'Xác thực thất bại.';

		if (error.name === 'TokenExpiredError') {
			message = 'Token đã hết hạn. Vui lòng đăng nhập lại.';
		} else if (error.name === 'JsonWebTokenError') {
			message = 'Token không hợp lệ.';
		}

		return errorResponse(res, HTTP_STATUS.UNAUTHORIZED, message);
	}
};

// Alias để thuận tiện khi import ở các file route
exports.isAuthenticated = exports.protect;
