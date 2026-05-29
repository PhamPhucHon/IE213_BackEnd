const express = require('express');
const adminController = require('../controllers/adminController');
const uploadController = require('../controllers/uploadController');
const { protect } = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/adminMiddleware');
const upload = require('../middleware/uploadMiddleware');
const { validateBody, validateObjectId, body } = require('../middleware/validateMiddleware');

const router = express.Router();

router.use(protect, isAdmin);

router.get('/stats/overview', adminController.getStatsOverview);
router.get('/stats/top-products', adminController.getTopProducts);

router.post(
	'/uploads/images',
	/*
	  #swagger.tags = ['Admin']
	  #swagger.summary = 'Upload anh cho admin catalog'
	  #swagger.description = 'Upload mot file anh len Cloudinary va tra ve URL da optimize de BE/FE luu vao product hoac variant.'
	  #swagger.consumes = ['multipart/form-data']
	  #swagger.parameters['image'] = {
	    in: 'formData',
	    type: 'file',
	    required: true,
	    description: 'File anh JPG, PNG, WEBP hoac AVIF'
	  }
	  #swagger.responses[200] = {
	    description: 'Upload thanh cong',
	    schema: {
	      success: true,
	      message: 'Image uploaded successfully',
	      data: {
	        imageUrl: 'https://res.cloudinary.com/.../image/upload/f_webp,q_auto/...',
	        publicId: 'products/example',
	        format: 'webp',
	        optimized: true
	      }
	    }
	  }
	*/
	upload.uploadSingle('image'),
	upload.handleUploadError,
	uploadController.uploadImage
);

router.get('/users', adminController.getAllUsers);
router.get('/users/:id', validateObjectId('id'), adminController.getUserById);
router.put('/users/:id/toggle-status', validateObjectId('id'), adminController.toggleUserStatus);

router.get('/orders', adminController.getAllOrders);
router.get('/orders/:id', validateObjectId('id'), adminController.getOrderById);
router.put(
	'/orders/:id/status',
	validateObjectId('id'),
	validateBody([body('status').notEmpty().withMessage('status là bắt buộc')]),
	adminController.updateOrderStatus
);

router.get('/reviews', adminController.getAllReviews);
router.delete('/reviews/:id', validateObjectId('id'), adminController.deleteReview);

module.exports = router;
