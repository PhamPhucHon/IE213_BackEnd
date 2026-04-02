const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  sku: { type: String, required: true, unique: true }, // khóa chính
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  stock: { type: Number, required: true, default: 0 }, // tồn kho thực
  reserved: { type: Number, default: 0 }, // tồn kho đã đặt nhưng chưa thanh toán
  warehouse: { type: String, default: 'main' },
  lastRestocked: Date,
});

module.exports = mongoose.model('Inventory', inventorySchema);