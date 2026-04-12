const rateLimit = require('express-rate-limit');

const forgotPasswordLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 3,
	standardHeaders: true,
	legacyHeaders: false,
	keyGenerator: (req) =>
		`${rateLimit.ipKeyGenerator(req.ip)}:${String(req.body?.email || '').trim().toLowerCase()}`,
	message: {
		success: false,
		message: 'Bạn đã gửi yêu cầu quá nhiều lần. Vui lòng thử lại sau.',
	},
});

module.exports = {
	forgotPasswordLimiter,
};