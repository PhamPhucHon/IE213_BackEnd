jest.mock('../../../models/Order');
jest.mock('../../../models/Cart');
jest.mock('../../../models/Product');
jest.mock('../../../services/inventoryService', () => ({
  reserveStock: jest.fn(),
  releaseStock: jest.fn(),
  confirmStock: jest.fn(),
}));
jest.mock('../../../utils/dto', () => ({
  orderDTO: jest.fn((order) => ({ _id: order._id, status: order.status, items: order.items || [] })),
}));

const mongoose = require('mongoose');
const Order = require('../../../models/Order');
const Cart = require('../../../models/Cart');
const Product = require('../../../models/Product');
const inventoryService = require('../../../services/inventoryService');
const orderService = require('../../../services/orderService');
const { createQueryMock, createSessionMock } = require('../utils/testHelpers');

describe('orderService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns paginated orders for admins', async () => {
    Order.find.mockReturnValue(createQueryMock([{ _id: 'order-1' }, { _id: 'order-2' }]));
    Order.countDocuments.mockResolvedValue(3);

    const result = await orderService.getAllOrders(2, 2, 'Pending');

    expect(Order.find).toHaveBeenCalledWith({ status: 'Pending' });
    expect(result.pagination).toEqual({
      totalOrders: 3,
      currentPage: 2,
      totalPages: 2,
      limit: 2,
    });
  });

	it('returns paginated orders for a specific user', async () => {
		Order.find.mockReturnValue(createQueryMock([{ _id: 'order-1', status: 'Pending', items: [] }]));
		Order.countDocuments.mockResolvedValue(1);

		const result = await orderService.getUserOrders('user-1', 1, 10);

		expect(Order.find).toHaveBeenCalledWith({ userId: 'user-1' });
		expect(result.pagination.totalOrders).toBe(1);
	});

  it('aborts the transaction when creating an order from an empty cart', async () => {
    const session = createSessionMock();
    jest.spyOn(mongoose, 'startSession').mockResolvedValue(session);
    Cart.findOne.mockReturnValue(createQueryMock({ items: [] }));

    await expect(orderService.createOrder('user-1', { address: 'x' }, 'COD')).rejects.toMatchObject({
      statusCode: 400,
    });

    expect(session.startTransaction).toHaveBeenCalled();
    expect(session.abortTransaction).toHaveBeenCalled();
    expect(session.endSession).toHaveBeenCalled();
  });

  it('creates an order, reserves stock, and clears the cart', async () => {
    const session = createSessionMock();
    const cartDoc = {
      items: [{ productId: 'product-1', sku: 'sku-1', name: 'Classic', quantity: 2 }],
      totalPrice: 0,
      save: jest.fn().mockResolvedValue(undefined),
    };
    const productDoc = {
      _id: 'product-1',
      name: 'Classic',
      images: ['product-image'],
      variants: [{ sku: 'sku-1', color: 'Black', price: 100000, images: ['variant-image'] }],
    };

    jest.spyOn(mongoose, 'startSession').mockResolvedValue(session);
    Cart.findOne.mockReturnValue(createQueryMock(cartDoc));
    Product.findOne.mockReturnValue(createQueryMock(productDoc));
    Order.create.mockResolvedValue([{ _id: 'order-3', status: 'Pending', items: [{ sku: 'sku-1', quantity: 2 }] }]);

    const result = await orderService.createOrder(
      'user-1',
      { fullName: 'John', phone: '0901234567', address: '123 Street' },
      'COD'
    );

    expect(inventoryService.reserveStock).toHaveBeenCalledWith('sku-1', 2, session);
    expect(cartDoc.items).toEqual([]);
    expect(cartDoc.totalPrice).toBe(0);
    expect(session.commitTransaction).toHaveBeenCalled();
    expect(result).toEqual({ _id: 'order-3', status: 'Pending', items: [{ sku: 'sku-1', quantity: 2 }] });
  });

  it('releases stock and commits when a pending order is cancelled by its owner', async () => {
    const session = createSessionMock();
    const orderDoc = {
      _id: 'order-1',
      userId: { toString: () => 'user-1' },
      status: 'Pending',
      items: [{ sku: 'sku-1', quantity: 2 }],
      note: null,
      save: jest.fn().mockResolvedValue(undefined),
    };

    jest.spyOn(mongoose, 'startSession').mockResolvedValue(session);
    Order.findById.mockReturnValue(createQueryMock(orderDoc));

    const result = await orderService.cancelOrder('order-1', 'user-1');

    expect(orderDoc.status).toBe('Cancelled');
    expect(inventoryService.releaseStock).toHaveBeenCalledWith('sku-1', 2, session);
    expect(session.commitTransaction).toHaveBeenCalled();
    expect(result).toEqual({ _id: 'order-1', status: 'Cancelled', items: [{ sku: 'sku-1', quantity: 2 }] });
  });

  it('prevents users from reading orders they do not own', async () => {
    Order.findById.mockReturnValue(createQueryMock({
      _id: 'order-4',
      userId: { _id: { toString: () => 'owner-user' } },
    }));

    await expect(orderService.getOrderById('order-4', 'other-user')).rejects.toMatchObject({
      statusCode: 403,
    });
  });

  it('rejects invalid order status transitions', async () => {
    const session = createSessionMock();
    const orderDoc = {
      _id: 'order-2',
      status: 'Pending',
      items: [],
      save: jest.fn(),
    };

    jest.spyOn(mongoose, 'startSession').mockResolvedValue(session);
    Order.findById.mockReturnValue(createQueryMock(orderDoc));

    await expect(orderService.updateOrderStatus('order-2', 'Delivered', true)).rejects.toMatchObject({
      statusCode: 409,
    });

    expect(session.abortTransaction).toHaveBeenCalled();
    expect(inventoryService.confirmStock).not.toHaveBeenCalled();
  });

  it('confirms stock when an admin marks an order as delivered', async () => {
    const session = createSessionMock();
    const orderDoc = {
      _id: 'order-5',
      status: 'Shipped',
      items: [{ sku: 'sku-delivered', quantity: 1 }],
      save: jest.fn().mockResolvedValue(undefined),
    };

    jest.spyOn(mongoose, 'startSession').mockResolvedValue(session);
    Order.findById.mockReturnValue(createQueryMock(orderDoc));

    const result = await orderService.updateOrderStatus('order-5', 'Delivered', true);

    expect(inventoryService.confirmStock).toHaveBeenCalledWith('sku-delivered', 1, session);
    expect(orderDoc.status).toBe('Delivered');
    expect(orderDoc.isPaid).toBe(true);
    expect(result).toEqual({ _id: 'order-5', status: 'Delivered', items: [{ sku: 'sku-delivered', quantity: 1 }] });
  });

  it('cancels expired pending orders and reports how many were processed', async () => {
    const session = createSessionMock();
    const freshOrder = {
      _id: 'expired-1',
      status: 'Pending',
      items: [{ sku: 'sku-expired', quantity: 1 }],
      note: null,
      save: jest.fn().mockResolvedValue(undefined),
    };

    jest.spyOn(mongoose, 'startSession').mockResolvedValue(session);
    Order.find.mockResolvedValue([{ _id: 'expired-1' }]);
    Order.findById.mockReturnValue(createQueryMock(freshOrder));

    const result = await orderService.cancelExpiredOrders(30);

    expect(inventoryService.releaseStock).toHaveBeenCalledWith('sku-expired', 1, session);
    expect(result).toEqual({ cancelledCount: 1, checkedCount: 1 });
  });
});