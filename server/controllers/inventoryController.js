const inventoryService = require('../services/inventoryService');
const { successResponse } = require('../utils/apiResponse');
const { HTTP_STATUS, MESSAGES } = require('../config/constants');
const { asyncHandler } = require('../utils/asyncHandler');

// GET /api/inventory/check?sku=...&quantity=...
exports.checkInventory = asyncHandler(async (req, res) => {
  const { sku } = req.query;
  const quantity = Number(req.query.quantity);

  const result = await inventoryService.checkStock(sku, quantity);
  return successResponse(res, HTTP_STATUS.OK, MESSAGES.SUCCESS, result);
});
