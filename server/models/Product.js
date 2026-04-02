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

// productSchema.index({ name: 'text', brand: 'text' });
module.exports = mongoose.model('Product', productSchema);