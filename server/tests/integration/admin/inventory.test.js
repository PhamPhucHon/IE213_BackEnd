// tests/inventory.test.js
const request = require('supertest');
const app = require('../../../app');
const mongoose = require('mongoose');
const User = require('../../../models/User');
const Category = require('../../../models/Category');
const Product = require('../../../models/Product');
const Inventory = require('../../../models/Inventory');
const inventoryService = require('../../../services/inventoryService');

// ==================== HELPERS ====================

const getAdminToken = async () => {
  await User.create({
    name: 'Admin',
    email: 'admin@test.com',
    password: 'adminpass',
    isAdmin: true,
  });
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin@test.com', password: 'adminpass' });
  return res.body.data.token;
};

const getUserToken = async () => {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Regular User', email: 'user@test.com', password: 'userpass' });
  return res.body.data.token;
};

const createInventory = async (overrides = {}) => {
  const uniq = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const category = await Category.create({ name: `Cat-${uniq}` });
  const product = await Product.create({
    name: `Product-${uniq}`,
    brand: 'TestBrand',
    description: 'desc',
    categoryId: category._id,
    variants: [{ sku: `var-${uniq}`, color: 'Black', price: 100, originalPrice: 120, isDefault: true }],
  });
  return Inventory.create({
    sku: overrides.sku || `sku-${uniq}`,
    productId: overrides.productId || product._id,
    stock: overrides.stock ?? 20,
    reserved: overrides.reserved ?? 0,
    warehouse: overrides.warehouse || 'main',
    ...overrides,
  });
};

// ==================== API 8.1: GET /api/admin/inventory ====================

