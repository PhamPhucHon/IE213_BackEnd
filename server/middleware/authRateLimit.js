const rateLimit = require('express-rate-limit');
const config = require('../config/env');
const { HTTP_STATUS } = require('../config/constants');
const { errorResponse } = require('../utils/apiResponse');

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;

const getClientIp = (req) => {
	return req.ip || req.socket?.remoteAddress || '';
};

const buildRateLimitHandler = (message) => (req, res, next, options) => {
	void req;
	void next;
	return errorResponse(
		res,
		options.statusCode || HTTP_STATUS.TOO_MANY_REQUESTS,
		message
	);
};

const shouldSkipGlobalLimiter = (req) => {
	if (config.env === 'test') {
		return true;
	}

	if (req.method === 'OPTIONS') {
		return true;
	}

	const requestPath = req.path || req.originalUrl || '';
	return requestPath === '/' || requestPath === '/api' || requestPath === '/api-docs' || requestPath.startsWith('/api-docs/');
};

const globalApiLimiter = rateLimit({
	windowMs: RATE_LIMIT_WINDOW_MS,
	max: 100,
	standardHeaders: true,
	legacyHeaders: false,
	keyGenerator: (req) => rateLimit.ipKeyGenerator(getClientIp(req)),
	skip: shouldSkipGlobalLimiter,
	handler: buildRateLimitHandler('Quá nhiều yêu cầu từ địa chỉ IP này. Vui lòng thử lại sau 15 phút.'),
});

const loginLimiter = rateLimit({
	windowMs: RATE_LIMIT_WINDOW_MS,
	max: 20,
	standardHeaders: true,
	legacyHeaders: false,
	keyGenerator: (req) =>
		`${rateLimit.ipKeyGenerator(getClientIp(req))}:${String(req.body?.email || '').trim().toLowerCase()}`,
	handler: buildRateLimitHandler('Quá nhiều lần thử đăng nhập, vui lòng thử lại sau 15 phút.'),
});

const forgotPasswordLimiter = rateLimit({
	windowMs: RATE_LIMIT_WINDOW_MS,
	max: 3,
	standardHeaders: true,
	legacyHeaders: false,
	keyGenerator: (req) =>
		`${rateLimit.ipKeyGenerator(getClientIp(req))}:${String(req.body?.email || '').trim().toLowerCase()}`,
	handler: buildRateLimitHandler('Bạn đã gửi yêu cầu quá nhiều lần. Vui lòng thử lại sau.'),
});

// Giới hạn refresh token: 10 lần/15 phút theo IP — chặn token stuffing attacks
const refreshTokenLimiter = rateLimit({
	windowMs: RATE_LIMIT_WINDOW_MS,
	max: 10,
	standardHeaders: true,
	legacyHeaders: false,
	keyGenerator: (req) => rateLimit.ipKeyGenerator(getClientIp(req)),
	handler: buildRateLimitHandler('Quá nhiều yêu cầu làm mới token. Vui lòng thử lại sau 15 phút.'),
});

module.exports = {
	globalApiLimiter,
	loginLimiter,
	forgotPasswordLimiter,
	refreshTokenLimiter,
};
