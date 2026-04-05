const Inventory = require('../models/Inventory');
const { inventoryDTO } = require('../utils/dto');

/**
 * Lấy thông tin tồn kho của một SKU
 * @param {String} sku - Mã SKU của biến thể sản phẩm
 * @returns {Object} - Dữ liệu tồn kho (stock, reserved...)
 */
exports.getStock = async (sku) => {
  const inventory = await Inventory.findOne({ sku }).populate('productId', 'name slug');
  if (!inventory) {
    throw new Error(`Không tìm thấy thông tin tồn kho cho SKU: ${sku}`);
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
  if (quantity <= 0) throw new Error('Số lượng giữ hàng phải lớn hơn 0');

  // Atomic Update: Chỉ tìm thấy và update nếu stock hiện tại >= số lượng khách muốn mua
  const inventory = await Inventory.findOneAndUpdate(
    { 
      sku: sku, 
      stock: { $gte: quantity } // Cực kỳ quan trọng: Đảm bảo tồn kho đủ bán
    },
    { 
      $inc: {       
        reserved: +quantity     // Cộng vào kho ảo (hàng chờ thanh toán/xử lý)
      } 
    },
    { new: true, session }
  );

  // Nếu inventory trả về null -> Hoặc sai SKU, hoặc đã HẾT HÀNG
  if (!inventory) {
    // Để báo lỗi chi tiết hơn, ta tìm thử xem SKU có tồn tại không
    const checkSku = await Inventory.findOne({ sku }).session(session);
    if (!checkSku) throw new Error(`SKU ${sku} không tồn tại trong kho.`);
    throw new Error(`Sản phẩm (SKU: ${sku}) không đủ số lượng tồn kho. (Chỉ còn ${checkSku.stock})`);
  }

  return inventory;
};

/**
 * Giải phóng hàng (Dùng khi đơn hàng bị Hủy hoặc Quá hạn thanh toán)
 * Trả lại số lượng từ hàng giữ chỗ (reserved) về lại kho thực tế (stock)
 * @param {String} sku - Mã SKU
 * @param {Number} quantity - Số lượng cần nhả
 * @param {Object} session - (Tùy chọn) Transaction Session
 */
exports.releaseStock = async (sku, quantity, session = null) => {
  if (quantity <= 0) throw new Error('Số lượng giải phóng phải lớn hơn 0');

  // Atomic Update: Chỉ nhả kho nếu số lượng reserved >= số lượng cần nhả
  const inventory = await Inventory.findOneAndUpdate(
    { 
      sku: sku,
      reserved: { $gte: quantity } // Đảm bảo không bị trừ âm trường reserved
    },
    { 
      $inc: { 
        stock: quantity,       // Cộng trả lại kho thực tế
        reserved: -quantity    // Trừ đi ở kho ảo
      } 
    },
    { new: true, session }
  );

  if (!inventory) {
    throw new Error(`Lỗi hệ thống kho: Không thể giải phóng ${quantity} sản phẩm cho SKU ${sku}. Số lượng giữ chỗ hiện tại không đủ.`);
  }

  return inventory;
};

/**
 * Xác nhận đã bán (Dùng khi đơn hàng giao thành công hoặc Đã thanh toán)
 * Lúc này hàng thực sự biến mất khỏi hệ thống, ta chỉ cần trừ đi ở trường reserved
 * (Vì trường stock đã được trừ ở bước reserveStock rồi)
 * @param {String} sku - Mã SKU
 * @param {Number} quantity - Số lượng đã bán
 * @param {Object} session - (Tùy chọn) Transaction Session
 */
exports.confirmStock = async (sku, quantity, session = null) => {
  if (quantity <= 0) throw new Error('Số lượng xác nhận bán phải lớn hơn 0');

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
    throw new Error(`Lỗi xuất kho: Không tìm thấy dữ liệu giữ chỗ hợp lệ cho SKU ${sku} với số lượng ${quantity}.`);
  }

  return inventory;
};

/**
 * Cập nhật trực tiếp số lượng tồn kho (Dành riêng cho Admin lúc kiểm kho / nhập kho)
 * @param {String} sku - Mã SKU
 * @param {Number} newStock - Tổng số lượng tồn kho mới thực tế trong kho
 */
exports.updateStock = async (sku, newStock) => {
  if (newStock < 0) throw new Error('Số lượng tồn kho không được âm');

  const inventory = await Inventory.findOneAndUpdate(
    { sku: sku },
    { 
      $set: { 
        stock: newStock,
        lastRestocked: Date.now() // Cập nhật thời gian nhập/sửa hàng mới nhất
      } 
    },
    { new: true }
  );

  if (!inventory) {
    throw new Error(`Không tìm thấy SKU ${sku} để cập nhật.`);
  }

  return inventoryDTO(inventory);
};