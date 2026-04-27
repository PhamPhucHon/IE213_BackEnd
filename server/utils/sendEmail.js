const nodemailer = require('nodemailer');
const config = require('../config/env');
const logger = require('../config/logger').child({ component: 'email' });

// Tạo transporter một lần và tái sử dụng (connection pool)
let transporter = null;

const getTransporter = () => {
  if (!transporter) {
    const { host, port, secure, user, pass } = config.email;
    if (!host || !port || !user || !pass) {
      throw new Error('Cấu hình email thiếu thông tin SMTP');
    }
    transporter = nodemailer.createTransport({
      host,
      port: Number(port),
      secure: secure === true, // true cho port 465, false cho 587
      auth: { user, pass },
      // Tối ưu kết nối
      pool: true,
      maxConnections: 5,
    });
  }
  return transporter;
};

/**
 * Hàm gửi email với kiểm tra đầu vào và xử lý lỗi đầy đủ
 * @param {Object} options - Tùy chọn cấu hình email
 * @param {String} options.email - Email người nhận (bắt buộc)
 * @param {String} options.subject - Tiêu đề email (bắt buộc)
 * @param {String} [options.message] - Nội dung chữ thuần (text)
 * @param {String} [options.html] - Nội dung HTML
 * @param {Array} [options.attachments] - File đính kèm (tùy chọn)
 * @returns {Promise<Object>} Kết quả gửi mail
 * @throws {Error} Nếu thiếu thông tin bắt buộc hoặc gửi thất bại
 */
const sendEmail = async (options) => {
  // Kiểm tra đầu vào
  if (!options || typeof options !== 'object') {
    throw new Error('Tham số options phải là object');
  }
  if (!options.email || typeof options.email !== 'string') {
    throw new Error('Email người nhận (options.email) là bắt buộc');
  }
  // Regex kiểm tra email đơn giản
  const emailRegex = /^[^\s@]+@([^\s@.,]+\.)+[^\s@.,]{2,}$/;
  if (!emailRegex.test(options.email)) {
    throw new Error('Định dạng email người nhận không hợp lệ');
  }
  if (!options.subject || typeof options.subject !== 'string') {
    throw new Error('Tiêu đề email (options.subject) là bắt buộc');
  }
  if (!options.message && !options.html) {
    throw new Error('Phải cung cấp ít nhất nội dung text (message) hoặc HTML (html)');
  }

  const fromName = config.email.fromName || 'Glass Store';
  const fromEmail = config.email.user;
  const mailOptions = {
    from: `"${fromName}" <${fromEmail}>`,
    to: options.email,
    subject: options.subject,
    text: options.message || '',
    html: options.html || '',
    attachments: options.attachments || [],
  };

  try {
    const transporter = getTransporter();
    const info = await transporter.sendMail(mailOptions);
    logger.info('Email sent successfully', {
      recipient: options.email,
      messageId: info.messageId,
      subject: options.subject,
    });
    return info;
  } catch (error) {
    logger.error('Email delivery failed', {
      recipient: options.email,
      subject: options.subject,
      error: error.message,
    });
    // Throw lỗi rõ ràng để nơi gọi xử lý
    throw new Error(`Không thể gửi email: ${error.message}`);
  }
};

module.exports = sendEmail;