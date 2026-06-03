const express = require('express');
const uploadController = require('../controllers/uploadController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

router.use(protect);

router.post(
	'/images',
	upload.uploadSingle('image'),
	upload.handleUploadError,
	uploadController.uploadImage
);

module.exports = router;
