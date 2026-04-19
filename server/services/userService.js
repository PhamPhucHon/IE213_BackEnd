const User = require('../models/User');
const { userDTO } = require('../utils/dto');
const { AppError } = require('../utils/asyncHandler');

// Lấy danh sách người dùng (phân trang) cho Admin
exports.getAllUsers = async (page = 1, limit = 10) => {
  const skip = (page - 1) * limit;

  const [users, totalUsers] = await Promise.all([
    User.find().select('-password').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    User.countDocuments(),
  ]);

  return {
    users,
    pagination: {
      totalUsers,
      currentPage: Number(page),
      totalPages: Math.ceil(totalUsers / limit),
      limit: Number(limit),
    },
  };
};

// ==========================================
// QUẢN LÝ THÔNG TIN CÁ NHÂN 
// ==========================================

// Lấy thông tin chi tiết của User 
exports.getUserProfile = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('Không tìm thấy thông tin người dùng.', 404);
  }
  return userDTO(user);
};

// Cập nhật thông tin cá nhân (Tên, Số điện thoại, Avatar)
exports.updateUserProfile = async (userId, updateData) => {
  const fieldsToUpdate = {};
  const allowedFields = ['name', 'phone', 'avatar'];

  for (const field of allowedFields) {
    if (Object.prototype.hasOwnProperty.call(updateData, field)) {
      fieldsToUpdate[field] = updateData[field];
    }
  }

  if (Object.keys(fieldsToUpdate).length === 0) {
    throw new AppError('Không có dữ liệu hợp lệ để cập nhật.', 400); //
  }

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { $set: fieldsToUpdate },
    { 
      new: true,           
      runValidators: true, 
      context: 'query'     
    }
  ).lean(); 

  if (!updatedUser) {
    throw new AppError('Không tìm thấy người dùng.', 404); //
  }

  return userDTO(updatedUser); //
};

// Đổi mật khẩu 
exports.changeUserPassword = async (userId, currentPassword, newPassword) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError('Không tìm thấy người dùng.', 404);

  // 1. Kiểm tra mật khẩu cũ có đúng không (Dùng instance method ở model User)
  const isMatch = await user.matchPassword(currentPassword);
  if (!isMatch) {
    throw new AppError('Mật khẩu hiện tại không chính xác.', 401);
  }

  // 2. Cập nhật mật khẩu mới (Mongoose Hook pre-save sẽ tự động Hash)
  user.password = newPassword;
  await user.save();

  return { message: 'Đổi mật khẩu thành công.' };
};


// ==========================================
// QUẢN LÝ SỔ ĐỊA CHỈ 
// ==========================================

// Thêm địa chỉ mới
exports.addAddress = async (userId, addressData) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError('Không tìm thấy người dùng.', 404);

  // Logic: Nếu địa chỉ mới được set là Mặc định, phải gỡ Mặc định của các địa chỉ cũ
  if (addressData.isDefault) {
    user.addresses.forEach(addr => {
      addr.isDefault = false;
    });
  } else if (user.addresses.length === 0) {
    // Nếu đây là địa chỉ đầu tiên được thêm, tự động cho nó làm mặc định
    addressData.isDefault = true;
  }

  user.addresses.push(addressData);
  await user.save();

  return user.addresses; // Trả về danh sách địa chỉ mới nhất
};

// Cập nhật một địa chỉ
exports.updateAddress = async (userId, addressId, addressData) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError('Không tìm thấy người dùng.', 404);

  // Tìm địa chỉ cần sửa trong mảng
  const addressItem = user.addresses.id(addressId);
  if (!addressItem) throw new AppError('Không tìm thấy địa chỉ này.', 404);

  // Logic: Nếu cập nhật thành Mặc định, gỡ mặc định các cái khác
  if (addressData.isDefault && !addressItem.isDefault) {
    user.addresses.forEach(addr => {
      addr.isDefault = false;
    });
  }

  // Cập nhật từng trường
  if (addressData.label) addressItem.label = addressData.label;
  if (addressData.address) addressItem.address = addressData.address;
  if (typeof addressData.isDefault !== 'undefined') addressItem.isDefault = addressData.isDefault;

  await user.save();
  return user.addresses;
};

// Xóa một địa chỉ
exports.deleteAddress = async (userId, addressId) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError('Không tìm thấy người dùng.', 404);

  const addressItem = user.addresses.id(addressId);
  if (!addressItem) throw new AppError('Không tìm thấy địa chỉ này.', 404);

  const wasDefault = addressItem.isDefault;

  // Xóa địa chỉ khỏi mảng
  user.addresses.pull(addressId);

  // Logic: Nếu vừa xóa địa chỉ mặc định, tự động đẩy địa chỉ đầu tiên còn lại lên làm mặc định
  if (wasDefault && user.addresses.length > 0) {
    user.addresses[0].isDefault = true;
  }

  await user.save();
  return user.addresses;
};

// Chuyển một địa chỉ thành Mặc định
exports.setDefaultAddress = async (userId, addressId) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError('Không tìm thấy người dùng.', 404);

  const addressItem = user.addresses.id(addressId);
  if (!addressItem) throw new AppError('Không tìm thấy địa chỉ này.', 404);

  // Reset toàn bộ về false
  user.addresses.forEach(addr => {
    addr.isDefault = false;
  });

  // Set cái được chọn thành true
  addressItem.isDefault = true;

  await user.save();
  return user.addresses;
};