describe('GET /api/admin/inventory', () => {
  let adminToken;
  let userToken;

  beforeEach(async () => {
    adminToken = await getAdminToken();
    userToken = await getUserToken();
  });

  it('TC-01: Trả danh sách tất cả inventory khi không có filter', async () => {
    await Promise.all([
      createInventory({ sku: 'sku-tc01-a' }),
      createInventory({ sku: 'sku-tc01-b' }),
      createInventory({ sku: 'sku-tc01-c' }),
    ]);

    const res = await request(app)
      .get('/api/admin/inventory')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(3);
    expect(res.body.meta.totalInventories).toBe(3);
  });

  it('TC-02: Lọc theo productId hợp lệ', async () => {
    const uniq = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const category = await Category.create({ name: `Cat-tc02-${uniq}` });
    const productA = await Product.create({
      name: 'Product A', brand: 'B', description: 'd', categoryId: category._id,
      variants: [{ sku: `var-a-${uniq}`, color: 'Red', price: 100, originalPrice: 120, isDefault: true }],
    });
    const productB = await Product.create({
      name: 'Product B', brand: 'B', description: 'd', categoryId: category._id,
      variants: [{ sku: `var-b-${uniq}`, color: 'Blue', price: 200, originalPrice: 220, isDefault: true }],
    });

    await Inventory.create({ sku: 'sku-tc02-a1', productId: productA._id, stock: 10, reserved: 0 });
    await Inventory.create({ sku: 'sku-tc02-a2', productId: productA._id, stock: 5, reserved: 0 });
    await Inventory.create({ sku: 'sku-tc02-b1', productId: productB._id, stock: 8, reserved: 0 });

    const res = await request(app)
      .get(`/api/admin/inventory?productId=${productA._id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.length).toBe(2);
    res.body.data.forEach(item => {
      expect(item.productId._id || item.productId).toBe(productA._id.toString());
    });
  });

  it('TC-03: Lọc lowStock=true trả về available < 10', async () => {
    await Inventory.create([
      { sku: 'sku-tc03-low', productId: new mongoose.Types.ObjectId(), stock: 5, reserved: 0 },
      { sku: 'sku-tc03-ok', productId: new mongoose.Types.ObjectId(), stock: 100, reserved: 0 },
    ]);

    const res = await request(app)
      .get('/api/admin/inventory?lowStock=true')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].available).toBe(5);
  });

  it('TC-04: Lọc lowStock=false trả về hàng đủ kho (available >= 10)', async () => {
    await Inventory.create([
      { sku: 'sku-tc04-low', productId: new mongoose.Types.ObjectId(), stock: 5, reserved: 0 },
      { sku: 'sku-tc04-ok', productId: new mongoose.Types.ObjectId(), stock: 100, reserved: 0 },
    ]);

    const res = await request(app)
      .get('/api/admin/inventory?lowStock=false')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].available).toBe(100);
  });

  it('TC-05: Phân trang hoạt động đúng', async () => {
    const insertData = Array.from({ length: 25 }, (_, i) => ({
      sku: `sku-tc05-${i}`,
      productId: new mongoose.Types.ObjectId(),
      stock: 50,
      reserved: 0,
    }));
    await Inventory.insertMany(insertData);

    const res = await request(app)
      .get('/api/admin/inventory?page=2&limit=10')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.length).toBe(10);
    expect(res.body.meta.currentPage).toBe(2);
    expect(res.body.meta.totalPages).toBe(3);
    expect(res.body.meta.totalInventories).toBe(25);
  });

  it('TC-06: Trả mảng rỗng khi không có document khớp filter', async () => {
    const nonExistentId = new mongoose.Types.ObjectId();

    const res = await request(app)
      .get(`/api/admin/inventory?productId=${nonExistentId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data).toEqual([]);
    expect(res.body.meta.totalInventories).toBe(0);
  });

  it('TC-07: Trả 422 khi productId không phải MongoId', async () => {
    const res = await request(app)
      .get('/api/admin/inventory?productId=invalid-id')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(422);
    expect(res.body.success).toBe(false);
  });

  it('TC-08: Trả 422 khi lowStock có giá trị không hợp lệ', async () => {
    const res = await request(app)
      .get('/api/admin/inventory?lowStock=yes')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(422);
    expect(res.body.success).toBe(false);
  });

  it('TC-09: Trả 401 khi không có token', async () => {
    const res = await request(app).get('/api/admin/inventory');

    expect(res.statusCode).toBe(401);
  });

  it('TC-10: Trả 403 khi dùng user token (không phải admin)', async () => {
    const res = await request(app)
      .get('/api/admin/inventory')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.statusCode).toBe(403);
  });

  it('TC-11: Mỗi item phải có đủ các trường DTO', async () => {
    await createInventory({ sku: 'sku-tc11' });

    const res = await request(app)
      .get('/api/admin/inventory')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    const item = res.body.data[0];
    expect(item).toHaveProperty('_id');
    expect(item).toHaveProperty('sku');
    expect(item).toHaveProperty('productId');
    expect(item).toHaveProperty('stock');
    expect(item).toHaveProperty('reserved');
    expect(item).toHaveProperty('available');
    expect(item).toHaveProperty('warehouse');
    expect(item).not.toHaveProperty('__v');
    // productId đã được populate
    expect(item.productId).toHaveProperty('name');
    expect(item.productId).toHaveProperty('slug');
  });
});

// ==================== API 8.2: GET /api/inventory/check ====================

