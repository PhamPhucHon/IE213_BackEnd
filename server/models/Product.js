const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  brand: { type: String, required: true },
  sale: { type: Boolean, default: false },
  availability: { type: String, enum: ['in_stock', 'out_of_stock', 'pre_order'], default: 'in_stock' },
  type: { type: String, default: "Sunglasses" },
  description: { type: String, required: true },
  images: [{ type: String }], // Mảng URL
  specifications: {
    material: String,
    lensMaterial: String,
    origin: String,
    gender: { type: String, enum: ['Male', 'Female', 'Unisex'], default: 'Unisex' },
    size: {
      dimensions: String,
      width: Number,
      angle: Number,
      bridge: Number,
      totalWidth: Number,
      longestDiameter: Number
    }
  },
  variants: [{
    sku: { type: String, required: true, unique: true },
    color: String,
    size: String,
    price: { type: Number, required: true, min: 0 },
    originalPrice: { type: Number, min: 0 },
    images: [{ type: String }],
    isDefault: { type: Boolean, default: false }
  }],
  rating: { avg: { type: Number, default: 0 }, count: { type: Number, default: 0 } },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

// 1. INDEXES
productSchema.index({ name: 'text', brand: 'text' });
productSchema.index({ categoryId: 1, basePrice: 1 });
productSchema.index({ isActive: 1, isFeatured: -1 });


// 2. MIDDLEWARES 
// Tự động tạo slug chuẩn SEO trước khi validate dữ liệu
productSchema.pre('validate', function(next) {
  if (this.name && !this.slug) {
    this.slug = slugify(this.name);
  }
  next();
});


// 3. INSTANCE METHODS
// Ẩn sản phẩm thay vì xóa hẳn khỏi database
productSchema.methods.softDelete = async function() {
  this.isActive = false;
  return await this.save();
};

// Hàm cập nhật đánh giá trung bình sau khi có đánh giá mới
productSchema.methods.updateRating = async function(newRating) {
  const totalRating = this.rating.avg * this.rating.count + newRating;
  this.rating.count += 1;
  this.rating.avg = totalRating / this.rating.count;
  return await this.save();
};

// 4. STATIC METHODS
// Lấy sản phẩm theo category với phân trang và sắp xếp
productSchema.statics.findByCategory = function(categoryId, options) {
  const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = options;
  const skip = (page - 1) * limit;
  
  return this.find({ categoryId, isActive: true })
             .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
             .skip(skip)
             .limit(limit);
};


module.exports = mongoose.model('Product', productSchema);