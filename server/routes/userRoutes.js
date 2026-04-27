const express = require('express');
const userController = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { validateBody, validateObjectId, body } = require('../middleware/validateMiddleware');

const router = express.Router();

router.use(protect);

router.get('/profile', userController.getProfile);

router.put(
	'/profile',
	validateBody([
		body('name').optional().isString().trim().notEmpty().withMessage('Tên không hợp lệ'),
		body('phone').optional().isString().trim().withMessage('Số điện thoại không hợp lệ'),
		body('avatar').optional().isString().trim().withMessage('Avatar không hợp lệ'),
	]),
	userController.updateProfile
);

router.put(
	'/change-password',
	validateBody([
		body('currentPassword').notEmpty().withMessage('Mật khẩu hiện tại là bắt buộc'),
		body('newPassword').isLength({ min: 6 }).withMessage('Mật khẩu mới phải có ít nhất 6 ký tự'),
	]),
	userController.changePassword
);

router.post(
	'/addresses',
	/*
	  #swagger.tags = ['Users']
	  #swagger.summary = 'Thêm địa chỉ cho user hiện tại'
	  #swagger.parameters['body'] = {
	    in: 'body',
	    description: 'Thông tin địa chỉ cần thêm',
	    required: true,
	    schema: {
	      label: 'Nha',
	      $address: '123 Nguyen Trai, Q1',
	      isDefault: true
	    }
	  }
	*/
	validateBody([
		body('label').optional().isString().trim().withMessage('Nhãn địa chỉ không hợp lệ'),
		body('address').notEmpty().withMessage('Địa chỉ là bắt buộc'),
		body('isDefault').optional().isBoolean().withMessage('isDefault phải là boolean'),
	]),
	userController.addAddress
);

router.put(
	'/addresses/:addressId/set-default',
	validateObjectId('addressId'),
	userController.setDefaultAddress
);

router.put(
	'/addresses/:addressId',
	/*
	  #swagger.tags = ['Users']
	  #swagger.summary = 'Cập nhật địa chỉ của user hiện tại'
	  #swagger.parameters['addressId'] = {
	    in: 'path',
	    description: 'ID địa chỉ',
	    required: true,
	    type: 'string'
	  }
	  #swagger.parameters['body'] = {
	    in: 'body',
	    description: 'Thông tin địa chỉ cần cập nhật',
	    schema: {
	      label: 'Cong ty',
	      address: 'Toa nha X',
	      isDefault: false
	    }
	  }
	*/
	validateObjectId('addressId'),
	validateBody([
		body('label').optional().isString().trim().withMessage('Nhãn địa chỉ không hợp lệ'),
		body('address').optional().isString().trim().withMessage('Địa chỉ không hợp lệ'),
		body('isDefault').optional().isBoolean().withMessage('isDefault phải là boolean'),
	]),
	userController.updateAddress
);

router.delete('/addresses/:addressId', validateObjectId('addressId'), userController.deleteAddress);

router.get('/addresses', protect, userController.getAddresses);

router.delete('/me', protect, userController.deleteOwnAccount);

module.exports = router;
