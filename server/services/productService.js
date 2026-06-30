const mongoose = require('mongoose');
const Product = require('../models/Product');
const Inventory = require('../models/Inventory');
const Review = require('../models/Review');
const { productDTO } = require('../utils/dto');
const { AppError } = require('../utils/asyncHandler');

const emptyRatingStats = () => ({ avg: 0, count: 0 });

const normalizeRatingStats = (avgRating = 0, totalReviews = 0) => ({
  avg: Math.round((Number(avgRating) || 0) * 10) / 10,
  count: Number(totalReviews) || 0
});

const normalizeObjectId = (value) => {
  const rawValue = value?._id ?? value;
  if (!rawValue) return null;
  if (rawValue instanceof mongoose.Types.ObjectId) return rawValue;

  const stringValue = rawValue.toString();
  return mongoose.Types.ObjectId.isValid(stringValue)
    ? new mongoose.Types.ObjectId(stringValue)
    : null;
};

const getProductIdKey = (product) => {
  const rawId = product?._id ?? product;
  return rawId?.toString?.() ?? String(rawId ?? '');
};

const getRatingStatsByProductIds = async (productIds, session = null) => {
  const objectIdsByKey = new Map();

  productIds.forEach((productId) => {
    const objectId = normalizeObjectId(productId);
    if (objectId) objectIdsByKey.set(objectId.toString(), objectId);
  });

  const statsByProductId = new Map(
    Array.from(objectIdsByKey.keys()).map((key) => [key, emptyRatingStats()])
  );

  if (objectIdsByKey.size === 0) return statsByProductId;

  const aggregation = Review.aggregate([
    {
      $match: {
        productId: { $in: Array.from(objectIdsByKey.values()) },
        isApproved: true
      }
    },
    {
      $group: {
        _id: '$productId',
        avgRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 }
      }
    }
  ]);

  if (session && typeof aggregation?.session === 'function') {
    aggregation.session(session);
  }

  const statsRows = await aggregation;
  (statsRows ?? []).forEach((stats) => {
    statsByProductId.set(
      stats._id.toString(),
      normalizeRatingStats(stats.avgRating, stats.totalReviews)
    );
  });

  return statsByProductId;
};

const ratingsAreEqual = (currentRating, nextRating) => {
  const current = normalizeRatingStats(currentRating?.avg, currentRating?.count);
  return current.avg === nextRating.avg && current.count === nextRating.count;
};

const toPlainProduct = (product) => (
  typeof product?.toObject === 'function' ? product.toObject() : { ...product }
);

const mergeProductRating = (product, statsByProductId) => {
  const nextRating = statsByProductId.get(getProductIdKey(product)) ?? emptyRatingStats();
  return {
    ...toPlainProduct(product),
    rating: nextRating
  };
};

const syncRatingStatsForProducts = async (products, session = null) => {
  if (!Array.isArray(products) || products.length === 0) return [];

  const statsByProductId = await getRatingStatsByProductIds(products.map((product) => product._id), session);
  const operations = products.reduce((ops, product) => {
    const objectId = normalizeObjectId(product._id);
    const nextRating = statsByProductId.get(getProductIdKey(product)) ?? emptyRatingStats();

    if (objectId && !ratingsAreEqual(product.rating, nextRating)) {
      ops.push({
        updateOne: {
          filter: { _id: objectId },
          update: { $set: { rating: nextRating } }
        }
      });
    }

    return ops;
  }, []);

  if (operations.length > 0) {
    if (session) {
      await Product.bulkWrite(operations, { session });
    } else {
      await Product.bulkWrite(operations);
    }
  }

  return products.map((product) => mergeProductRating(product, statsByProductId));
};

const syncRatingStatsForQuery = async (query) => {
  const products = await Product.find(query)
    .select('_id rating')
    .lean();

  await syncRatingStatsForProducts(products);
};

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
  if (filters.type) {
    query.type = filters.type;
  }

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

  if (sort === 'topRated') {
    await syncRatingStatsForQuery(query);
  }

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
  const productsWithFreshRatings = await syncRatingStatsForProducts(products);

  return {
    products: productsWithFreshRatings.map(productDTO),
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
  const product = await Product.findOne({ _id: id, isActive: true }).populate('categoryId', 'name slug');
  if (!product) {
    throw new AppError('Không tìm thấy sản phẩm.', 404);
  }
  const [productWithFreshRating] = await syncRatingStatsForProducts([product]);
  return productDTO(productWithFreshRating);
};

