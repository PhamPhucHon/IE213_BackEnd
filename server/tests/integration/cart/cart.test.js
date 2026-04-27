const request = require('supertest');
const app = require('../../../app');
const Category = require('../../../models/Category');
const Product = require('../../../models/Product');
const Inventory = require('../../../models/Inventory');

const registerUserAndGetToken = async (email = `cart-${Date.now()}-${Math.random().toString(36).slice(2)}@test.com`) => {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Cart User', email, password: '123456' });

  return res.body.data.token;
};

const createProductWithInventory = async ({ sku, price = 150000, stock = 10 }) => {
  const uniq = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const category = await Category.create({ name: `Cart Category ${uniq}` });
  const product = await Product.create({
    name: `Cart Product ${uniq}`,
    brand: 'Cart Brand',
    description: 'Cart integration product',
    categoryId: category._id,
    variants: [{ sku, color: 'Black', price, originalPrice: price + 20000, isDefault: true }],
  });

  await Inventory.create({ sku, productId: product._id, stock, reserved: 0 });
  return product;
};

describe('Cart integration flow', () => {
  it('returns an empty cart for a newly registered user', async () => {
    const token = await registerUserAndGetToken();

    const res = await request(app)
      .get('/api/cart')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.items).toEqual([]);
    expect(res.body.data.totalPrice).toBe(0);
  });

  it('adds a product to cart and returns recalculated totals', async () => {
    const token = await registerUserAndGetToken();
    await createProductWithInventory({ sku: 'cart-add-sku', price: 180000, stock: 8 });

    const res = await request(app)
      .post('/api/cart')
      .set('Authorization', `Bearer ${token}`)
      .send({ sku: 'cart-add-sku', quantity: 2 });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.items).toHaveLength(1);
    expect(res.body.data.items[0]).toEqual(expect.objectContaining({ sku: 'cart-add-sku', quantity: 2 }));
    expect(res.body.data.totalPrice).toBe(360000);
  });

  it('updates the quantity of an existing cart item', async () => {
    const token = await registerUserAndGetToken();
    await createProductWithInventory({ sku: 'cart-update-sku', price: 120000, stock: 10 });

    await request(app)
      .post('/api/cart')
      .set('Authorization', `Bearer ${token}`)
      .send({ sku: 'cart-update-sku', quantity: 1 });

    const res = await request(app)
      .put('/api/cart/cart-update-sku')
      .set('Authorization', `Bearer ${token}`)
      .send({ quantity: 3 });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.items[0]).toEqual(expect.objectContaining({ sku: 'cart-update-sku', quantity: 3 }));
    expect(res.body.data.totalPrice).toBe(360000);
  });

  it('removes an item from the cart and allows clearing the cart', async () => {
    const token = await registerUserAndGetToken();
    await createProductWithInventory({ sku: 'cart-remove-sku', price: 90000, stock: 10 });

    await request(app)
      .post('/api/cart')
      .set('Authorization', `Bearer ${token}`)
      .send({ sku: 'cart-remove-sku', quantity: 2 });

    const deleteRes = await request(app)
      .delete('/api/cart/cart-remove-sku')
      .set('Authorization', `Bearer ${token}`);

    expect(deleteRes.statusCode).toBe(200);
    expect(deleteRes.body.data.items).toEqual([]);

    const clearRes = await request(app)
      .delete('/api/cart')
      .set('Authorization', `Bearer ${token}`);

    expect(clearRes.statusCode).toBe(200);
    expect(clearRes.body.data.items).toEqual([]);
    expect(clearRes.body.data.totalPrice).toBe(0);
  });
});