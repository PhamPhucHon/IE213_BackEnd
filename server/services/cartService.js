const Cart = require('../models/Cart');
const Product = require('../models/Product');
const inventoryService = require('./inventoryService');
const { cartDTO } = require('../utils/dto');


// Hàm phụ trợ để tính tổng tiền của giỏ hàng
const calculateTotalPrice = (items) => {
  return items.reduce((total, item) => total + (item.price * item.quantity), 0);
};


/**
 * Lấy giỏ hàng của user (Nếu chưa có sẽ tự động tạo mới)
 * @param {String} userId - ID của người dùng
 * @returns {Object} - Dữ liệu giỏ hàng
 */
exports.getCart = async (userId) => {
  let cart = await Cart.findOne({ userId });
  
  // Nếu user mới đăng ký chưa có giỏ hàng, ta tạo sẵn một giỏ rỗng cho họ
  if (!cart) {
    cart = await Cart.create({ userId, items: [], totalPrice: 0 });
  }
  
  return cartDTO(cart);
};

/**
 * Thêm sản phẩm vào giỏ (Tăng số lượng nếu đã có)
 * @param {String} userId - ID người dùng
 * @param {Object} data - Chứa sku và quantity
 * @returns {Object} - Giỏ hàng sau khi cập nhật
 */
exports.addToCart = async (userId, { sku, quantity }) => {
  if (quantity <= 0) throw new Error('Số lượng sản phẩm phải lớn hơn 0');

  // 1. Lấy thông tin Product dựa vào SKU (Ghi chú: Quét trong mảng variants)
  const product = await Product.findOne({ 'variants.sku': sku, isActive: true });
  if (!product) {
    throw new Error('Sản phẩm không tồn tại hoặc đã ngừng kinh doanh.');
  }

  // Lấy ra đúng biến thể (variant) mà khách chọn
  const variant = product.variants.find(v => v.sku === sku);

  // 2. Lấy giỏ hàng hiện tại
  let cart = await Cart.findOne({ userId });
  if (!cart) {
    cart = new Cart({ userId, items: [], totalPrice: 0 });
  }

  // 3. Tính toán số lượng mong muốn
  const existingItemIndex = cart.items.findIndex(item => item.sku === sku);
  let desiredQuantity = quantity;

  if (existingItemIndex > -1) {
    desiredQuantity += cart.items[existingItemIndex].quantity; // Cộng dồn nếu đã có trong giỏ
  }

  // 4. KIỂM TRA TỒN KHO (Business Rule cực kỳ quan trọng)
  const inventory = await inventoryService.getStock(sku);
  const availableStock = inventory.stock - inventory.reserved; // Hàng thực tế có thể bán
  
  if (availableStock < desiredQuantity) {
    throw new Error(`Sản phẩm này hiện chỉ còn ${availableStock} chiếc trong kho. Vui lòng giảm số lượng.`);
  }

  // 5. Cập nhật dữ liệu vào giỏ hàng
  if (existingItemIndex > -1) {
    // Nếu đã có: Cập nhật số lượng, đồng thời cập nhật lại Giá và Ảnh (phòng khi Admin vừa đổi giá)
    cart.items[existingItemIndex].quantity = desiredQuantity;
    cart.items[existingItemIndex].price = variant.price;
    cart.items[existingItemIndex].name = `${product.name} - ${variant.color}`;
    cart.items[existingItemIndex].image = variant.images[0] || product.images[0];
  } else {
    // Nếu chưa có: Thêm mới
    cart.items.push({
      productId: product._id,
      sku: sku,
      name: `${product.name} - ${variant.color}`,
      image: variant.images[0] || product.images[0] || '',
      price: variant.price,
      quantity: quantity
    });
  }

  // 6. Tính tổng tiền & Lưu
  cart.totalPrice = calculateTotalPrice(cart.items);
  return cartDTO(await cart.save());
};

/**
 * Cập nhật trực tiếp số lượng của một sản phẩm trong giỏ
 * @param {String} userId - ID người dùng
 * @param {String} sku - Mã sản phẩm
 * @param {Number} quantity - Số lượng mới
 * @returns {Object} - Giỏ hàng sau cập nhật
 */
exports.updateCartItem = async (userId, sku, quantity) => {
  // Nếu khách bấm giảm số lượng về 0 -> Tự động xóa khỏi giỏ
  if (quantity <= 0) {
    return await exports.removeCartItem(userId, sku);
  }

  const cart = await Cart.findOne({ userId });
  if (!cart) throw new Error('Không tìm thấy giỏ hàng.');

  const itemIndex = cart.items.findIndex(item => item.sku === sku);
  if (itemIndex === -1) throw new Error('Sản phẩm không tồn tại trong giỏ hàng.');

  // Kiểm tra tồn kho cho mức số lượng mới
  const inventory = await inventoryService.getStock(sku);
  const availableStock = inventory.stock - inventory.reserved;
  
  if (availableStock < quantity) {
    throw new Error(`Kho không đủ hàng. Sản phẩm này chỉ còn tối đa ${availableStock} chiếc.`);
  }

  // Cập nhật số lượng
  cart.items[itemIndex].quantity = quantity;
  
  // Tính tổng tiền & Lưu
  cart.totalPrice = calculateTotalPrice(cart.items);
  return cartDTO(await cart.save());
};

/**
 * Xóa một sản phẩm khỏi giỏ hàng
 * @param {String} userId - ID người dùng
 * @param {String} sku - Mã sản phẩm cần xóa
 * @returns {Object} - Giỏ hàng sau cập nhật
 */
exports.removeCartItem = async (userId, sku) => {
  const cart = await Cart.findOne({ userId });
  if (!cart) throw new Error('Không tìm thấy giỏ hàng.');

  // Lọc bỏ item có SKU trùng khớp
  cart.items = cart.items.filter(item => item.sku !== sku);
  
  // Tính tổng tiền & Lưu
  cart.totalPrice = calculateTotalPrice(cart.items);
  return cartDTO(await cart.save());
};

/**
 * Xóa toàn bộ giỏ hàng (Dùng sau khi thanh toán thành công)
 * @param {String} userId - ID người dùng
 */
exports.clearCart = async (userId) => {
  const cart = await Cart.findOne({ userId });
  if (!cart) throw new Error('Không tìm thấy giỏ hàng.');

  cart.items = [];
  cart.totalPrice = 0;
  
  return cartDTO(await cart.save());
};