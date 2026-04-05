/**
 * Middleware 404 - route không tồn tại
 */
exports.notFound = (req, res, next) => {
	const error = new Error(`Không tìm thấy endpoint: ${req.originalUrl}`);
	res.status(404);
	next(error);
};

/**
 * Middleware xử lý lỗi tập trung
 */
exports.errorHandler = (err, req, res, next) => {
	// next được giữ lại đúng signature của express error middleware
	void next;

	// Ưu tiên: err.statusCode (AppError) → res.statusCode (đã set trước) → 500 mặc định
	const statusCode = err.statusCode || (res.statusCode !== 200 ? res.statusCode : 500);

	let message = err.message || 'Đã xảy ra lỗi máy chủ.';
	let details = null;

	// Mongoose validation error
	if (err.name === 'ValidationError') {
		message = 'Dữ liệu không hợp lệ';
		details = Object.values(err.errors).map((e) => e.message);
	}

	// Duplicate key error
	if (err.code === 11000) {
		message = 'Dữ liệu bị trùng';
		details = err.keyValue || null;
	}

	// Invalid ObjectId
	if (err.name === 'CastError') {
		message = `ID không hợp lệ: ${err.path}`;
	}

	return res.status(statusCode).json({
		success: false,
		message,
		error: process.env.NODE_ENV === 'production' ? null : err.stack,
		details,
	});
};
