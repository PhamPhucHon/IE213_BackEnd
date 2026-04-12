const express = require('express');
const authController = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { validateBody, body } = require('../middleware/validateMiddleware');

const router = express.Router();

router.post(
	'/register',
	validateBody([
		body('name').trim().notEmpty().withMessage('Tên người dùng là bắt buộc'),
		body('email')
			.trim()
			.isEmail()
			.withMessage('Email không hợp lệ')
			.bail()
			.customSanitizer((value) => String(value).toLowerCase()),
		body('password').isLength({ min: 6 }).withMessage('Mật khẩu phải có ít nhất 6 ký tự'),
	]),
	authController.register
);

router.post(
	'/login',
	validateBody([
		body('email')
			.trim()
			.isEmail()
			.withMessage('Email không hợp lệ')
			.bail()
			.customSanitizer((value) => String(value).toLowerCase()),
		body('password').notEmpty().withMessage('Mật khẩu là bắt buộc'),
	]),
	authController.login
);

router.get('/me', protect, authController.getMe);
router.post('/logout', protect, authController.logout);

module.exports = router;
