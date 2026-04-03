const jwt = require('jsonwebtoken');
const User = require('../models/User');
const LoginLog = require('../models/LoginLog');


// Các hàm tiện ích
/**
 * Tạo JWT Token
 * @param {String} userId - ID của user
 * @returns {String} - Chuỗi token
 */
const generateToken = (userId) => {
  // Lấy secret key từ biến môi trường (Nên có dự phòng mặc định nếu thiếu)
  const secret = process.env.JWT_SECRET || 'glass_store_secret_2026';
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

  return jwt.sign({ id: userId }, secret, { expiresIn });
};


// Các hàm chính của service
/**
 * Đăng ký tài khoản mới
 * @param {Object} userData - Dữ liệu client gửi lên (name, email, password...)
 * @returns {Object} - Trả về user và token
 */
exports.registerUser = async (userData) => {
  // 1. Kiểm tra Business Rule: Email đã tồn tại chưa?
  const existingUser = await User.findOne({ email: userData.email });
  if (existingUser) {
    throw new Error('Email này đã được sử dụng. Vui lòng chọn email khác.');
  }

  // 2. Tạo User mới (Hook pre-save trong model User sẽ tự động Hash Password)
  const user = await User.create({
    name: userData.name,
    email: userData.email,
    password: userData.password,
    phone: userData.phone
  });

  // 3. Tạo Token để user có thể đăng nhập ngay sau khi đăng ký
  const token = generateToken(user._id);

  // Mongoose tự động gọi hàm toJSON() ẩn password trước khi trả về
  return { user, token };
};

/**
 * Đăng nhập hệ thống
 * @param {String} email 
 * @param {String} password 
 * @param {Object} clientInfo - Thông tin IP và User Agent để lưu Log
 * @returns {Object} - Trả về user và token
 */
exports.loginUser = async (email, password, clientInfo = {}) => {
  const { ipAddress, userAgent } = clientInfo;

  // 1. Kiểm tra Business Rule: Chống Brute-Force Attack
  const isAttacked = await LoginLog.isBruteForceAttack(email, 5, 15); // Sai 5 lần trong 15 phút
  if (isAttacked) {
    throw new Error('Tài khoản đã bị khóa tạm thời do đăng nhập sai quá nhiều lần. Vui lòng thử lại sau 15 phút.');
  }

  // 2. Tìm User trong Database
  const user = await User.findOne({ email });
  if (!user) {
    await LoginLog.recordLog({ email, ipAddress, userAgent, status: 'Failed', failureReason: 'Email không tồn tại' });
    throw new Error('Email hoặc mật khẩu không chính xác.');
  }

  // 3. Kiểm tra Business Rule: Trạng thái tài khoản
  if (!user.isActive) {
    await LoginLog.recordLog({ userId: user._id, email, ipAddress, userAgent, status: 'Failed', failureReason: 'Tài khoản bị khóa' });
    throw new Error('Tài khoản của bạn đã bị vô hiệu hóa bởi Quản trị viên.');
  }

  // 4. So sánh mật khẩu (Sử dụng Instance Method ở model)
  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    await LoginLog.recordLog({ userId: user._id, email, ipAddress, userAgent, status: 'Failed', failureReason: 'Sai mật khẩu' });
    throw new Error('Email hoặc mật khẩu không chính xác.');
  }

  // 5. Đăng nhập thành công -> Ghi Log và tạo Token
  await LoginLog.recordLog({ userId: user._id, email, ipAddress, userAgent, status: 'Success' });
  
  const token = generateToken(user._id);

  return { user, token };
};

/**
 * Lấy thông tin User hiện tại (Profile)
 * @param {String} userId 
 * @returns {Object} - Dữ liệu User
 */
exports.getUserProfile = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('Không tìm thấy thông tin người dùng.');
  }
  return user;
};