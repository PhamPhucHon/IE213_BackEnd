const User = require('../models/User');
const Order = require('../models/Order');
const Inventory = require('../models/Inventory');
const userService = require('../services/userService');
const orderService = require('../services/orderService');
const inventoryService = require('../services/inventoryService');
const reviewService = require('../services/reviewService');
const { successResponse } = require('../utils/apiResponse');
const { HTTP_STATUS, MESSAGES, PAGINATION } = require('../config/constants');
const { asyncHandler } = require('../utils/asyncHandler');
const ApiError = require('../utils/apiError');

const REVENUE_PERIODS = {
  week: {
    bucketCount: 7,
    aggregateFormat: '%Y-%m-%d',
  },
  month: {
    bucketCount: 6,
    aggregateFormat: '%Y-%m',
  },
  quarter: {
    bucketCount: 13,
    aggregateFormat: '%Y-%m-%d',
  },
};

const padDatePart = (value) => String(value).padStart(2, '0');

const startOfUtcDay = (date) => new Date(Date.UTC(
  date.getUTCFullYear(),
  date.getUTCMonth(),
  date.getUTCDate()
));

const startOfUtcMonth = (date) => new Date(Date.UTC(
  date.getUTCFullYear(),
  date.getUTCMonth(),
  1
));

const addUtcDays = (date, days) => new Date(Date.UTC(
  date.getUTCFullYear(),
  date.getUTCMonth(),
  date.getUTCDate() + days
));

const addUtcWeeks = (date, weeks) => addUtcDays(date, weeks * 7);

const addUtcMonths = (date, months) => new Date(Date.UTC(
  date.getUTCFullYear(),
  date.getUTCMonth() + months,
  1
));

const startOfUtcWeek = (date) => {
  const day = startOfUtcDay(date);
  const weekday = day.getUTCDay();
  const offset = weekday === 0 ? -6 : 1 - weekday;

  return addUtcDays(day, offset);
};

const getRevenueBucketKey = (date, period) => {
  const year = date.getUTCFullYear();
  const month = padDatePart(date.getUTCMonth() + 1);

  if (period === 'month') return `${year}-${month}`;
  return `${year}-${month}-${padDatePart(date.getUTCDate())}`;
};

const getRevenueBucketLabel = (date, period) => {
  const month = padDatePart(date.getUTCMonth() + 1);

  if (period === 'month') return `${month}/${date.getUTCFullYear()}`;
  return `${padDatePart(date.getUTCDate())}/${month}`;
};

const getWeeklyRevenueBucketLabel = (startDate, endDate) => {
  const endDay = addUtcDays(endDate, -1);
  return `${getRevenueBucketLabel(startDate, 'week')} - ${getRevenueBucketLabel(endDay, 'week')}`;
};

const buildRevenueBuckets = (period, now = new Date()) => {
  if (period === 'month') {
    const currentMonth = startOfUtcMonth(now);
    const firstMonth = addUtcMonths(currentMonth, -(REVENUE_PERIODS.month.bucketCount - 1));

    return Array.from({ length: REVENUE_PERIODS.month.bucketCount }, (_, index) => {
      const startDate = addUtcMonths(firstMonth, index);
      const endDate = addUtcMonths(startDate, 1);

      return {
        key: getRevenueBucketKey(startDate, period),
        label: getRevenueBucketLabel(startDate, period),
        startDate,
        endDate,
      };
    });
  }

  if (period === 'quarter') {
    const currentWeek = startOfUtcWeek(now);
    const firstWeek = addUtcWeeks(currentWeek, -(REVENUE_PERIODS.quarter.bucketCount - 1));

    return Array.from({ length: REVENUE_PERIODS.quarter.bucketCount }, (_, index) => {
      const startDate = addUtcWeeks(firstWeek, index);
      const endDate = addUtcWeeks(startDate, 1);

      return {
        key: getRevenueBucketKey(startDate, period),
        label: getWeeklyRevenueBucketLabel(startDate, endDate),
        startDate,
        endDate,
      };
    });
  }

  const today = startOfUtcDay(now);
  const firstDay = addUtcDays(today, -(REVENUE_PERIODS.week.bucketCount - 1));

  return Array.from({ length: REVENUE_PERIODS.week.bucketCount }, (_, index) => {
    const startDate = addUtcDays(firstDay, index);
    const endDate = addUtcDays(startDate, 1);

    return {
      key: getRevenueBucketKey(startDate, period),
      label: getRevenueBucketLabel(startDate, period),
      startDate,
      endDate,
    };
  });
};

const getRevenuePeriod = (value) => {
  if (value === 'week' || value === 'month' || value === 'quarter') return value;
  return 'quarter';
};

