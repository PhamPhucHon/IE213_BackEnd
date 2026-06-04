const Category = require('../models/Category');
const { categoryDTO } = require('../utils/dto');
const { AppError } = require('../utils/asyncHandler');

/**
 * Lấy danh sách toàn bộ danh mục (Dùng cho Admin và trang chủ)
 * @returns {Array} - Mảng danh sách danh mục
 */
exports.getAllCategories = async () => {
  const categories = await Category.find({ isActive: true })
                                   .sort({ order: 1 })
                                   .lean();
  return categories.map(categoryDTO);
};

/**
 * Lấy chi tiết một danh mục theo ID
 * @param {String} id - ID của danh mục
 * @returns {Object} - Dữ liệu danh mục
 */
exports.getCategoryById = async (id) => {
  const category = await Category.findOne({ _id: id, isActive: true });
  if (!category) {
    throw new AppError('Không tìm thấy danh mục với ID này.', 404);
  }
  return categoryDTO(category);
};

/**
 * [Hàm bổ sung] Lấy chi tiết một danh mục theo Slug (Phục vụ SEO và Frontend)
 * @param {String} slug - Slug của danh mục
 * @returns {Object} - Dữ liệu danh mục
 */
exports.getCategoryBySlug = async (slug) => {
  const category = await Category.findOne({ slug, isActive: true });
  if (!category) {
    throw new AppError('Không tìm thấy danh mục.', 404);
  }
  return categoryDTO(category);
};

/**
 * Tạo danh mục mới
 * @param {Object} data - Dữ liệu danh mục 
 * @returns {Object} - Danh mục vừa được tạo
 */
exports.createCategory = async (data) => {
  const existingCategory = await Category.findOne({ name: data.name });
  if (existingCategory) {
    throw new AppError('Tên danh mục này đã tồn tại. Vui lòng chọn tên khác.', 409);
  }

  const latestCategory = await Category.findOne({})
    .sort({ order: -1 })
    .select('order')
    .lean();
  const latestOrder = Number(latestCategory?.order);
  const nextOrder = Number.isFinite(latestOrder) ? latestOrder + 1 : 1;
  const categoryData = { ...data };
  delete categoryData.order;

  // Tạo mới (Trường Slug sẽ được Model tự động sinh ra nhờ Hook pre-validate)
  const newCategory = await Category.create({ ...categoryData, order: nextOrder });
  return categoryDTO(newCategory);
};

/**
 * Cập nhật danh mục
 * @param {String} id - ID của danh mục cần sửa
 * @param {Object} data - Dữ liệu cập nhật
 * @returns {Object} - Danh mục sau khi cập nhật
 */
exports.updateCategory = async (id, data) => {
  const category = await Category.findById(id);
  if (!category) {
    throw new AppError('Không tìm thấy danh mục.', 404);
  }

  // Kiểm tra trùng lặp tên nếu admin có gửi lên yêu cầu đổi tên
  if (data.name && data.name !== category.name) {
    const existingName = await Category.findOne({ name: data.name });
    if (existingName) {
      throw new AppError('Tên danh mục này đã được sử dụng.', 409);
    }
    category.name = data.name; 
    // Ghi chú: Nếu đổi tên, Slug cũ vẫn giữ nguyên để không làm hỏng URL SEO (Best Practice).
  }

  // Cập nhật các trường còn lại nếu có truyền lên
  if (typeof data.description !== 'undefined') category.description = data.description;
  if (typeof data.image !== 'undefined') category.image = data.image;
  if (typeof data.isActive !== 'undefined') category.isActive = data.isActive;
  if (typeof data.order !== 'undefined') category.order = data.order;

  return categoryDTO(await category.save());
};

/**
 * Xóa danh mục (Kiểm tra ràng buộc kỹ lưỡng)
 * @param {String} id - ID của danh mục cần xóa
 * @returns {Object} - Thông báo thành công
 */
exports.deleteCategory = async (id) => {
  const category = await Category.findById(id);
  if (!category) {
    throw new AppError('Không tìm thấy danh mục.', 404);
  }

  // Thực hiện lệnh xóa
  // LƯU Ý KỸ THUẬT: Khi gọi lệnh này, Hook pre('findOneAndDelete') ở file Model Category 
  // sẽ được Mongoose kích hoạt ngầm để đếm xem có Sản phẩm (Product) nào đang dùng danh mục này không.
  // Nếu có, Model sẽ chủ động ném ra lỗi (throw Error) và lệnh xóa này sẽ bị chặn đứng an toàn.
  await Category.findByIdAndDelete(id);

  return { message: 'Đã xóa danh mục thành công.' };
};
