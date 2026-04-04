const mongoose = require('mongoose');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const inventoryService = require('./inventoryService');

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
    // Ưu tiên tìm theo userId để đảm bảo bảo mật (chắc chắn đây là giỏ của user này)
    const cart = await Cart.findOne({ userId }).session(session);
    if (!cart || cart.items.length === 0) {
      throw new Error('Giỏ hàng trống. Không thể tạo đơn hàng.');
    }

    // 2. Giữ hàng trong kho (Reserve Stock) cho từng sản phẩm
    // Lặp qua từng item trong giỏ và gọi inventoryService (đã có cơ chế chống Overselling)
    for (const item of cart.items) {
      await inventoryService.reserveStock(item.sku, item.quantity, session);
    }

    // 3. Tính toán chi phí
    const itemsPrice = cart.totalPrice;
    const shippingPrice = itemsPrice > 1000000 ? 0 : 30000; // Freeship cho đơn > 1 triệu (Logic ví dụ)
    const totalPrice = itemsPrice + shippingPrice;

    // 4. Tạo mã đơn hàng thân thiện (VD: ORD-20260404-XYZ1)
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
    const orderNumber = `ORD-${dateStr}-${randomStr}`;

    // 5. Tạo Document Order
    const [newOrder] = await Order.create([{
      orderNumber,
      userId,
      items: cart.items, // Snapshot lại toàn bộ thông tin sản phẩm lúc mua
      shippingAddress,
      paymentMethod,
      itemsPrice,
      shippingPrice,
      totalPrice,
      status: 'Pending',
      isPaid: false
    }], { session });

    // 6. Xóa giỏ hàng sau khi tạo đơn thành công
    cart.items = [];
    cart.totalPrice = 0;
    await cart.save({ session });

    // 7. Hoàn tất Transaction
    await session.commitTransaction();
    session.endSession();

    return newOrder;
  } catch (error) {
    // Nếu có bất kỳ lỗi nào (Hết hàng, lỗi DB...), Rollback toàn bộ!
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
    orders,
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
    throw new Error('Không tìm thấy đơn hàng.');
  }

  // Kiểm tra quyền: Chỉ chủ nhân đơn hàng hoặc admin mới được xem
  // (Nếu gọi từ Admin Controller thì bỏ qua check này bằng cách truyền userId = null hoặc xử lý ở middleware)
  if (userId && order.userId._id.toString() !== userId.toString()) {
    throw new Error('Bạn không có quyền xem đơn hàng này.');
  }

  return order;
};

/**
 * Hủy đơn hàng (Chỉ cho phép khi đơn chưa xử lý) & Giải phóng tồn kho
 */
exports.cancelOrder = async (orderId, userId) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const order = await Order.findById(orderId).session(session);
    
    if (!order) throw new Error('Không tìm thấy đơn hàng.');
    if (order.userId.toString() !== userId.toString()) {
      throw new Error('Bạn không có quyền hủy đơn hàng này.');
    }

    // Chỉ cho phép hủy khi đang Pending hoặc Processing
    if (['Shipped', 'Delivered', 'Cancelled'].includes(order.status)) {
      throw new Error(`Không thể hủy đơn hàng đang ở trạng thái: ${order.status}`);
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

    return order;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

/**
 * Cập nhật trạng thái đơn hàng (Dành riêng cho Admin)
 * @param {String} orderId 
 * @param {String} status - Trạng thái mới
 * @param {Boolean} adminOnly - Cờ đánh dấu quyền admin
 */
exports.updateOrderStatus = async (orderId, status, adminOnly = true) => {
  if (!adminOnly) throw new Error('Không có quyền thực hiện thao tác này.');

  const order = await Order.findById(orderId);
  if (!order) throw new Error('Không tìm thấy đơn hàng.');

  // Ngăn chặn việc chuyển trạng thái nếu đơn đã bị hủy
  if (order.status === 'Cancelled') {
    throw new Error('Không thể cập nhật trạng thái cho đơn hàng đã bị hủy.');
  }

  // Nếu chuyển sang Đã giao (Delivered)
  if (status === 'Delivered') {
    order.deliveredAt = Date.now();
    order.isPaid = true; // Thường giao xong là đã thu tiền (COD)
    order.paidAt = order.paidAt || Date.now();

    // Xuất kho vĩnh viễn (Trừ thẳng vào trường reserved)
    for (const item of order.items) {
      await inventoryService.confirmStock(item.sku, item.quantity);
    }
  }

  // Nếu Admin chủ động hủy đơn (Ví dụ: Khách boom hàng)
  if (status === 'Cancelled') {
    for (const item of order.items) {
      // Phải bọc try-catch vì lỡ hàng đã confirm rồi thì không release được nữa
      try {
        await inventoryService.releaseStock(item.sku, item.quantity);
      } catch (err) {
        console.error(`Lỗi nhả kho khi admin hủy đơn ${orderId}:`, err.message);
      }
    }
  }

  order.status = status;
  return await order.save();
};