/**
* Hàm slugify để chuyển đổi chuỗi thành định dạng slug
 * @param {String} text - Chuỗi cần chuyển đổi (VD: "Kính Râm Nữ 2026!")
 * @returns {String} - Chuỗi slug đã xử lý (VD: "kinh-ram-nu-2026")
 */
const slugify = (text) => {
  if (!text) return '';

  return text
    .toString()
    .toLowerCase() // Chuyển hết thành chữ thường
    .normalize('NFD') // Chuẩn hóa Unicode, tách dấu ra khỏi chữ cái
    .replace(/[\u0300-\u036f]/g, '') // Xóa toàn bộ các dấu (huyền, sắc, hỏi, ngã, nặng...)
    .replace(/[đĐ]/g, 'd') // Xử lý chữ đ/Đ của Tiếng Việt
    .replace(/[^a-z0-9\s-]/g, '') // Xóa các ký tự đặc biệt, chỉ giữ lại chữ cái, số, khoảng trắng và gạch ngang
    .replace(/\s+/g, '-') // Biến mọi khoảng trắng thành dấu gạch ngang
    .replace(/-+/g, '-') // Rút gọn các dấu gạch ngang liên tiếp thành 1 dấu duy nhất
    .replace(/^-+|-+$/g, ''); // Cắt bỏ dấu gạch ngang bị thừa ở đầu và cuối
};

module.exports = slugify;