const express = require('express');
const inventoryController = require('../controllers/inventoryController');
const { protect } = require('../middleware/authMiddleware');
const { validateQuery, query } = require('../middleware/validateMiddleware');

const router = express.Router();

router.use(protect);

// GET /api/inventory/check?sku=...&quantity=...
router.get(
  '/check',
  validateQuery([
    query('sku').notEmpty().withMessage('sku là bắt buộc'),
    query('quantity')
      .notEmpty().withMessage('quantity là bắt buộc')
      .isInt({ min: 1 }).withMessage('quantity phải là số nguyên >= 1'),
  ]),
  inventoryController.checkInventory
);

module.exports = router;
