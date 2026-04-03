// utils/hashPassword.js
const bcrypt = require('bcryptjs');

// Hàm băm mật khẩu
exports.hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

// Hàm so sánh mật khẩu
exports.comparePassword = async (enteredPassword, savedPassword) => {
  return await bcrypt.compare(enteredPassword, savedPassword);
};