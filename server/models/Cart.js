const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  sku: { type: String, required: true },
  name: String,
  image: String,
  price: Number,
  quantity: { type: Number, required: true, min: 1 }
});

const cartSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  items: [cartItemSchema],
  totalPrice: { type: Number, default: 0 }
}, { timestamps: true });

// 1. INDEXES
cartSchema.index({ userId: 1 }); 

// 2. MIDDLEWARES (HOOKS)
// Tự động tính tổng tiền mỗi khi có sự thay đổi trong giỏ hàng (thêm, sửa, xóa item)
cartSchema.pre('save', function(next) {
  // Reset tổng tiền
  let total = 0;
  
  // Tính toán lại dựa trên mảng items hiện tại
  if (this.items && this.items.length > 0) {
    total = this.items.reduce((acc, item) => {
      return acc + (item.price * item.quantity);
    }, 0);
  }
  
  this.totalPrice = total;
  next();
});


// 3. INSTANCE METHODS
// Thêm sản phẩm vào giỏ hoặc tăng số lượng nếu đã tồn tại
cartSchema.methods.addItem = async function(itemData) {
  // Tìm xem sản phẩm (theo sku) đã có trong giỏ chưa
  const existingItemIndex = this.items.findIndex(item => item.sku === itemData.sku);

  if (existingItemIndex >= 0) {
    // Nếu có rồi -> Căng cộng số lượng
    this.items[existingItemIndex].quantity += itemData.quantity;
    // Cập nhật lại giá mới nhất nếu giá sản phẩm có thay đổi
    this.items[existingItemIndex].price = itemData.price; 
  } else {
    // Nếu chưa có -> Thêm mới vào mảng
    this.items.push(itemData);
  }
  
  return await this.save();
};

// Xóa một sản phẩm khỏi giỏ hàng
cartSchema.methods.removeItem = async function(sku) {
  // Lọc bỏ item có sku tương ứng
  this.items = this.items.filter(item => item.sku !== sku);
  return await this.save();
};

// Xóa sạch giỏ hàng (Dùng sau khi thanh toán thành công)
cartSchema.methods.clearCart = async function() {
  this.items = [];
  return await this.save(); 
};

// Cập nhật số lượng của một sản phẩm trong giỏ hàng
cartSchema.methods.updateItemQuantity = async function(sku, newQuantity) {
  const itemIndex = this.items.findIndex(item => item.sku === sku);
  
  if (itemIndex >= 0) {
    if (newQuantity <= 0) {
      // Nếu số lượng mới <= 0 thì xóa sản phẩm khỏi giỏ
      this.items.splice(itemIndex, 1);
    } else {
      // Cập nhật số lượng mới
      this.items[itemIndex].quantity = newQuantity;
    }
    return await this.save();
  } else {
    throw new Error('Sản phẩm không tồn tại trong giỏ hàng.');
  }
};  

// Lấy tổng số lượng sản phẩm trong giỏ hàng
cartSchema.methods.getTotalQuantity = function() {
  return this.items.reduce((acc, item) => acc + item.quantity, 0);
};

// Lấy tổng tiền của giỏ hàng (đã được tính tự động trong pre-save hook)
cartSchema.methods.getTotalPrice = function() {
  return this.totalPrice;
};

module.exports = mongoose.model('Cart', cartSchema);