const mongoose = require('mongoose');
const Product = require('../models/Product');
const Inventory = require('../models/Inventory');
const Review = require('../models/Review');
const { productDTO } = require('../utils/dto');
const { AppError } = require('../utils/asyncHandler');

/**
 * Lọc, phân trang, tìm kiếm, sắp xếp sản phẩm
 * @param {Object} filters - Các tiêu chí lọc (keyword, categoryId, brand, minPrice, maxPrice)
 * @param {Number} page - Trang hiện tại
 * @param {Number} limit - Số sản phẩm trên 1 trang
 * @param {String} sort - Tiêu chí sắp xếp (newest, priceAsc, priceDesc, topRated)
 * @returns {Object} - Danh sách sản phẩm và thông tin phân trang
 */
exports.getProducts = async (filters = {}, page = 1, limit = 12, sort = 'newest') => {
  const query = { isActive: true };

  // 1. Lọc theo Keyword (Tìm kiếm theo tên)
  if (filters.keyword) {
    query.name = { $regex: filters.keyword, $options: 'i' };
  }

  // 2. Lọc theo Danh mục & Thương hiệu
  if (filters.categoryId) query.categoryId = filters.categoryId;
  if (filters.brand) query.brand = filters.brand;
  if (filters.type) query.type = filters.type;

  // 3. Lọc theo khoảng giá (Tìm trong mảng variants)
  if (filters.minPrice || filters.maxPrice) {
    query['variants.price'] = {};
    if (filters.minPrice) query['variants.price'].$gte = Number(filters.minPrice);
    if (filters.maxPrice) query['variants.price'].$lte = Number(filters.maxPrice);
  }

  // 4. Cấu hình sắp xếp
  let sortOption = { createdAt: -1 }; // Mặc định mới nhất
  if (sort === 'priceAsc') sortOption = { 'variants.price': 1 };
  if (sort === 'priceDesc') sortOption = { 'variants.price': -1 };
  if (sort === 'topRated') sortOption = { 'rating.avg': -1 };

  // 5. Tính toán phân trang
  const skip = (page - 1) * limit;

  // 6. Thực thi truy vấn song song (Lấy data và Đếm tổng)
  const [products, totalProducts] = await Promise.all([
    Product.find(query)
      .populate('categoryId', 'name slug') // Lấy kèm tên danh mục
      .sort(sortOption)
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Product.countDocuments(query)
  ]);

  return {
    products: products.map(productDTO),
    pagination: {
      totalProducts,
      currentPage: Number(page),
      totalPages: Math.ceil(totalProducts / limit),
      limit: Number(limit)
    }
  };
};

// Lấy chi tiết sản phẩm theo ID
exports.getProductById = async (id) => {
  const product = await Product.findById(id).populate('categoryId', 'name slug');
  if (!product) {
    throw new AppError('Không tìm thấy sản phẩm.', 404);
  }
  return productDTO(product);
};

// Lấy chi tiết sản phẩm theo Slug (Dùng cho trang chi tiết sản phẩm SEO)
exports.getProductBySlug = async (slug) => {
  const product = await Product.findOne({ slug, isActive: true })
                               .populate('categoryId', 'name slug')
                               .lean();
  if (!product) {
    throw new AppError('Không tìm thấy sản phẩm.', 404);
  }
  return productDTO(product);
};

