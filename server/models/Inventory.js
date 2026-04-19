const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  sku: { type: String, required: true, unique: true }, // khóa chính
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  stock: { type: Number, required: true, default: 0 }, // tồn kho thực
  reserved: { type: Number, default: 0 }, // tồn kho đã đặt nhưng chưa thanh toán
  warehouse: { type: String, default: 'main' },
  lastRestocked: Date,
}, {timestamps: true});

// 1. INDEXES
inventorySchema.index({ productId: 1 });
inventorySchema.index({ stock: 1, reserved: 1 }); // hỗ trợ filter lowStock ($expr subtract)

// 2. MIDDLEWARES (Hooks)
// Trước khi lưu, đảm bảo rằng reserved không vượt quá stock
inventorySchema.pre('save', function() {
  if (this.reserved > this.stock) {
    throw new Error(`Lỗi kho: SKU ${this.sku} có lượng giữ chỗ (reserved) vượt quá tồn kho (stock) hiện tại.`);
  }
});

// 3. INSTANCE METHODS
// Tính số lượng hàng còn lại có thể bán (hiển thị cho khách)
inventorySchema.methods.getAvailable = function() {
  return this.stock - this.reserved;
};

// LƯU Ý: Các method addStock, reserveStock, releaseStock, issueStock đã được chuyển sang
// inventoryService để sử dụng atomic findOneAndUpdate, tránh race condition.

module.exports = mongoose.model('Inventory', inventorySchema);