// Lấy chi tiết sản phẩm theo Slug (Dùng cho trang chi tiết sản phẩm SEO)
exports.getProductBySlug = async (slug) => {
  const product = await Product.findOne({ slug, isActive: true })
                               .populate('categoryId', 'name slug')
                               .lean();
  if (!product) {
    throw new AppError('Không tìm thấy sản phẩm.', 404);
  }
  const [productWithFreshRating] = await syncRatingStatsForProducts([product]);
  return productDTO(productWithFreshRating);
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
  'name',
  'description',
  'brand',
  'categoryId',
  'variants',
  'images',
  'isActive',
  'type',
  'sale',
  'availability',
  'specifications'
];

exports.updateProduct = async (id, updateData) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const product = await Product.findById(id).session(session);
    if (!product) {
      throw new AppError('Không tìm thấy sản phẩm.', 404);
    }

    // Nếu có cập nhật variants → sync Inventory trong cùng transaction
    if (updateData.variants) {
      const oldSkus = product.variants.map(v => v.sku);
      const newSkus = updateData.variants.map(v => v.sku);
      const hasDuplicateSku = newSkus.some((sku, index) => newSkus.indexOf(sku) !== index);

      if (hasDuplicateSku) {
        throw new AppError('Có SKU bị trùng lặp trong danh sách biến thể.', 400);
      }

      // SKU bị xóa: kiểm tra reserved rồi xóa Inventory
      const removedSkus = oldSkus.filter(sku => !newSkus.includes(sku));
      if (removedSkus.length > 0) {
        const reservedItem = await Inventory.findOne({ sku: { $in: removedSkus }, reserved: { $gt: 0 } }).session(session);
        if (reservedItem) {
          throw new AppError(
            `Không thể xóa variant SKU ${reservedItem.sku}: đang có ${reservedItem.reserved} sản phẩm giữ chỗ trong đơn hàng.`,
            409
          );
        }
        await Inventory.deleteMany({ sku: { $in: removedSkus } }, { session });
      }

      // SKU mới thêm: tạo Inventory với stock=0
      const addedSkus = newSkus.filter(sku => !oldSkus.includes(sku));
      if (addedSkus.length > 0) {
        const existingInventory = await Inventory.findOne({ sku: { $in: addedSkus } }).session(session);
        if (existingInventory) {
          throw new AppError(`SKU ${existingInventory.sku} đã tồn tại trên hệ thống.`, 409);
        }

        const inventoryDocs = addedSkus.map(sku => ({
          sku,
          productId: product._id,
          stock: 0,
          reserved: 0,
        }));
        await Inventory.insertMany(inventoryDocs, { session });
      }
    }

    ALLOWED_PRODUCT_UPDATE_FIELDS.forEach((field) => {
      if (typeof updateData[field] !== 'undefined') {
        product[field] = updateData[field];
      }
    });

    const savedProduct = await product.save({ session });
    await session.commitTransaction();

    return productDTO(savedProduct);
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

// Ẩn sản phẩm (soft-delete: set isActive = false, không xóa khỏi DB để giữ lịch sử đơn hàng)
exports.deleteProduct = async (id) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const product = await Product.findById(id).session(session);
    if (!product) {
      throw new AppError('Không tìm thấy sản phẩm.', 404);
    }

    if (!product.isActive) {
      throw new AppError('Sản phẩm đã bị ẩn trước đó.', 409);
    }

    // Kiểm tra xem có inventory nào đang có hàng giữ chỗ (đơn Pending/Processing) không
    const skus = product.variants.map(v => v.sku);
    const reservedInventory = await Inventory.findOne({ sku: { $in: skus }, reserved: { $gt: 0 } }).session(session);
    if (reservedInventory) {
      throw new AppError(
        `Không thể ẩn sản phẩm: SKU ${reservedInventory.sku} đang có ${reservedInventory.reserved} sản phẩm giữ chỗ trong đơn hàng chưa hoàn tất.`,
        409
      );
    }

    product.isActive = false;
    await product.save({ session });

    await session.commitTransaction();

    return { message: 'Đã ẩn sản phẩm thành công.' };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

// Cập nhật lại thống kê đánh giá (Dùng sau khi có thay đổi về review)
exports.updateRatingStats = async (productId, session = null) => {
  const statsByProductId = await getRatingStatsByProductIds([productId], session);
  const update = {
    rating: statsByProductId.get(getProductIdKey(productId)) ?? emptyRatingStats()
  };

  if (session) {
    await Product.findByIdAndUpdate(productId, update, { session });
  } else {
    await Product.findByIdAndUpdate(productId, update);
  }

  return { message: 'Đã cập nhật lại thống kê đánh giá.' };
};
