/**
 * utils/dto.js
 * Data Transfer Objects — định nghĩa cấu trúc dữ liệu được phép trả về từ Service.
 * Mục đích:
 *   - Bảo mật: không bao giờ để lộ password, likedBy,...
 *   - Nhất quán: shape của response luôn có thể dự đoán trước
 *   - Defense-in-depth: hoạt động đúng kể cả khi dùng .lean() (không có toJSON hook)
 */

/**
 * Chuẩn hóa document Mongoose hoặc plain object thành plain JS object
 */
const toPlain = (doc) => {
  if (!doc) return null;
  return typeof doc.toObject === 'function' ? doc.toObject() : { ...doc };
};

// ─────────────────────────────────────────
// USER DTO
// Loại bỏ: password, __v
// ─────────────────────────────────────────
const userDTO = (user) => {
  const obj = toPlain(user);
  if (!obj) return null;

  return {
    _id: obj._id,
    name: obj.name,
    email: obj.email,
    avatar: obj.avatar,
    phone: obj.phone,
    isAdmin: obj.isAdmin,
    isActive: obj.isActive,
    addresses: obj.addresses ?? [],
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt,
  };
};

// ─────────────────────────────────────────
// CATEGORY DTO
// ─────────────────────────────────────────
const categoryDTO = (category) => {
  const obj = toPlain(category);
  if (!obj) return null;

  return {
    _id: obj._id,
    name: obj.name,
    slug: obj.slug,
    description: obj.description,
    image: obj.image,
    isActive: obj.isActive,
    order: obj.order,
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt,
  };
};

// ─────────────────────────────────────────
// PRODUCT DTO
// Bao gồm đầy đủ: variants (giá, màu, size, ảnh biến thể),
// specifications, sale, availability, type
// ─────────────────────────────────────────
const variantDTO = (variant) => {
  if (!variant) return null;
  return {
    _id: variant._id,
    sku: variant.sku,
    color: variant.color,
    size: variant.size,
    price: variant.price,
    originalPrice: variant.originalPrice,
    images: variant.images ?? [],
    isDefault: variant.isDefault ?? false,
  };
};

const productDTO = (product) => {
  const obj = toPlain(product);
  if (!obj) return null;

  return {
    _id: obj._id,
    name: obj.name,
    slug: obj.slug,
    description: obj.description,
    brand: obj.brand,
    type: obj.type,
    categoryId: obj.categoryId,
    sale: obj.sale ?? false,
    availability: obj.availability,
    specifications: obj.specifications ?? {},
    variants: (obj.variants ?? []).map(variantDTO),
    images: obj.images ?? [],
    rating: obj.rating ?? { avg: 0, count: 0 },
    isActive: obj.isActive,
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt,
  };
};

// ─────────────────────────────────────────
// REVIEW DTO
// Loại bỏ: likedBy (privacy + kích thước mảng lớn)
// Bao gồm: replies (phản hồi của admin)
// ─────────────────────────────────────────
const reviewDTO = (review) => {
  const obj = toPlain(review);
  if (!obj) return null;

  return {
    _id: obj._id,
    productId: obj.productId,
    userId: obj.userId,
    userName: obj.userName,
    userAvatar: obj.userAvatar,
    rating: obj.rating,
    title: obj.title,
    comment: obj.comment,
    images: obj.images ?? [],
    likes: obj.likes ?? 0,
    // likedBy bị ẩn: không trả về danh sách userId đã like
    replies: (obj.replies ?? []).map((r) => ({
      _id: r._id,
      adminId: r.adminId,
      adminName: r.adminName,
      comment: r.comment,
      createdAt: r.createdAt,
    })),
    isVerifiedPurchase: obj.isVerifiedPurchase,
    isApproved: obj.isApproved,
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt,
  };
};

// ─────────────────────────────────────────
// CART DTO
// ─────────────────────────────────────────
const cartDTO = (cart) => {
  const obj = toPlain(cart);
  if (!obj) return null;

  return {
    _id: obj._id,
    userId: obj.userId,
    items: (obj.items ?? []).map((item) => ({
      _id: item._id,
      productId: item.productId,
      sku: item.sku,
      name: item.name,
      image: item.image,
      price: item.price,
      quantity: item.quantity,
    })),
    totalPrice: obj.totalPrice ?? 0,
    updatedAt: obj.updatedAt,
  };
};

// ─────────────────────────────────────────
// ORDER DTO
// ─────────────────────────────────────────
const orderDTO = (order) => {
  const obj = toPlain(order);
  if (!obj) return null;

  return {
    _id: obj._id,
    orderNumber: obj.orderNumber,
    userId: obj.userId,
    items: (obj.items ?? []).map((item) => ({
      _id: item._id,
      productId: item.productId,
      sku: item.sku,
      name: item.name,
      image: item.image,
      price: item.price,
      quantity: item.quantity,
    })),
    shippingAddress: obj.shippingAddress,
    paymentMethod: obj.paymentMethod,
    paymentResult: obj.paymentResult,
    itemsPrice: obj.itemsPrice,
    shippingPrice: obj.shippingPrice,
    totalPrice: obj.totalPrice,
    status: obj.status,
    isPaid: obj.isPaid,
    paidAt: obj.paidAt,
    deliveredAt: obj.deliveredAt,
    note: obj.note,
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt,
  };
};

// ─────────────────────────────────────────
// INVENTORY DTO
// Thêm computed field: available = stock - reserved
// ─────────────────────────────────────────
const inventoryDTO = (inventory) => {
  const obj = toPlain(inventory);
  if (!obj) return null;

  return {
    _id: obj._id,
    sku: obj.sku,
    productId: obj.productId,
    stock: obj.stock ?? 0,
    reserved: obj.reserved ?? 0,
    available: (obj.stock ?? 0) - (obj.reserved ?? 0),
    warehouse: obj.warehouse,
    lastRestocked: obj.lastRestocked,
  };
};

module.exports = {
  userDTO,
  categoryDTO,
  variantDTO,
  productDTO,
  reviewDTO,
  cartDTO,
  orderDTO,
  inventoryDTO,
};