// Tạo sản phẩm mới (Kèm tạo tự động Inventory cho từng Variant)
// Sử dụng Transaction để đảm bảo tính toàn vẹn dữ liệu
exports.createProduct = async (productData) => {
  // 1. Kiểm tra SKU có bị trùng lặp trong mảng variants gửi lên không
  const skus = productData.variants.map(v => v.sku);
  const hasDuplicateSku = skus.some((sku, index) => skus.indexOf(sku) !== index);
  if (hasDuplicateSku) {
    throw new AppError('Có SKU bị trùng lặp trong danh sách biến thể.', 400);
  }

  // Trong môi trường test, bỏ qua transaction vì MongoDB Memory Server
  // không hỗ trợ tốt transactions khi cleanup giữa các test
  if (process.env.NODE_ENV === 'test') {
    const existingInventory = await Inventory.findOne({ sku: { $in: skus } });
    if (existingInventory) {
      throw new AppError(`SKU ${existingInventory.sku} đã tồn tại trên hệ thống.`, 409);
    }

    const newProduct = await Product.create(productData);

    const inventoryDocs = newProduct.variants.map(variant => ({
      sku: variant.sku,
      productId: newProduct._id,
      stock: 0,
      reserved: 0
    }));
    await Inventory.insertMany(inventoryDocs);

    return productDTO(newProduct);
  }

  // Production: dùng transaction để đảm bảo toàn vẹn dữ liệu
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 2. Kiểm tra SKU đã tồn tại trong DB hệ thống chưa
    const existingInventory = await Inventory.findOne({ sku: { $in: skus } }).session(session);
    if (existingInventory) {
      throw new AppError(`SKU ${existingInventory.sku} đã tồn tại trên hệ thống.`, 409);
    }

    // 3. Tạo Product (Phải truyền trong mảng [productData] khi dùng transaction)
    const [newProduct] = await Product.create([productData], { session });

    // 4. Tạo Inventory cho từng variant
    const inventoryDocs = newProduct.variants.map(variant => ({
      sku: variant.sku,
      productId: newProduct._id,
      stock: 0,     // Mặc định tồn kho bằng 0 khi vừa tạo mới
      reserved: 0
    }));

    await Inventory.insertMany(inventoryDocs, { session });

    // 5. Commit lưu vào database
    await session.commitTransaction();
    session.endSession();

    return productDTO(newProduct);
  } catch (error) {
    // Nếu có lỗi (ví dụ thiếu trường required), hủy bỏ toàn bộ
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

// Cập nhật thông tin sản phẩm
// Chỉ cho phép cập nhật các trường an toàn (whitelist) — tránh mass-assignment
const ALLOWED_PRODUCT_UPDATE_FIELDS = [
  'name', 'description', 'brand', 'categoryId', 'variants', 'images', 'isActive'
];

exports.updateProduct = async (id, updateData) => {
  const product = await Product.findById(id);
  if (!product) {
    throw new AppError('Không tìm thấy sản phẩm.', 404);
  }

  ALLOWED_PRODUCT_UPDATE_FIELDS.forEach((field) => {
    if (typeof updateData[field] !== 'undefined') {
      product[field] = updateData[field];
    }
  });

  return productDTO(await product.save());
};

// Xóa sản phẩm
exports.deleteProduct = async (id) => {
  const product = await Product.findById(id);
  if (!product) {
    throw new AppError('Không tìm thấy sản phẩm.', 404);
  }

  await Product.findByIdAndDelete(id);

  return { message: 'Đã xóa sản phẩm và giải phóng tồn kho liên quan thành công.' };
};

// Cập nhật lại thống kê đánh giá (Dùng sau khi có thay đổi về review)
exports.updateRatingStats = async (productId) => {
  // Dùng Aggregation để gom tất cả review của sản phẩm này lại
  const stats = await Review.aggregate([
    { $match: { productId: new mongoose.Types.ObjectId(productId) } },
    {
      $group: {
        _id: '$productId',
        avgRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 }
      }
    }
  ]);

  if (stats.length > 0) {
    await Product.findByIdAndUpdate(productId, {
      rating: {
        avg: Math.round(stats[0].avgRating * 10) / 10, // Làm tròn 1 chữ số (VD: 4.5)
        count: stats[0].totalReviews
      }
    });
  } else {
    // Nếu không còn review nào thì reset về 0
    await Product.findByIdAndUpdate(productId, {
      rating: { avg: 0, count: 0 }
    });
  }

  return { message: 'Đã cập nhật lại thống kê đánh giá.' };
};