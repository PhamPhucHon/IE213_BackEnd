jest.mock('../../../models/Cart', () => {
  const Cart = jest.fn(function Cart(data) {
    Object.assign(this, data);
    this.items = data.items || [];
    this.totalPrice = data.totalPrice || 0;
    this.save = jest.fn().mockResolvedValue(this);
  });
  Cart.findOne = jest.fn();
  Cart.create = jest.fn();
  return Cart;
});

jest.mock('../../../models/Product');
jest.mock('../../../services/inventoryService', () => ({
  getStock: jest.fn(),
}));
jest.mock('../../../utils/dto', () => ({
  cartDTO: jest.fn((cart) => ({ items: cart.items, totalPrice: cart.totalPrice })),
}));

const Cart = require('../../../models/Cart');
const Product = require('../../../models/Product');
const inventoryService = require('../../../services/inventoryService');
const cartService = require('../../../services/cartService');

describe('cartService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates an empty cart when a user does not have one yet', async () => {
    Cart.findOne.mockResolvedValue(null);
    Cart.create.mockResolvedValue({ items: [], totalPrice: 0 });

    const result = await cartService.getCart('user-1');

    expect(Cart.create).toHaveBeenCalledWith({ userId: 'user-1', items: [], totalPrice: 0 });
    expect(result).toEqual({ items: [], totalPrice: 0 });
  });

  it('adds a new item into a fresh cart and recalculates total price', async () => {
    Product.findOne.mockResolvedValue({
      _id: 'product-1',
      name: 'Classic Frame',
      images: ['product-image'],
      variants: [{ sku: 'sku-1', color: 'Black', price: 250000, images: ['variant-image'] }],
    });
    Cart.findOne.mockResolvedValue(null);
    inventoryService.getStock.mockResolvedValue({ stock: 10, reserved: 2 });

    const result = await cartService.addToCart('user-2', { sku: 'sku-1', quantity: 2 });

    const createdCart = Cart.mock.instances[0];
    expect(createdCart.items).toHaveLength(1);
    expect(createdCart.items[0]).toEqual(
      expect.objectContaining({ sku: 'sku-1', quantity: 2, price: 250000 })
    );
    expect(createdCart.totalPrice).toBe(500000);
    expect(result.totalPrice).toBe(500000);
  });

  it('merges quantity when the SKU already exists in cart', async () => {
    const cartDoc = {
      items: [{ sku: 'sku-1', quantity: 1, price: 100000, name: 'Old name', image: 'old-image' }],
      totalPrice: 100000,
      save: jest.fn().mockResolvedValue(undefined),
    };
    cartDoc.save.mockResolvedValue(cartDoc);

    Product.findOne.mockResolvedValue({
      _id: 'product-1',
      name: 'Classic Frame',
      images: ['product-image'],
      variants: [{ sku: 'sku-1', color: 'Black', price: 200000, images: ['variant-image'] }],
    });
    Cart.findOne.mockResolvedValue(cartDoc);
    inventoryService.getStock.mockResolvedValue({ stock: 10, reserved: 0 });

    const result = await cartService.addToCart('user-2', { sku: 'sku-1', quantity: 2 });

    expect(cartDoc.items[0]).toEqual(
      expect.objectContaining({ quantity: 3, price: 200000, name: 'Classic Frame - Black' })
    );
    expect(cartDoc.totalPrice).toBe(600000);
    expect(result.totalPrice).toBe(600000);
  });

  it('rejects quantity updates that exceed available stock', async () => {
    Cart.findOne.mockResolvedValue({
      items: [{ sku: 'sku-1', quantity: 1 }],
      save: jest.fn(),
    });
    inventoryService.getStock.mockResolvedValue({ stock: 3, reserved: 1 });

    await expect(cartService.updateCartItem('user-3', 'sku-1', 3)).rejects.toMatchObject({
      statusCode: 409,
    });
  });

  it('removes an item when quantity is updated to zero or lower', async () => {
    const removeSpy = jest.spyOn(cartService, 'removeCartItem').mockResolvedValue({ items: [], totalPrice: 0 });

    const result = await cartService.updateCartItem('user-3', 'sku-1', 0);

    expect(removeSpy).toHaveBeenCalledWith('user-3', 'sku-1');
    expect(result).toEqual({ items: [], totalPrice: 0 });
    removeSpy.mockRestore();
  });

  it('clears all items in a cart', async () => {
    const cartDoc = {
      items: [{ sku: 'sku-1', quantity: 2, price: 100000 }],
      totalPrice: 200000,
      save: jest.fn().mockResolvedValue(undefined),
    };
    cartDoc.save.mockResolvedValue(cartDoc);
    Cart.findOne.mockResolvedValue(cartDoc);

    const result = await cartService.clearCart('user-4');

    expect(cartDoc.items).toEqual([]);
    expect(cartDoc.totalPrice).toBe(0);
    expect(result.totalPrice).toBe(0);
  });

  it('throws 404 when removing an item from a missing cart', async () => {
    Cart.findOne.mockResolvedValue(null);

    await expect(cartService.removeCartItem('user-404', 'sku-404')).rejects.toMatchObject({
      statusCode: 404,
    });
  });
});