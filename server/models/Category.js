const mongoose = require('mongoose');
const slugify = require('../utils/slugify');

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  slug: { type: String, required: true, unique: true },
  image: String,
  description: String,
  total_products: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  order: { type: Number, default: 0 }, // thứ tự hiển thị
}, { timestamps: true });

// 1. INDEXES
categorySchema.index({ isActive: 1, order: 1 });

// 2. MIDDLEWARES
// Tự động tạo Slug trước khi validate
categorySchema.pre('validate', function() {
  if (this.name && !this.slug) {
    // Gọi hàm slugify từ utils
    this.slug = slugify(this.name);
  }
});

// Ràng buộc: Không cho phép xóa danh mục nếu còn sản phẩm thuộc danh mục đó
categorySchema.pre('findOneAndDelete', async function() {
  const categoryId = this.getQuery()['_id'];
  const Product = mongoose.model('Product');

  // Đếm xem có bao nhiêu sản phẩm đang dùng danh mục này
  const productCount = await Product.countDocuments({ categoryId });

  if (productCount > 0) {
    throw new Error(`Không thể xóa! Đang có ${productCount} sản phẩm thuộc danh mục này.`);
  }
});

// 3. INSTANCE METHODS
// Phương thức Ẩn danh mục (Soft Delete) an toàn
categorySchema.methods.softDelete = async function() {
  const Product = mongoose.model('Product');
  
  // Ràng buộc: Ngay cả khi chỉ ẩn (không xóa) , ta cũng phải check xem còn sản phẩm đang bán không
  const activeProductsCount = await Product.countDocuments({ 
    categoryId: this._id, 
    isActive: true 
  });

  if (activeProductsCount > 0) {
    throw new Error('Không thể ẩn danh mục vì vẫn còn sản phẩm đang mở bán thuộc danh mục này.');
  }

  this.isActive = false;
  return await this.save();
};

module.exports = mongoose.model('Category', categorySchema);