const getQuarterBucketTotals = (bucket, revenueResult) => revenueResult.reduce((totals, item) => {
  const itemDate = new Date(`${item._id}T00:00:00.000Z`);
  if (itemDate >= bucket.startDate && itemDate < bucket.endDate) {
    return {
      revenue: totals.revenue + item.revenue,
      orders: totals.orders + item.orders,
    };
  }

  return totals;
}, { revenue: 0, orders: 0 });

const assertCustomerAccount = (user) => {
  if (user?.isAdmin) {
    throw new ApiError(
      'Không thể quản lý tài khoản admin trong khu vực quản lý khách hàng.',
      HTTP_STATUS.FORBIDDEN
    );
  }
};

// ==================== THỐNG KÊ TỔNG QUAN ====================

// GET /api/admin/stats/overview
exports.getStatsOverview = asyncHandler(async (req, res) => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalUsers,
    totalOrders,
    revenueResult,
    lowStockResult,
  ] = await Promise.all([
    User.countDocuments().setOptions({ includeInactive: true }),
    Order.countDocuments(),
    Order.aggregate([
      { $match: { status: 'Delivered', createdAt: { $gte: startOfMonth } } },
      {
        $group: {
          _id: null,
          total: {
            $sum: {
              $convert: {
                input: '$totalPrice',
                to: 'double',
                onError: 0,
                onNull: 0,
              },
            },
          },
        },
      },
    ]),
    Inventory.aggregate([
      {
        $project: {
          available: {
            $subtract: [
              {
                $convert: {
                  input: '$stock',
                  to: 'double',
                  onError: 0,
                  onNull: 0,
                },
              },
              {
                $convert: {
                  input: '$reserved',
                  to: 'double',
                  onError: 0,
                  onNull: 0,
                },
              },
            ],
          },
        },
      },
      { $match: { available: { $lt: 10 } } },
      { $count: 'count' },
    ]),
  ]);

  const revenueThisMonth = revenueResult.length > 0 ? revenueResult[0].total : 0;
  const lowStockCount = lowStockResult[0]?.count ?? 0;

  return successResponse(res, HTTP_STATUS.OK, MESSAGES.SUCCESS, {
    totalUsers,
    totalOrders,
    revenueThisMonth,
    lowStockCount,
  });
});

// GET /api/admin/stats/top-products
exports.getTopProducts = asyncHandler(async (req, res) => {
  const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 50);

  const topProducts = await Order.aggregate([
    { $match: { status: 'Delivered' } },
    { $unwind: '$items' },
    {
      $addFields: {
        itemQuantity: {
          $convert: {
            input: '$items.quantity',
            to: 'int',
            onError: 0,
            onNull: 0,
          },
        },
        itemPrice: {
          $convert: {
            input: '$items.price',
            to: 'double',
            onError: 0,
            onNull: 0,
          },
        },
      },
    },
    { $match: { itemQuantity: { $gt: 0 } } },
    {
      $group: {
        _id: { $ifNull: ['$items.productId', '$items.sku'] },
        totalSold: { $sum: '$itemQuantity' },
        totalRevenue: { $sum: { $multiply: ['$itemPrice', '$itemQuantity'] } },
        name: { $first: { $ifNull: ['$items.name', '$items.sku'] } },
        image: { $first: { $ifNull: ['$items.image', ''] } },
      },
    },
    { $sort: { totalSold: -1, totalRevenue: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: 'products',
        localField: '_id',
        foreignField: '_id',
        as: 'product',
      },
    },
    { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 1,
        name: { $ifNull: ['$name', '$product.name'] },
        image: { $ifNull: ['$image', { $arrayElemAt: ['$product.images', 0] }] },
        totalSold: 1,
        totalRevenue: 1,
        slug: '$product.slug',
        isActive: '$product.isActive',
        rating: '$product.rating',
      },
    },
  ]);

  return successResponse(res, HTTP_STATUS.OK, MESSAGES.SUCCESS, topProducts);
});

// GET /api/admin/stats/revenue
exports.getRevenueSeries = asyncHandler(async (req, res) => {
  const period = getRevenuePeriod(req.query.period);
  const buckets = buildRevenueBuckets(period);
  const startDate = buckets[0].startDate;
  const endDate = buckets[buckets.length - 1].endDate;

  const revenueResult = await Order.aggregate([
    { $match: { status: 'Delivered', createdAt: { $gte: startDate, $lt: endDate } } },
    {
      $group: {
        _id: {
          $dateToString: {
            format: REVENUE_PERIODS[period].aggregateFormat,
            date: '$createdAt',
            timezone: 'UTC',
          },
        },
        revenue: {
          $sum: {
            $convert: {
              input: '$totalPrice',
              to: 'double',
              onError: 0,
              onNull: 0,
            },
          },
        },
        orders: { $sum: 1 },
      },
    },
  ]);

  const totalsByKey = new Map(revenueResult.map((item) => [
    item._id,
    {
      revenue: item.revenue,
      orders: item.orders,
    },
  ]));

  const revenueSeries = buckets.map((bucket) => {
    const totals = period === 'quarter'
      ? getQuarterBucketTotals(bucket, revenueResult)
      : totalsByKey.get(bucket.key);

    return {
      key: bucket.key,
      label: bucket.label,
      revenue: totals?.revenue ?? 0,
      orders: totals?.orders ?? 0,
      startDate: bucket.startDate.toISOString(),
      endDate: bucket.endDate.toISOString(),
    };
  });

  return successResponse(res, HTTP_STATUS.OK, MESSAGES.SUCCESS, revenueSeries);
});

