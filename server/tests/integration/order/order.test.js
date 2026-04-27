const request = require('supertest');
const app = require('../../../app');
const Cart = require('../../../models/Cart');
const Category = require('../../../models/Category');
const Inventory = require('../../../models/Inventory');
const Order = require('../../../models/Order');
const Product = require('../../../models/Product');

const registerUserAndGetToken = async (email = `order-${Date.now()}-${Math.random().toString(36).slice(2)}@test.com`) => {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Order User', email, password: '123456' });

  return res.body.data.token;
};

const createOrderProduct = async ({ sku, price = 220000, stock = 10 }) => {
  const uniq = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const category = await Category.create({ name: `Order Category ${uniq}` });
  const product = await Product.create({
    name: `Order Product ${uniq}`,
    brand: 'Order Brand',
    description: 'Order integration product',
    categoryId: category._id,
    variants: [{ sku, color: 'Silver', price, originalPrice: price + 50000, isDefault: true }],
  });

  await Inventory.create({ sku, productId: product._id, stock, reserved: 0 });
  return product;
};

const createPendingOrderThroughApi = async ({ token, sku, quantity = 2 }) => {
  await request(app)
    .post('/api/cart')
    .set('Authorization', `Bearer ${token}`)
    .send({ sku, quantity });

  return request(app)
    .post('/api/orders')
    .set('Authorization', `Bearer ${token}`)
    .send({
      shippingAddress: {
        fullName: 'Order Receiver',
        phone: '0901234567',
        address: '123 Integration Street',
      },
      paymentMethod: 'COD',
    });
};

describe('Order integration flow', () => {
  beforeAll(async () => {
    await Promise.all([Product.init(), Inventory.init(), Cart.init(), Order.init()]);
  });

  it('creates an order from cart items, reserves inventory, and clears the cart', async () => {
    const token = await registerUserAndGetToken();
    await createOrderProduct({ sku: 'order-create-sku', price: 200000, stock: 10 });

    const res = await createPendingOrderThroughApi({ token, sku: 'order-create-sku', quantity: 2 });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('Pending');
    expect(res.body.data.items).toHaveLength(1);

    const inventory = await Inventory.findOne({ sku: 'order-create-sku' });
    const cart = await Cart.findOne();
    expect(inventory.reserved).toBe(2);
    expect(cart.items).toEqual([]);
    expect(cart.totalPrice).toBe(0);
  });

  it('lists and loads the current user orders after creation', async () => {
    const token = await registerUserAndGetToken();
    await createOrderProduct({ sku: 'order-list-sku', price: 250000, stock: 6 });

    const createRes = await createPendingOrderThroughApi({ token, sku: 'order-list-sku', quantity: 1 });
    const orderId = createRes.body.data._id;

    const listRes = await request(app)
      .get('/api/orders')
      .set('Authorization', `Bearer ${token}`);

    expect(listRes.statusCode).toBe(200);
    expect(listRes.body.data).toHaveLength(1);

    const detailRes = await request(app)
      .get(`/api/orders/${orderId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(detailRes.statusCode).toBe(200);
    expect(detailRes.body.data._id).toBe(orderId);
  });

  it('cancels a pending order and releases reserved inventory', async () => {
    const token = await registerUserAndGetToken();
    await createOrderProduct({ sku: 'order-cancel-sku', price: 175000, stock: 5 });

    const createRes = await createPendingOrderThroughApi({ token, sku: 'order-cancel-sku', quantity: 2 });
    const orderId = createRes.body.data._id;

    const cancelRes = await request(app)
      .put(`/api/orders/${orderId}/cancel`)
      .set('Authorization', `Bearer ${token}`);

    expect(cancelRes.statusCode).toBe(200);
    expect(cancelRes.body.data.status).toBe('Cancelled');

    const inventory = await Inventory.findOne({ sku: 'order-cancel-sku' });
    const order = await Order.findById(orderId);
    expect(inventory.reserved).toBe(0);
    expect(order.status).toBe('Cancelled');
  });
});