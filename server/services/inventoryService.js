const Inventory = require('../models/Inventory');
const { inventoryDTO } = require('../utils/dto');
const { AppError } = require('../utils/asyncHandler');

/**
 * Lấy thông tin tồn kho của một SKU
 * @param {String} sku - Mã SKU của biến thể sản phẩm
 * @returns {Object} - Dữ liệu tồn kho (stock, reserved...)
 */
exports.getStock = async (sku) => {
  const inventory = await Inventory.findOne({ sku }).populate('productId', 'name slug');
  if (!inventory) {
    throw new AppError(`Không tìm thấy thông tin tồn kho cho SKU: ${sku}`, 404);
  }
  return inventoryDTO(inventory);
};

/**
 * Giữ hàng (Dùng khi khách bấm Đặt hàng - Đơn ở trạng thái Pending)
 * SỬ DỤNG ATOMIC UPDATE ĐỂ CHỐNG OVERSELLING
 * @param {String} sku - Mã SKU
 * @param {Number} quantity - Số lượng cần giữ
 * @param {Object} session - (Tùy chọn) Mongoose Session dùng cho Transaction
 */
exports.reserveStock = async (sku, quantity, session = null) => {
  if (quantity <= 0) throw new AppError('Số lượng giữ hàng phải lớn hơn 0', 400);

  // Atomic Update: Chỉ giữ hàng nếu tồn khả dụng (stock - reserved) còn đủ.
  const inventory = await Inventory.findOneAndUpdate(
    {
      sku: sku,
      $expr: {
        $gte: [
          { $subtract: ['$stock', '$reserved'] },
          quantity,
        ],
      },
    },
    {
      $inc: {
        reserved: +quantity,
      },
    },
    { new: true, session }
  );

  // Nếu inventory trả về null -> Hoặc sai SKU, hoặc đã HẾT HÀNG
  if (!inventory) {
    // Để báo lỗi chi tiết hơn, ta tìm thử xem SKU có tồn tại không
    const checkSku = await Inventory.findOne({ sku }).session(session);
    if (!checkSku) throw new AppError(`SKU ${sku} không tồn tại trong kho.`, 404);
    const available = Math.max((checkSku.stock || 0) - (checkSku.reserved || 0), 0);
    throw new AppError(`Sản phẩm (SKU: ${sku}) không đủ số lượng tồn kho khả dụng. (Chỉ còn ${available})`, 409);
  }

  return inventory;
};

/**
 * Giải phóng hàng (Dùng khi đơn hàng bị Hủy hoặc Quá hạn thanh toán)
 * Trả lại số lượng từ hàng giữ chỗ (reserved) về lại tồn khả dụng
 * @param {String} sku - Mã SKU
 * @param {Number} quantity - Số lượng cần nhả
 * @param {Object} session - (Tùy chọn) Transaction Session
 */
exports.releaseStock = async (sku, quantity, session = null) => {
  if (quantity <= 0) throw new AppError('Số lượng giải phóng phải lớn hơn 0', 400);

  // Atomic Update: Chỉ nhả kho nếu số lượng reserved >= số lượng cần nhả
  const inventory = await Inventory.findOneAndUpdate(
    { 
      sku: sku,
      reserved: { $gte: quantity } // Đảm bảo không bị trừ âm trường reserved
    },
    {
      $inc: {
        reserved: -quantity,
      }
    },
    { new: true, session }
  );

  if (!inventory) {
    throw new AppError(`Lỗi hệ thống kho: Không thể giải phóng ${quantity} sản phẩm cho SKU ${sku}. Số lượng giữ chỗ hiện tại không đủ.`, 409);
  }

  return inventory;
};

/**
 * Xác nhận đã bán (Dùng khi đơn hàng giao thành công hoặc Đã thanh toán)
 * Lúc này hàng thực sự biến mất khỏi hệ thống:
 * - Trừ stock: kho thực giảm thật
 * - Trừ reserved: bỏ giữ chỗ đã tạo trước đó
 * @param {String} sku - Mã SKU
 * @param {Number} quantity - Số lượng đã bán
 * @param {Object} session - (Tùy chọn) Transaction Session
 */
exports.confirmStock = async (sku, quantity, session = null) => {
  if (quantity <= 0) throw new AppError('Số lượng xác nhận bán phải lớn hơn 0', 400);

  const inventory = await Inventory.findOneAndUpdate(
    { 
      sku: sku,
      reserved: { $gte: quantity } // Chỉ xuất khi có đủ hàng đang giữ chỗ
    },
    { 
      $inc: { 
        stock: -quantity,     
        reserved: -quantity // Trừ đi số lượng đang giữ chỗ (Hàng bay màu hoàn toàn)
      } 
    },
    { new: true, session }
  );

  if (!inventory) {
    throw new AppError(`Lỗi xuất kho: Không tìm thấy dữ liệu giữ chỗ hợp lệ cho SKU ${sku} với số lượng ${quantity}.`, 409);
  }

  return inventory;
};

/**
 * Cập nhật trực tiếp số lượng tồn kho (Dành riêng cho Admin lúc kiểm kho / nhập kho)
 * @param {String} sku - Mã SKU
 * @param {Number} newStock - Tổng số lượng tồn kho mới thực tế trong kho
 */
exports.updateStock = async (sku, newStock) => {
  if (newStock < 0) throw new AppError('Số lượng tồn kho không được âm', 400);

  const inventory = await Inventory.findOneAndUpdate(
    {
      sku: sku,
      reserved: { $lte: newStock },
    },
    {
      $set: {
        stock: newStock,
        lastRestocked: Date.now(), // Cập nhật thời gian nhập/sửa hàng mới nhất
      },
    },
    { new: true }
  );

  if (!inventory) {
    const existingInventory = await Inventory.findOne({ sku });
    if (!existingInventory) {
      throw new AppError(`Không tìm thấy SKU ${sku} để cập nhật.`, 404);
    }

    throw new AppError(
      `Không thể cập nhật stock=${newStock} vì đang có ${existingInventory.reserved} sản phẩm giữ chỗ.`,
      409
    );
  }

  return inventoryDTO(inventory);
};

exports.listInventory = async ({ productId, lowStock, page = 1, limit = 20 }) => {
  const query = {};

  if (productId) {
    query.productId = productId;
  }

  if (lowStock === 'true' || lowStock === true) {
    query.$expr = {
      $lt: [{ $subtract: ['$stock', '$reserved'] }, 10],
    };
  } else if (lowStock === 'false' || lowStock === false) {
    query.$expr = {
      $gte: [{ $subtract: ['$stock', '$reserved'] }, 10],
    };
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [inventories, total] = await Promise.all([
    Inventory.find(query)
      .populate('productId', 'name slug')
      .sort({ stock: 1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Inventory.countDocuments(query),
  ]);

  return {
    inventories: inventories.map(inventoryDTO),
    pagination: {
      totalInventories: total,
      currentPage: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
      limit: Number(limit),
    },
  };
};

exports.checkStock = async (sku, quantity) => {
  const inventory = await Inventory.findOne({ sku }).lean();
  if (!inventory) {
    throw new AppError(`Không tìm thấy thông tin tồn kho cho SKU: ${sku}`, 404);
  }

  const availableStock = (inventory.stock || 0) - (inventory.reserved || 0);

  return {
    sku,
    available: availableStock >= quantity,
    currentStock: inventory.stock,
    reserved: inventory.reserved,
    availableStock,
    requestedQuantity: quantity,
  };
};