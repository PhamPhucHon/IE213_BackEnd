/**
 * Middleware kiểm tra quyền Admin
 * Lưu ý: phải chạy sau auth middleware để có req.user
 */
exports.isAdmin = (req, res, next) => {
	if (!req.user) {
		return res.status(401).json({
			success: false,
			message: 'Chưa xác thực người dùng.',
		});
	}

	if (!req.user.isAdmin) {
		return res.status(403).json({
			success: false,
			message: 'Bạn không có quyền truy cập tài nguyên này.',
		});
	}

	return next();
};

// Alias phổ biến
exports.adminOnly = exports.isAdmin;
