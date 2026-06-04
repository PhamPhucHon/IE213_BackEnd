const request = require('supertest');
const app = require('../../../app');
const Category = require('../../../models/Category');
const Order = require('../../../models/Order');
const Product = require('../../../models/Product');
const User = require('../../../models/User');

const getAdminSession = async () => {
  const admin = await User.create({
    name: 'Stats Admin',
    email: 'admin-stats@test.com',
    password: 'adminpass',
    isAdmin: true,
  });

  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin-stats@test.com', password: 'adminpass' });

  return { token: res.body.data.token, userId: admin._id };
};

const createStatsProduct = async () => {
  const category = await Category.create({ name: 'Frames' });

  return Product.create({
    name: 'Pilot Frame',
    categoryId: category._id,
    brand: 'Vista',
    description: 'Lightweight pilot frame',
    images: ['https://example.com/pilot-frame.jpg'],
    variants: [
      {
        sku: 'PILOT-BLK',
        color: 'Black',
        price: 150000,
        isDefault: true,
      },
    ],
  });
};

const createStatsOrder = async ({
  userId,
  productId,
  orderNumber,
  status = 'Delivered',
  totalPrice = 300000,
}) => Order.create({
  orderNumber,
  userId,
  items: [
    {
      productId,
      sku: 'PILOT-BLK',
      name: 'Pilot Frame',
      price: 150000,
      quantity: 2,
    },
  ],
  shippingAddress: {
    fullName: 'Stats Buyer',
    phone: '0900000000',
    address: '1 Test Street',
  },
  paymentMethod: 'COD',
  itemsPrice: totalPrice,
  totalPrice,
  status,
});

const getCurrentWeekKey = () => {
  const now = new Date();
  const day = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const weekday = day.getUTCDay();
  const offset = weekday === 0 ? -6 : 1 - weekday;
  const weekStart = new Date(Date.UTC(
    day.getUTCFullYear(),
    day.getUTCMonth(),
    day.getUTCDate() + offset
  ));

  return weekStart.toISOString().slice(0, 10);
};

describe('GET /api/admin/stats/top-products', () => {
  it('returns delivered top products without aggregation errors', async () => {
    const adminSession = await getAdminSession();
    const product = await createStatsProduct();

    await createStatsOrder({
      orderNumber: 'ORD-STATS-001',
      userId: adminSession.userId,
      productId: product._id,
    });

    const res = await request(app)
      .get('/api/admin/stats/top-products?limit=5')
      .set('Authorization', `Bearer ${adminSession.token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0]).toEqual(
      expect.objectContaining({
        name: 'Pilot Frame',
        slug: 'pilot-frame',
        totalSold: 2,
        totalRevenue: 300000,
      })
    );
  });
});

describe('GET /api/admin/stats/revenue', () => {
  it('returns quarterly weekly delivered revenue buckets', async () => {
    const adminSession = await getAdminSession();
    const product = await createStatsProduct();

    await createStatsOrder({
      orderNumber: 'ORD-REVENUE-001',
      userId: adminSession.userId,
      productId: product._id,
      totalPrice: 300000,
    });
    await createStatsOrder({
      orderNumber: 'ORD-REVENUE-002',
      userId: adminSession.userId,
      productId: product._id,
      status: 'Pending',
      totalPrice: 999000,
    });

    const quarterRes = await request(app)
      .get('/api/admin/stats/revenue')
      .set('Authorization', `Bearer ${adminSession.token}`);
    const currentWeekBucket = quarterRes.body.data.find((point) => point.key === getCurrentWeekKey());

    expect(quarterRes.statusCode).toBe(200);
    expect(quarterRes.body.data).toHaveLength(13);
    expect(currentWeekBucket).toEqual(
      expect.objectContaining({
        revenue: 300000,
        orders: 1,
      })
    );

    const weeklyRes = await request(app)
      .get('/api/admin/stats/revenue?period=week')
      .set('Authorization', `Bearer ${adminSession.token}`);
    const todayKey = new Date().toISOString().slice(0, 10);
    const todayBucket = weeklyRes.body.data.find((point) => point.key === todayKey);

    expect(weeklyRes.statusCode).toBe(200);
    expect(weeklyRes.body.data).toHaveLength(7);
    expect(todayBucket).toEqual(
      expect.objectContaining({
        revenue: 300000,
        orders: 1,
      })
    );

    const monthlyRes = await request(app)
      .get('/api/admin/stats/revenue?period=month')
      .set('Authorization', `Bearer ${adminSession.token}`);
    const monthKey = new Date().toISOString().slice(0, 7);
    const monthBucket = monthlyRes.body.data.find((point) => point.key === monthKey);

    expect(monthlyRes.statusCode).toBe(200);
    expect(monthlyRes.body.data).toHaveLength(6);
    expect(monthBucket).toEqual(
      expect.objectContaining({
        revenue: 300000,
        orders: 1,
      })
    );
  });
});