describe('GET /api/inventory/check', () => {
  let userToken;

  beforeEach(async () => {
    userToken = await getUserToken();
  });

  it('TC-12: Trả available=true khi stock đủ', async () => {
    await Inventory.create({
      sku: 'sku-tc12',
      productId: new mongoose.Types.ObjectId(),
      stock: 10,
      reserved: 2,
    });

    const res = await request(app)
      .get('/api/inventory/check?sku=sku-tc12&quantity=5')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.available).toBe(true);
    expect(res.body.data.availableStock).toBe(8);
    expect(res.body.data.requestedQuantity).toBe(5);
    expect(res.body.data.sku).toBe('sku-tc12');
  });

  it('TC-13: Trả available=false khi stock không đủ', async () => {
    await Inventory.create({
      sku: 'sku-tc13',
      productId: new mongoose.Types.ObjectId(),
      stock: 5,
      reserved: 3,
    });

    const res = await request(app)
      .get('/api/inventory/check?sku=sku-tc13&quantity=5')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.available).toBe(false);
    expect(res.body.data.availableStock).toBe(2);
  });

  it('TC-14: Trả available=true khi quantity bằng đúng available', async () => {
    await Inventory.create({
      sku: 'sku-tc14',
      productId: new mongoose.Types.ObjectId(),
      stock: 5,
      reserved: 3,
    });

    const res = await request(app)
      .get('/api/inventory/check?sku=sku-tc14&quantity=2')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.available).toBe(true);
    expect(res.body.data.availableStock).toBe(2);
  });

  it('TC-15: Trả 404 khi SKU không tồn tại', async () => {
    const res = await request(app)
      .get('/api/inventory/check?sku=sku-khong-ton-tai&quantity=1')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('TC-16: Trả 422 khi thiếu sku', async () => {
    const res = await request(app)
      .get('/api/inventory/check?quantity=1')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.statusCode).toBe(422);
    expect(res.body.success).toBe(false);
  });

  it('TC-17: Trả 422 khi thiếu quantity', async () => {
    const res = await request(app)
      .get('/api/inventory/check?sku=any-sku')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.statusCode).toBe(422);
    expect(res.body.success).toBe(false);
  });

  it('TC-18: Trả 422 khi quantity = 0', async () => {
    const res = await request(app)
      .get('/api/inventory/check?sku=any-sku&quantity=0')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.statusCode).toBe(422);
    expect(res.body.success).toBe(false);
  });

  it('TC-19: Trả 401 khi không có token', async () => {
    const res = await request(app)
      .get('/api/inventory/check?sku=any-sku&quantity=1');

    expect(res.statusCode).toBe(401);
  });

  it('TC-20: Response data có đủ các trường contract', async () => {
    await Inventory.create({
      sku: 'sku-tc20',
      productId: new mongoose.Types.ObjectId(),
      stock: 10,
      reserved: 0,
    });

    const res = await request(app)
      .get('/api/inventory/check?sku=sku-tc20&quantity=3')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.statusCode).toBe(200);
    const d = res.body.data;
    expect(d).toHaveProperty('sku');
    expect(d).toHaveProperty('available');
    expect(d).toHaveProperty('currentStock');
    expect(d).toHaveProperty('reserved');
    expect(d).toHaveProperty('availableStock');
    expect(d).toHaveProperty('requestedQuantity');
    expect(res.body.meta).toHaveProperty('timestamp');
  });
});

// ==================== REGRESSION: logic reserve/release không bị ảnh hưởng ====================

describe('Regression: inventory service logic', () => {
  it('TC-21: reserveStock chặn oversell sau khi thêm hàm mới', async () => {
    await Inventory.create({
      sku: 'sku-tc21',
      productId: new mongoose.Types.ObjectId(),
      stock: 3,
      reserved: 0,
    });

    await expect(inventoryService.reserveStock('sku-tc21', 4)).rejects.toThrow();

    const inventory = await inventoryService.reserveStock('sku-tc21', 3);
    expect(inventory.reserved).toBe(3);
    expect(inventory.stock).toBe(3);
  });

  it('TC-22: Admin update stock < reserved → trả lỗi 409', async () => {
    const adminToken = await (async () => {
      await User.create({
        name: 'Admin22', email: 'admin22@test.com', password: 'adminpass', isAdmin: true,
      });
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin22@test.com', password: 'adminpass' });
      return res.body.data.token;
    })();

    await Inventory.create({
      sku: 'sku-tc22',
      productId: new mongoose.Types.ObjectId(),
      stock: 10,
      reserved: 5,
    });

    const res = await request(app)
      .put('/api/admin/inventory/sku-tc22')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ stock: 3 });

    expect(res.statusCode).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('TC-23: checkStock không thay đổi reserved/stock (read-only)', async () => {
    await Inventory.create({
      sku: 'sku-tc23',
      productId: new mongoose.Types.ObjectId(),
      stock: 10,
      reserved: 2,
    });

    await inventoryService.checkStock('sku-tc23', 5);

    const after = await Inventory.findOne({ sku: 'sku-tc23' });
    expect(after.stock).toBe(10);
    expect(after.reserved).toBe(2);
  });

  it('TC-24: listInventory biên lowStock: available=10 KHÔNG tính là lowStock', async () => {
    await Inventory.create([
      { sku: 'sku-tc24-edge', productId: new mongoose.Types.ObjectId(), stock: 10, reserved: 0 },  // available=10, không low
      { sku: 'sku-tc24-low', productId: new mongoose.Types.ObjectId(), stock: 9, reserved: 0 },    // available=9, là low
    ]);

    const result = await inventoryService.listInventory({ lowStock: 'true', page: 1, limit: 20 });

    expect(result.inventories.length).toBe(1);
    expect(result.inventories[0].sku).toBe('sku-tc24-low');
  });
});
