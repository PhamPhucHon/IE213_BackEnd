// config/constants.js
module.exports = {
  // HTTP Status Codes
  HTTP_STATUS: {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    UNPROCESSABLE_ENTITY: 422,
    INTERNAL_SERVER_ERROR: 500,
  },

  // Thông báo chung
  MESSAGES: {
    SUCCESS: 'Thành công',
    ERROR: 'Đã xảy ra lỗi',
    NOT_FOUND: 'Không tìm thấy',
    UNAUTHORIZED: 'Chưa xác thực',
    FORBIDDEN: 'Không có quyền truy cập',
    VALIDATION_FAILED: 'Dữ liệu không hợp lệ',
    UNPROCESSABLE_ENTITY: 'Dữ liệu không thể xử lý',
  },

  // Phân trang mặc định
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 12,
    MAX_LIMIT: 100,
  },

  // Giới hạn kích thước ảnh (bytes)
  MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB

  // Các định dạng ảnh cho phép
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'],

  // Trạng thái đơn hàng
  ORDER_STATUS: {
    PENDING: 'Pending',
    PROCESSING: 'Processing',
    SHIPPED: 'Shipped',
    DELIVERED: 'Delivered',
    CANCELLED: 'Cancelled',
  },

  // Phương thức thanh toán
  PAYMENT_METHODS: {
    COD: 'COD',
    MOMO: 'Momo',
    BANK_TRANSFER: 'BankTransfer',
  },

  // Giới hạn số lượng đánh giá mỗi lần lấy
  REVIEW_LIMIT: 5,

  // Thời gian giữ hàng trong giỏ (giây)
  CART_RESERVE_TIME: 15 * 60, // 15 phút

  // Cấu hình JWT mặc định (có thể override bằng env)
  JWT: {
    SECRET: process.env.JWT_SECRET || 'default_secret_change_me',
    EXPIRE: process.env.JWT_EXPIRE || '30d',
  },

  // Vai trò người dùng
  ROLES: {
    USER: 'user',
    ADMIN: 'admin',
  },
};