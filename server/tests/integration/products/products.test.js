// tests/products.test.js
const request = require('supertest');
const app = require('../../../app');
const mongoose = require('mongoose');
const Category = require('../../../models/Category');
const Product = require('../../../models/Product');
const User = require('../../../models/User');

// Helper: đăng nhập lấy admin token
const getAdminToken = async () => {
  // Tạo admin user trực tiếp qua model (không qua route register)
  const admin = await User.create({
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

describe('GET /api/products', () => {
  it('should return product list (public endpoint)', async () => {
    const res = await request(app).get('/api/products');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    // data là array trực tiếp
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('should support pagination query params', async () => {
    const res = await request(app).get('/api/products?page=1&limit=5');
    expect(res.statusCode).toBe(200);
    // meta chứa totalProducts, currentPage, totalPages trực tiếp
    expect(res.body.meta).toHaveProperty('totalProducts');
    expect(res.body.meta).toHaveProperty('currentPage');
  });
});

describe('POST /api/products (admin only)', () => {
  let adminToken;
  let categoryId;

  beforeEach(async () => {
    adminToken = await getAdminToken();
    const category = await Category.create({ name: 'Test Category' });
    categoryId = category._id.toString();
  });

  const newProduct = () => ({
    name: 'Test Sunglasses',
    brand: 'TestBrand',
    description: 'A test product description',
    categoryId,
    variants: [
      {
        sku: 'test-sunglasses-black',
        color: 'Black',
        price: 500000,
        originalPrice: 600000,
        isDefault: true,
      },
    ],
  });

  it('should create product when admin', async () => {
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(newProduct());

    // Log body để debug nếu fail
    if (res.statusCode !== 201) console.error('CREATE ERROR:', JSON.stringify(res.body));

    expect(res.statusCode).toBe(201);
    expect(res.body.data.name).toBe('Test Sunglasses');
    expect(res.body.data.variants[0]).not.toHaveProperty('size');
  });

  it('should return 401 without token', async () => {
    const res = await request(app).post('/api/products').send(newProduct());
    expect(res.statusCode).toBe(401);
  });

  it('should return 403 when non-admin tries to create', async () => {
    const regRes = await request(app).post('/api/auth/register').send({
      name: 'Normal User',
      email: 'normal@test.com',
      password: '123456',
    });
    const userToken = regRes.body.data.token;

    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${userToken}`)
      .send(newProduct());

    expect(res.statusCode).toBe(403);
  });

  it('should update a product when admin', async () => {
    const createRes = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(newProduct());

    const res = await request(app)
      .put(`/api/products/${createRes.body.data._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Updated Sunglasses', description: 'Updated description' });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.name).toBe('Updated Sunglasses');
    expect(res.body.data.description).toBe('Updated description');
  });

  it('should soft delete a product when admin', async () => {
    const createRes = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(newProduct());

    const res = await request(app)
      .delete(`/api/products/${createRes.body.data._id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);

    const product = await Product.findById(createRes.body.data._id).lean();
    expect(product).toEqual(expect.objectContaining({ isActive: false }));

    const detailRes = await request(app).get(`/api/products/${createRes.body.data._id}`);
    expect(detailRes.statusCode).toBe(404);
  });
});
