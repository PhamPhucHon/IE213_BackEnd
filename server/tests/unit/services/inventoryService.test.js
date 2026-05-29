jest.mock('../../../models/Inventory');
jest.mock('../../../utils/dto', () => ({
  inventoryDTO: jest.fn((inventory) => ({
    sku: inventory.sku,
    stock: inventory.stock,
    reserved: inventory.reserved,
    available: (inventory.stock || 0) - (inventory.reserved || 0),
  })),
}));

const Inventory = require('../../../models/Inventory');
const inventoryService = require('../../../services/inventoryService');
const { createQueryMock } = require('../utils/testHelpers');

describe('inventoryService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads stock with populated product info', async () => {
    Inventory.findOne.mockReturnValue(createQueryMock({ sku: 'sku-1', stock: 10, reserved: 2 }));

    const result = await inventoryService.getStock('sku-1');

    expect(result).toEqual({ sku: 'sku-1', stock: 10, reserved: 2, available: 8 });
  });

  it('throws a detailed conflict error when reserveStock cannot allocate inventory', async () => {
    const session = { id: 'session-1' };
    Inventory.findOneAndUpdate.mockResolvedValue(null);
    Inventory.findOne.mockReturnValue(createQueryMock({ sku: 'sku-1', stock: 3, reserved: 3 }));

    await expect(inventoryService.reserveStock('sku-1', 1, session)).rejects.toMatchObject({
      statusCode: 409,
    });

    expect(Inventory.findOneAndUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ sku: 'sku-1' }),
      expect.objectContaining({ $inc: { reserved: 1 } }),
      { returnDocument: 'after', session }
    );
  });

  it('throws 404 when reserving stock for a missing sku', async () => {
    Inventory.findOneAndUpdate.mockResolvedValue(null);
    Inventory.findOne.mockReturnValue(createQueryMock(null));

    await expect(inventoryService.reserveStock('missing-sku', 1)).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it('throws 404 when updating stock for a missing sku', async () => {
    Inventory.findOneAndUpdate.mockResolvedValue(null);
    Inventory.findOne.mockResolvedValue(null);

    await expect(inventoryService.updateStock('missing-sku', 5)).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it('throws 409 when new stock is below reserved quantity', async () => {
    Inventory.findOneAndUpdate.mockResolvedValue(null);
    Inventory.findOne.mockResolvedValue({ sku: 'sku-2', reserved: 5 });

    await expect(inventoryService.updateStock('sku-2', 3)).rejects.toMatchObject({
      statusCode: 409,
    });
  });

  it('releases reserved stock successfully', async () => {
    Inventory.findOneAndUpdate.mockResolvedValue({ sku: 'sku-1', stock: 10, reserved: 1 });

    const result = await inventoryService.releaseStock('sku-1', 2);

    expect(result).toEqual({ sku: 'sku-1', stock: 10, reserved: 1 });
  });

  it('allows cancelling legacy orders that do not have reserved stock', async () => {
    const session = { id: 'session-1' };
    const legacyInventory = { sku: 'sku-legacy', stock: 5, reserved: 0 };
    Inventory.findOneAndUpdate.mockResolvedValue(null);
    Inventory.findOne.mockReturnValue(createQueryMock(legacyInventory));

    const result = await inventoryService.releaseStock('sku-legacy', 1, session);

    expect(result).toBe(legacyInventory);
    expect(Inventory.findOne).toHaveBeenCalledWith({ sku: 'sku-legacy' });
  });

  it('confirms stock after delivery', async () => {
    Inventory.findOneAndUpdate.mockResolvedValue({ sku: 'sku-3', stock: 8, reserved: 0 });

    const result = await inventoryService.confirmStock('sku-3', 2);

    expect(result).toEqual({ sku: 'sku-3', stock: 8, reserved: 0 });
  });

  it('delivers legacy orders by decrementing stock when reserved stock is missing', async () => {
    const session = { id: 'session-1' };
    Inventory.findOneAndUpdate
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ sku: 'sku-legacy', stock: 4, reserved: 0 });
    Inventory.findOne.mockReturnValue(createQueryMock({ sku: 'sku-legacy', stock: 5, reserved: 0 }));

    const result = await inventoryService.confirmStock('sku-legacy', 1, session);

    expect(result).toEqual({ sku: 'sku-legacy', stock: 4, reserved: 0 });
    expect(Inventory.findOneAndUpdate).toHaveBeenNthCalledWith(
      2,
      {
        sku: 'sku-legacy',
        stock: { $gte: 1 },
        reserved: { $lt: 1 },
      },
      {
        $inc: { stock: -1 },
        $set: { reserved: 0 },
      },
      { returnDocument: 'after', session }
    );
  });

  it('lists inventory with pagination metadata', async () => {
    Inventory.find.mockReturnValue(createQueryMock([{ sku: 'sku-4', stock: 5, reserved: 1 }]));
    Inventory.countDocuments.mockResolvedValue(1);

    const result = await inventoryService.listInventory({ lowStock: 'true', page: 1, limit: 10 });

    expect(result.pagination).toEqual({ totalInventories: 1, currentPage: 1, totalPages: 1, limit: 10 });
    expect(result.inventories[0]).toEqual(expect.objectContaining({ sku: 'sku-4', available: 4 }));
  });

  it('returns availability information without mutating stock', async () => {
    Inventory.findOne.mockReturnValue(createQueryMock({ sku: 'sku-2', stock: 5, reserved: 1 }));

    const result = await inventoryService.checkStock('sku-2', 3);

    expect(result).toEqual({
      sku: 'sku-2',
      available: true,
      currentStock: 5,
      reserved: 1,
      availableStock: 4,
      requestedQuantity: 3,
    });
  });
});
