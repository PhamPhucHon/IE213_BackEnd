const User = require('../models/User');

// ==========================================
// QUẢN LÝ THÔNG TIN CÁ NHÂN 
// ==========================================

// Lấy thông tin chi tiết của User 
exports.getUserProfile = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('Không tìm thấy thông tin người dùng.');
  }
  return user;
};


// Cập nhật thông tin cơ bản (Không bao gồm đổi mật khẩu hay email)
exports.updateUserProfile = async (userId, updateData) => {
  const user = await User.findById(userId);
  if (!user) throw new Error('Không tìm thấy người dùng.');

  // Chỉ cho phép cập nhật các trường an toàn
  if (updateData.name) user.name = updateData.name;
  if (updateData.phone) user.phone = updateData.phone;
  if (updateData.avatar) user.avatar = updateData.avatar;

  // Lấy ra thông tin đã cập nhật (Hook toJSON trong Model sẽ tự ẩn password)
  const updatedUser = await user.save();
  return updatedUser;
};

// Đổi mật khẩu 
exports.changeUserPassword = async (userId, currentPassword, newPassword) => {
  const user = await User.findById(userId);
  if (!user) throw new Error('Không tìm thấy người dùng.');

  // 1. Kiểm tra mật khẩu cũ có đúng không (Dùng instance method ở model User)
  const isMatch = await user.matchPassword(currentPassword);
  if (!isMatch) {
    throw new Error('Mật khẩu hiện tại không chính xác.');
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
  if (!user) throw new Error('Không tìm thấy người dùng.');

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
  if (!user) throw new Error('Không tìm thấy người dùng.');

  // Tìm địa chỉ cần sửa trong mảng
  const addressItem = user.addresses.id(addressId);
  if (!addressItem) throw new Error('Không tìm thấy địa chỉ này.');

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
  if (!user) throw new Error('Không tìm thấy người dùng.');

  const addressItem = user.addresses.id(addressId);
  if (!addressItem) throw new Error('Không tìm thấy địa chỉ này.');

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
  if (!user) throw new Error('Không tìm thấy người dùng.');

  const addressItem = user.addresses.id(addressId);
  if (!addressItem) throw new Error('Không tìm thấy địa chỉ này.');

  // Reset toàn bộ về false
  user.addresses.forEach(addr => {
    addr.isDefault = false;
  });

  // Set cái được chọn thành true
  addressItem.isDefault = true;

  await user.save();
  return user.addresses;
};