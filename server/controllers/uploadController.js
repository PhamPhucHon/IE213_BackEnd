const uploadService = require('../services/uploadService');
const { successResponse } = require('../utils/apiResponse');
const { HTTP_STATUS } = require('../config/constants');
const { asyncHandler } = require('../utils/asyncHandler');

exports.uploadImage = asyncHandler(async (req, res) => {
  const image = await uploadService.uploadImageResult(req.file);
  return successResponse(res, HTTP_STATUS.OK, 'Image uploaded successfully', image);
});