// ==================== QUẢN LÝ NGƯỜI DÙNG ====================

// GET /api/admin/users
exports.getAllUsers = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || PAGINATION.DEFAULT_PAGE;
  const limit = Number(req.query.limit) || PAGINATION.DEFAULT_LIMIT;
  const result = await userService.getAllUsers(page, limit, { includeInactive: true });

  return successResponse(res, HTTP_STATUS.OK, MESSAGES.SUCCESS, result.users, {}, result.pagination);
});

// GET /api/admin/users/:id
exports.getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).setOptions({ includeInactive: true });
  if (!user) throw new ApiError(MESSAGES.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  assertCustomerAccount(user);
  return successResponse(res, HTTP_STATUS.OK, MESSAGES.SUCCESS, user);
});

// PUT /api/admin/users/:id/toggle-status
exports.toggleUserStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).setOptions({ includeInactive: true });
  if (!user) throw new ApiError(MESSAGES.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  assertCustomerAccount(user);

  user.isActive = !user.isActive;
  user.deletedAt = user.isActive ? null : new Date();
  await user.save();

  const statusText = user.isActive ? 'kích hoạt' : 'vô hiệu hóa';
  return successResponse(res, HTTP_STATUS.OK, `Đã ${statusText} tài khoản thành công`, user);
});

// ==================== QUẢN LÝ ĐƠN HÀNG ====================

// GET /api/admin/orders
exports.getAllOrders = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || PAGINATION.DEFAULT_PAGE;
  const limit = Number(req.query.limit) || PAGINATION.DEFAULT_LIMIT;
  const result = await orderService.getAllOrders(page, limit, req.query.status);

  return successResponse(res, HTTP_STATUS.OK, MESSAGES.SUCCESS, result.orders, {}, result.pagination);
});

// GET /api/admin/orders/:id
exports.getOrderById = asyncHandler(async (req, res) => {
  // Truyền userId = null để bỏ qua kiểm tra quyền sở hữu
  const order = await orderService.getOrderById(req.params.id, null);
  return successResponse(res, HTTP_STATUS.OK, MESSAGES.SUCCESS, order);
});

// PUT /api/admin/orders/:id/status
exports.updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const order = await orderService.updateOrderStatus(req.params.id, status, true);
  return successResponse(res, HTTP_STATUS.OK, 'Cập nhật trạng thái đơn hàng thành công', order);
});

// ==================== QUẢN LÝ KHO ====================

// GET /api/admin/inventory
exports.getInventoryList = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || PAGINATION.DEFAULT_PAGE;
  const limit = Math.min(Number(req.query.limit) || 20, PAGINATION.MAX_LIMIT);
  const { productId, lowStock } = req.query;

  const result = await inventoryService.listInventory({ productId, lowStock, page, limit });

  return successResponse(res, HTTP_STATUS.OK, MESSAGES.SUCCESS, result.inventories, {}, result.pagination);
});

// GET /api/admin/inventory/:sku
exports.getInventoryBySku = asyncHandler(async (req, res) => {
  const inventory = await inventoryService.getStock(req.params.sku);
  return successResponse(res, HTTP_STATUS.OK, MESSAGES.SUCCESS, inventory);
});

// PUT /api/admin/inventory/:sku
exports.updateInventory = asyncHandler(async (req, res) => {
  const { stock } = req.body;
  const inventory = await inventoryService.updateStock(req.params.sku, stock);
  return successResponse(res, HTTP_STATUS.OK, 'Cập nhật tồn kho thành công', inventory);
});

// ==================== QUẢN LÝ ĐÁNH GIÁ ====================

// GET /api/admin/reviews
exports.getAllReviews = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || PAGINATION.DEFAULT_PAGE;
  const limit = Math.min(Number(req.query.limit) || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT);
  const result = await reviewService.getAllReviews({
    page,
    limit,
    ratingFilter: req.query.rating ?? 'all',
  });

  return successResponse(res, HTTP_STATUS.OK, MESSAGES.SUCCESS, result.reviews, {}, result.pagination);
});

// DELETE /api/admin/reviews/:id
exports.deleteReview = asyncHandler(async (req, res) => {
  const result = await reviewService.deleteReview(req.params.id, req.user._id, true);
  return successResponse(res, HTTP_STATUS.OK, result.message, null);
});
