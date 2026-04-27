const mongoose = require('mongoose');
const Cart = require('../../../models/Cart');

describe('Cart model', () => {
  it('recalculates totalPrice in the pre-save hook', async () => {
    const cart = new Cart({
      userId: new mongoose.Types.ObjectId(),
      items: [
        { productId: new mongoose.Types.ObjectId(), sku: 'sku-1', price: 100000, quantity: 2 },
        { productId: new mongoose.Types.ObjectId(), sku: 'sku-2', price: 50000, quantity: 1 },
      ],
    });

    await cart.save();

    expect(cart.totalPrice).toBe(250000);
  });

  it('computes total quantity from cart items', () => {
    const cart = new Cart({
      userId: new mongoose.Types.ObjectId(),
      items: [
        { productId: new mongoose.Types.ObjectId(), sku: 'sku-1', price: 100000, quantity: 2 },
        { productId: new mongoose.Types.ObjectId(), sku: 'sku-2', price: 50000, quantity: 3 },
      ],
    });

    expect(cart.getTotalQuantity()).toBe(5);
  });

  it('adds items by merging the same sku', async () => {
    const cart = new Cart({
      userId: new mongoose.Types.ObjectId(),
      items: [{ productId: new mongoose.Types.ObjectId(), sku: 'sku-1', price: 100000, quantity: 1 }],
    });

    await cart.addItem({
      productId: new mongoose.Types.ObjectId(),
      sku: 'sku-1',
      price: 120000,
      quantity: 2,
    });

    expect(cart.items).toHaveLength(1);
    expect(cart.items[0].quantity).toBe(3);
    expect(cart.items[0].price).toBe(120000);
  });

  it('removes items and clears the cart', async () => {
    const cart = new Cart({
      userId: new mongoose.Types.ObjectId(),
      items: [
        { productId: new mongoose.Types.ObjectId(), sku: 'sku-1', price: 100000, quantity: 1 },
        { productId: new mongoose.Types.ObjectId(), sku: 'sku-2', price: 200000, quantity: 1 },
      ],
    });

    await cart.removeItem('sku-1');
    expect(cart.items).toHaveLength(1);

    await cart.clearCart();
    expect(cart.items).toEqual([]);
  });

  it('updates quantity and removes the item when quantity drops to zero', async () => {
    const cart = new Cart({
      userId: new mongoose.Types.ObjectId(),
      items: [{ productId: new mongoose.Types.ObjectId(), sku: 'sku-1', price: 100000, quantity: 2 }],
    });

    await cart.updateItemQuantity('sku-1', 5);
    expect(cart.items[0].quantity).toBe(5);

    await cart.updateItemQuantity('sku-1', 0);
    expect(cart.items).toEqual([]);
  });
});