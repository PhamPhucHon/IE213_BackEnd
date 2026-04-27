const mongoose = require('mongoose');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const inventoryService = require('./inventoryService');
const logger = require('../config/logger').child({ component: 'order-service' });
const { orderDTO } = require('../utils/dto');
const { AppError } = require('../utils/asyncHandler');

/**
 * Lấy danh sách đơn hàng cho Admin (Có phân trang + lọc trạng thái)
 */
exports.getAllOrders = async (page = 1, limit = 10, status) => {
  const skip = (page - 1) * limit;
  const query = {};

  if (status) {
    query.status = status;
  }

  const [orders, totalOrders] = await Promise.all([
    Order.find(query)
      .populate('userId', 'name email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Order.countDocuments(query),
  ]);

  return {
    orders,
    pagination: {
      totalOrders,
      currentPage: Number(page),
      totalPages: Math.ceil(totalOrders / limit),
      limit: Number(limit),
    },
  };
};

/**
 * Tạo đơn hàng mới từ giỏ hàng hiện tại (Transaction)
 * @param {String} userId - ID người dùng
 * @param {Object} shippingAddress - Địa chỉ giao hàng
 * @param {String} paymentMethod - Phương thức thanh toán (COD, Momo, BankTransfer)
 */
exports.createOrder = async (userId, shippingAddress, paymentMethod) => {
  // Khởi tạo Transaction để đảm bảo tính nguyên tử (Hoặc thành công hết, hoặc rollback hết)
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Lấy giỏ hàng và kiểm tra
    const cart = await Cart.findOne({ userId }).session(session);
    if (!cart || cart.items.length === 0) {
      throw new AppError('Giỏ hàng trống. Không thể tạo đơn hàng.', 400);
    }

    // 2. Re-validate từng item: kiểm tra sản phẩm còn active, cập nhật giá mới nhất
    const validatedItems = [];
    for (const item of cart.items) {
      const product = await Product.findOne({
        _id: item.productId,
        isActive: true,
        'variants.sku': item.sku,
      }).session(session);

      if (!product) {
        throw new AppError(
          `Sản phẩm "${item.name}" (SKU: ${item.sku}) không còn tồn tại hoặc đã ngừng kinh doanh. Vui lòng xóa khỏi giỏ hàng.`,
          409
        );
      }

      const variant = product.variants.find(v => v.sku === item.sku);
      if (!variant) {
        throw new AppError(`Biến thể SKU ${item.sku} không còn tồn tại. Vui lòng cập nhật giỏ hàng.`, 409);
      }

      // Cập nhật giá mới nhất từ database (chống giá cũ snapshot)
      validatedItems.push({
        productId: product._id,
        sku: item.sku,
        name: `${product.name} - ${variant.color}`,
        image: variant.images?.[0] || product.images?.[0] || '',
        price: variant.price, // Giá hiện tại, không phải giá lúc thêm vào giỏ
        quantity: item.quantity,
      });
    }

    // 3. Giữ hàng trong kho (Reserve Stock) — báo rõ item nào hết hàng
    for (const item of validatedItems) {
      try {
        await inventoryService.reserveStock(item.sku, item.quantity, session);
      } catch (err) {
        // Ném lại lỗi với thông tin item cụ thể
        throw new AppError(
          `Không thể đặt hàng: Sản phẩm "${item.name}" (SKU: ${item.sku}) ${err.message}`,
          409
        );
      }
    }

    // 4. Tính toán chi phí (dùng giá đã re-validate)
    const itemsPrice = validatedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const shippingPrice = itemsPrice > 1000000 ? 0 : 30000;
    const totalPrice = itemsPrice + shippingPrice;

    // 5. Tạo mã đơn hàng
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
    const orderNumber = `ORD-${dateStr}-${randomStr}`;

    // 6. Tạo Document Order (dùng validatedItems thay vì cart.items)
    const [newOrder] = await Order.create([{
      orderNumber,
      userId,
      items: validatedItems,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      shippingPrice,
      totalPrice,
      status: 'Pending',
      isPaid: false
    }], { session });

    // 7. Xóa giỏ hàng sau khi tạo đơn thành công
    cart.items = [];
    cart.totalPrice = 0;
    await cart.save({ session });

    // 8. Hoàn tất Transaction
    await session.commitTransaction();
    session.endSession();

    return orderDTO(newOrder);
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

/**
 * Lấy danh sách đơn hàng của một user (Có phân trang)
 */
exports.getUserOrders = async (userId, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;

  const [orders, totalOrders] = await Promise.all([
    Order.find({ userId })
      .sort({ createdAt: -1 }) // Mới nhất lên đầu
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Order.countDocuments({ userId })
  ]);

  return {
    orders: orders.map(orderDTO),
    pagination: {
      totalOrders,
      currentPage: Number(page),
      totalPages: Math.ceil(totalOrders / limit),
      limit: Number(limit)
    }
  };
};

/**
 * Xem chi tiết một đơn hàng (Kiểm tra quyền sở hữu)
 */
exports.getOrderById = async (orderId, userId) => {
  const order = await Order.findById(orderId).populate('userId', 'name email phone');
  
  if (!order) {
    throw new AppError('Không tìm thấy đơn hàng.', 404);
  }

  // Kiểm tra quyền: Chỉ chủ nhân đơn hàng hoặc admin mới được xem
  // (Nếu gọi từ Admin Controller thì bỏ qua check này bằng cách truyền userId = null hoặc xử lý ở middleware)
  if (userId && order.userId._id.toString() !== userId.toString()) {
    throw new AppError('Bạn không có quyền xem đơn hàng này.', 403);
  }

  return orderDTO(order);
};

/**
 * Hủy đơn hàng (Chỉ cho phép khi đơn chưa xử lý) & Giải phóng tồn kho
 */
exports.cancelOrder = async (orderId, userId) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const order = await Order.findById(orderId).session(session);
    
    if (!order) throw new AppError('Không tìm thấy đơn hàng.', 404);
    if (order.userId.toString() !== userId.toString()) {
      throw new AppError('Bạn không có quyền hủy đơn hàng này.', 403);
    }

    // Chỉ cho phép hủy khi đang Pending hoặc Processing
    if (['Shipped', 'Delivered', 'Cancelled'].includes(order.status)) {
      throw new AppError(`Không thể hủy đơn hàng đang ở trạng thái: ${order.status}`, 409);
    }

    // 1. Cập nhật trạng thái đơn
    order.status = 'Cancelled';
    order.note = order.note ? `${order.note} | Đã hủy bởi người dùng` : 'Đã hủy bởi người dùng';
    await order.save({ session });

    // 2. Giải phóng tồn kho (Nhả hàng về lại để người khác mua)
    for (const item of order.items) {
      await inventoryService.releaseStock(item.sku, item.quantity, session);
    }

    await session.commitTransaction();
    session.endSession();

    return orderDTO(order);
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

/**
 * Cập nhật trạng thái đơn hàng (Dành riêng cho Admin)
 * Có state machine validation + transaction cho inventory
 */

// Bản đồ chuyển trạng thái hợp lệ
const VALID_STATUS_TRANSITIONS = {
  Pending: ['Processing', 'Cancelled'],
  Processing: ['Shipped', 'Cancelled'],
  Shipped: ['Delivered', 'Cancelled'],
  Delivered: [],      // Không chuyển được nữa
  Cancelled: [],      // Không chuyển được nữa
};

exports.updateOrderStatus = async (orderId, status, adminOnly = true) => {
  if (!adminOnly) throw new AppError('Không có quyền thực hiện thao tác này.', 403);

  // Validate trạng thái mới có hợp lệ không
  const validStatuses = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
  if (!validStatuses.includes(status)) {
    throw new AppError(`Trạng thái "${status}" không hợp lệ. Chấp nhận: ${validStatuses.join(', ')}`, 400);
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const order = await Order.findById(orderId).session(session);
    if (!order) throw new AppError('Không tìm thấy đơn hàng.', 404);

    // Kiểm tra chuyển trạng thái hợp lệ (state machine)
    const allowedTransitions = VALID_STATUS_TRANSITIONS[order.status] || [];
    if (!allowedTransitions.includes(status)) {
      throw new AppError(
        `Không thể chuyển từ "${order.status}" sang "${status}". Chuyển đổi hợp lệ: ${allowedTransitions.join(', ') || 'không có'}.`,
        409
      );
    }

    // Nếu chuyển sang Đã giao (Delivered) → confirmStock trong transaction
    if (status === 'Delivered') {
      order.deliveredAt = Date.now();
      order.isPaid = true;
      order.paidAt = order.paidAt || Date.now();

      for (const item of order.items) {
        await inventoryService.confirmStock(item.sku, item.quantity, session);
      }
    }

    // Nếu Admin hủy đơn → releaseStock trong transaction
    if (status === 'Cancelled') {
      for (const item of order.items) {
        await inventoryService.releaseStock(item.sku, item.quantity, session);
      }
    }

    order.status = status;
    await order.save({ session });

    await session.commitTransaction();
    session.endSession();

    return orderDTO(order);
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

/**
 * Tự động hủy các đơn hàng Pending quá hạn & giải phóng tồn kho
 * @param {Number} expireMinutes - Số phút trước khi đơn Pending bị coi là quá hạn (mặc định 30)
 * @returns {Object} - Số đơn đã hủy
 */
exports.cancelExpiredOrders = async (expireMinutes = 30) => {
  const expireDate = new Date(Date.now() - expireMinutes * 60 * 1000);

  const expiredOrders = await Order.find({
    status: 'Pending',
    createdAt: { $lt: expireDate },
  });

  let cancelledCount = 0;

  for (const order of expiredOrders) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const freshOrder = await Order.findById(order._id).session(session);
      if (!freshOrder || freshOrder.status !== 'Pending') {
        await session.abortTransaction();
        session.endSession();
        continue;
      }

      for (const item of freshOrder.items) {
        await inventoryService.releaseStock(item.sku, item.quantity, session);
      }

      freshOrder.status = 'Cancelled';
      freshOrder.note = freshOrder.note
        ? `${freshOrder.note} | Tự động hủy do quá hạn ${expireMinutes} phút`
        : `Tự động hủy do quá hạn ${expireMinutes} phút`;
      await freshOrder.save({ session });

      await session.commitTransaction();
      session.endSession();
      cancelledCount++;
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      logger.error('Failed to cancel expired order', {
        orderId: order._id,
        error: err.message,
      });
    }
  }

  return { cancelledCount, checkedCount: expiredOrders.length };
};