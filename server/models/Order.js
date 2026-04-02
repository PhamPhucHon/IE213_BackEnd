const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  sku: String,
  name: String,
  image: String,
  price: Number,
  quantity: Number
});

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [orderItemSchema],
  shippingAddress: {
    fullName: String,
    phone: String,
    address: String
  },
  paymentMethod: { type: String, required: true, enum: ['COD', 'Momo', 'BankTransfer'] },
  paymentResult: {
    id: String,
    status: String,
    updateTime: Date
  },
  itemsPrice: { type: Number, required: true },
  shippingPrice: { type: Number, required: true, default: 0 },
  totalPrice: { type: Number, required: true },
  status: { type: String, enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'], default: 'Pending' },
  isPaid: { type: Boolean, default: false },
  paidAt: Date,
  deliveredAt: Date,
  note: String
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);