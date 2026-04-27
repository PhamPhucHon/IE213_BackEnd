const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss');

const SENSITIVE_FIELDS = new Set([
	'password',
	'currentPassword',
	'newPassword',
	'token',
	'refreshToken',
]);

const sanitizeValue = (value, fieldName = '') => {
	if (typeof value === 'string') {
		return SENSITIVE_FIELDS.has(fieldName) ? value : xss(value);
	}

	if (Array.isArray(value)) {
		for (let index = 0; index < value.length; index += 1) {
			value[index] = sanitizeValue(value[index], fieldName);
		}
		return value;
	}

	if (value && typeof value === 'object') {
		for (const key of Object.keys(value)) {
			value[key] = sanitizeValue(value[key], key);
		}
	}

	return value;
};

const sanitizeRequestPayload = (req, res, next) => {
	void res;
	for (const source of ['body', 'query', 'params']) {
		if (req[source] && typeof req[source] === 'object') {
			sanitizeValue(req[source]);
		}
	}

	return next();
};

const sanitizeMongoPayload = (req, res, next) => {
	void res;
	for (const source of ['body', 'query', 'params']) {
		if (req[source] && typeof req[source] === 'object') {
			mongoSanitize.sanitize(req[source]);
		}
	}

	return next();
};

module.exports = {
	sanitizeMongoPayload,
	sanitizeRequestPayload,
};