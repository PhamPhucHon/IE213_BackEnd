const mongoose = require('mongoose');
const User = require('../models/User');
const LoginLog = require('../models/LoginLog');
const PasswordResetToken = require('../models/PasswordResetToken');
const generateToken = require('../utils/generateToken');
const sendEmail = require('../utils/sendEmail');
const config = require('../config/env');
const { userDTO } = require('../utils/dto');
const { AppError } = require('../utils/asyncHandler');
const crypto = require('crypto');


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
    throw new AppError('Email này đã được sử dụng. Vui lòng chọn email khác.', 409);
  }

  // 2. Tạo User mới (Hook pre-save trong model User sẽ tự động Hash Password)
  const user = await User.create({
    name: userData.name,
    email: userData.email,
    password: userData.password,
    phone: userData.phone
  });

  // 3. Tạo Token để user có thể đăng nhập ngay sau khi đăng ký
  const token = generateToken(user._id.toString());

  return { user: userDTO(user), token };
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
    throw new AppError('Tài khoản đã bị khóa tạm thời do đăng nhập sai quá nhiều lần. Vui lòng thử lại sau 15 phút.', 429);
  }

  // 2. Tìm User trong Database
  const user = await User.findOne({ email });
  if (!user) {
    await LoginLog.recordLog({ email, ipAddress, userAgent, status: 'failed', failureReason: 'Email không tồn tại' });
    throw new AppError('Email hoặc mật khẩu không chính xác.', 401);
  }

  // 3. Kiểm tra Business Rule: Trạng thái tài khoản
  if (!user.isActive) {
    await LoginLog.recordLog({ userId: user._id, email, ipAddress, userAgent, status: 'failed', failureReason: 'Tài khoản bị khóa' });
    throw new AppError('Tài khoản của bạn đã bị vô hiệu hóa bởi Quản trị viên.', 403);
  }

  // 4. So sánh mật khẩu (Sử dụng Instance Method ở model)
  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    await LoginLog.recordLog({ userId: user._id, email, ipAddress, userAgent, status: 'failed', failureReason: 'Sai mật khẩu' });
    throw new AppError('Email hoặc mật khẩu không chính xác.', 401);
  }

  // 5. Đăng nhập thành công -> Ghi Log và tạo Token
  await LoginLog.recordLog({ userId: user._id, email, ipAddress, userAgent, status: 'success' });
  
  const token = generateToken(user._id.toString());

  return { user: userDTO(user), token };
};

/**
 * Lấy thông tin User hiện tại (Profile)
 * @param {String} userId 
 * @returns {Object} - Dữ liệu User
 */
exports.getUserProfile = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('Không tìm thấy thông tin người dùng.', 404);
  }
  return userDTO(user);
};

const buildResetPasswordLink = (token) => {
  const resetUrl = new URL('/reset-password', config.clientUrl);
  resetUrl.searchParams.set('token', token);
  return resetUrl.toString();
};

const buildResetPasswordEmail = (resetLink) => ({
  subject: 'Yêu cầu đặt lại mật khẩu',
  message: [
    'Ban vua yeu cau dat lai mat khau cho tai khoan Glass Store.',
    `Lien ket dat lai mat khau: ${resetLink}`,
    `Lien ket nay se het han sau ${config.resetPasswordTokenExpireMinutes} phut.`,
    'Neu ban khong thuc hien yeu cau nay, vui long bo qua email nay.',
  ].join('\n'),
  html: `
    <div style="margin:0;padding:32px 16px;background:#f3f6fb;font-family:'Helvetica Neue',Arial,sans-serif;color:#1f2937;">
      <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #dbe4f0;border-radius:20px;overflow:hidden;box-shadow:0 18px 50px rgba(15,23,42,0.08);">
        <div style="padding:28px 32px;background:linear-gradient(135deg,#0f766e,#164e63);color:#ffffff;">
          <p style="margin:0 0 8px;font-size:13px;letter-spacing:1.6px;text-transform:uppercase;opacity:0.8;">Glass Store</p>
          <h1 style="margin:0;font-size:28px;line-height:1.2;">Dat lai mat khau</h1>
          <p style="margin:12px 0 0;font-size:15px;line-height:1.7;opacity:0.92;">Chung toi da nhan duoc yeu cau dat lai mat khau cho tai khoan cua ban.</p>
        </div>
        <div style="padding:32px;">
          <p style="margin:0 0 16px;font-size:15px;line-height:1.75;">Nhan vao nut ben duoi de dat lai mat khau. Vi bao mat, lien ket nay chi co hieu luc trong <strong>${config.resetPasswordTokenExpireMinutes} phut</strong>.</p>
          <div style="margin:28px 0;">
            <a href="${resetLink}" style="display:inline-block;padding:14px 24px;border-radius:999px;background:#0f766e;color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;">Dat lai mat khau</a>
          </div>
          <p style="margin:0 0 12px;font-size:14px;line-height:1.75;color:#475569;">Neu nut khong hoat dong, hay copy lien ket sau vao trinh duyet:</p>
          <p style="margin:0;padding:14px 16px;background:#f8fafc;border:1px dashed #cbd5e1;border-radius:12px;word-break:break-all;font-size:13px;line-height:1.7;color:#0f172a;">${resetLink}</p>
          <p style="margin:24px 0 0;font-size:14px;line-height:1.75;color:#64748b;">Neu ban khong yeu cau doi mat khau, co the bo qua email nay. Mat khau hien tai cua ban se khong bi thay doi.</p>
        </div>
      </div>
    </div>
  `,
});

exports.requestPasswordReset = async (email) => {
  const normalizedEmail = String(email).trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    return;
  }

  if (user.isAdmin) {
    throw new AppError('Tai khoan admin khong duoc phep su dung tinh nang quen mat khau.', 403);
  }

  await PasswordResetToken.deleteMany({ email: normalizedEmail });

  const rawToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expiresAt = new Date(Date.now() + config.resetPasswordTokenExpireMinutes * 60 * 1000);

  await PasswordResetToken.create({
    email: normalizedEmail,
    token: hashedToken,
    expiresAt,
  });

  const resetLink = buildResetPasswordLink(rawToken);
  const emailContent = buildResetPasswordEmail(resetLink);

  try {
    await sendEmail({ email: normalizedEmail, ...emailContent });
  } catch (error) {
    await PasswordResetToken.deleteMany({ email: normalizedEmail });
    throw new AppError('Không thể gửi email đặt lại mật khẩu lúc này.', 500);
  }
};

exports.resetPassword = async (token, newPassword) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const hashedToken = crypto.createHash('sha256').update(String(token)).digest('hex');
    const tokenDoc = await PasswordResetToken.findOne({
      token: hashedToken,
      expiresAt: { $gt: new Date() },
    }).session(session);

    if (!tokenDoc) {
      throw new AppError('Token đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.', 400);
    }

    const user = await User.findOne({ email: tokenDoc.email, isAdmin: false }).session(session);
    if (!user) {
      await PasswordResetToken.deleteMany({ email: tokenDoc.email }, { session });
      throw new AppError('Token đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.', 400);
    }

    user.password = newPassword;
    await user.save({ session });
    await PasswordResetToken.deleteMany({ email: tokenDoc.email }, { session });

    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};