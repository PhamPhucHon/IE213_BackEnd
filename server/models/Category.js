const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  slug: { type: String, required: true, unique: true },
  image: String,
  description: String,
  isActive: { type: Boolean, default: true },
  order: { type: Number, default: 0 }, // thứ tự hiển thị
}, { timestamps: true });

module.exports = mongoose.model('Category', categorySchema);