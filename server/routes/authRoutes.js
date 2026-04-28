const express = require('express');
const authController = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { validateBody, body } = require('../middleware/validateMiddleware');
const { loginLimiter, forgotPasswordLimiter, refreshTokenLimiter } = require('../middleware/authRateLimit');

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
	loginLimiter,
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

router.post(
	'/forgot-password',
	/*
	  #swagger.tags = ['Auth']
	  #swagger.summary = 'Quên mật khẩu - gửi email đặt lại mật khẩu'
	  #swagger.parameters['body'] = {
	    in: 'body',
	    required: true,
	    schema: {
	      $email: 'user@example.com'
	    }
	  }
	  #swagger.responses[200] = {
	    description: 'Yeu cau thanh cong',
	    schema: {
	      success: true,
	      message: 'Email đặt lại mật khẩu đã được gửi',
	      data: null,
	      meta: {
	        timestamp: '2026-04-12T15:00:00.000Z',
	        requestId: null
	      }
	    }
	  }
	  #swagger.responses[429] = {
	    description: 'Vuot qua gioi han gui yeu cau',
	    schema: {
	      success: false,
	      message: 'Bạn đã gửi yêu cầu quá nhiều lần. Vui lòng thử lại sau.'
	    }
	  }
	  #swagger.responses[403] = {
	    description: 'Tai khoan admin khong duoc phep quen mat khau',
	    schema: {
	      success: false,
	      message: 'Tai khoan admin khong duoc phep su dung tinh nang quen mat khau.'
	    }
	  }
	*/
	forgotPasswordLimiter,
	validateBody([
		body('email')
			.trim()
			.isEmail()
			.withMessage('Email không hợp lệ')
			.bail()
			.customSanitizer((value) => String(value).toLowerCase()),
	]),
	authController.forgotPassword
);

router.post(
	'/reset-password',
	/*
	  #swagger.tags = ['Auth']
	  #swagger.summary = 'Đặt lại mật khẩu bằng token'
	  #swagger.parameters['body'] = {
	    in: 'body',
	    required: true,
	    schema: {
	      $token: 'reset_token_from_email',
	      $newPassword: '12345678'
	    }
	  }
	  #swagger.responses[200] = {
	    description: 'Dat lai mat khau thanh cong',
	    schema: {
	      success: true,
	      message: 'Đặt lại mật khẩu thành công',
	      data: null,
	      meta: {
	        timestamp: '2026-04-12T15:05:00.000Z',
	        requestId: null
	      }
	    }
	  }
	  #swagger.responses[400] = {
	    description: 'Token khong hop le hoac da het han',
	    schema: {
	      success: false,
	      message: 'Token đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.',
	      details: null
	    }
	  }
	*/
	validateBody([
		body('token').trim().notEmpty().withMessage('Token đặt lại mật khẩu là bắt buộc'),
		body('newPassword').isLength({ min: 6 }).withMessage('Mật khẩu mới phải có ít nhất 6 ký tự'),
	]),
	authController.resetPassword
);

router.get('/me', protect, authController.getMe);
// logout không dùng protect — cho phép access token đã expired vẫn gọi được để blacklist refresh token
router.post('/logout', authController.logout);
router.post(
	'/refresh-token',
	refreshTokenLimiter,
	validateBody([
		body('refreshToken').trim().notEmpty().withMessage('refreshToken là bắt buộc'),
	]),
	authController.refreshToken
);

module.exports = router;
