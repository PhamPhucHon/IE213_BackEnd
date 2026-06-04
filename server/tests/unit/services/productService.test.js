jest.mock('../../../models/Product');
jest.mock('../../../models/Inventory');
jest.mock('../../../models/Review');
jest.mock('../../../utils/dto', () => ({
  productDTO: jest.fn((product) => ({ _id: product._id, name: product.name, variants: product.variants || [] })),
}));

const mongoose = require('mongoose');
const Product = require('../../../models/Product');
const Inventory = require('../../../models/Inventory');
const Review = require('../../../models/Review');
const productService = require('../../../services/productService');
const { createQueryMock, createSessionMock } = require('../utils/testHelpers');

describe('productService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mongoose.startSession = jest.fn().mockResolvedValue(createSessionMock());
  });

  it('rejects duplicated sku values in a single create request', async () => {
    await expect(
      productService.createProduct({
        variants: [
          { sku: 'dup-sku', price: 1000 },
          { sku: 'dup-sku', price: 2000 },
        ],
      })
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it('creates a product and matching inventory docs in test environment', async () => {
    Inventory.findOne.mockResolvedValue(null);
    Product.create.mockResolvedValue({
      _id: 'product-1',
      name: 'New Product',
      variants: [{ sku: 'sku-1' }, { sku: 'sku-2' }],
    });

    const result = await productService.createProduct({
      name: 'New Product',
      variants: [{ sku: 'sku-1' }, { sku: 'sku-2' }],
    });

    expect(Inventory.insertMany).toHaveBeenCalledWith([
      { sku: 'sku-1', productId: 'product-1', stock: 0, reserved: 0 },
      { sku: 'sku-2', productId: 'product-1', stock: 0, reserved: 0 },
    ]);
    expect(result).toEqual({ _id: 'product-1', name: 'New Product', variants: [{ sku: 'sku-1' }, { sku: 'sku-2' }] });
  });

  it('returns paginated products for the storefront', async () => {
    Product.find.mockReturnValue(createQueryMock([{ _id: 'product-1', name: 'Store Product', variants: [] }]));
    Product.countDocuments.mockResolvedValue(1);

    const result = await productService.getProducts({ keyword: 'store', type: 'Sunglasses' }, 1, 12, 'newest');

    expect(Product.find).toHaveBeenCalledWith(expect.objectContaining({
      isActive: true,
      name: { $regex: 'store', $options: 'i' },
      type: 'Sunglasses',
    }));
    expect(result.pagination.totalProducts).toBe(1);
  });

  it('returns product detail by id and slug', async () => {
    Product.findOne
      .mockReturnValueOnce(createQueryMock({ _id: 'product-1', name: 'Detail Product', variants: [] }))
      .mockReturnValueOnce(createQueryMock({ _id: 'product-2', name: 'Slug Product', variants: [] }));

    const byId = await productService.getProductById('product-1');
    const bySlug = await productService.getProductBySlug('slug-product');

    expect(Product.findOne).toHaveBeenNthCalledWith(1, { _id: 'product-1', isActive: true });
    expect(Product.findOne).toHaveBeenNthCalledWith(2, { slug: 'slug-product', isActive: true });
    expect(byId).toEqual({ _id: 'product-1', name: 'Detail Product', variants: [] });
    expect(bySlug).toEqual({ _id: 'product-2', name: 'Slug Product', variants: [] });
  });

  it('throws 404 when product detail by id is inactive or missing', async () => {
    Product.findOne.mockReturnValue(createQueryMock(null));

    await expect(productService.getProductById('inactive-product')).rejects.toMatchObject({
      statusCode: 404,
    });
    expect(Product.findOne).toHaveBeenCalledWith({ _id: 'inactive-product', isActive: true });
  });

  it('blocks removing variants that still have reserved stock', async () => {
    const session = createSessionMock();
    const productDoc = {
      _id: 'product-1',
      name: 'Existing Product',
      variants: [{ sku: 'sku-old' }, { sku: 'sku-keep' }],
      save: jest.fn(),
    };

    mongoose.startSession.mockResolvedValue(session);
    Product.findById.mockReturnValue(createQueryMock(productDoc));
    Inventory.findOne.mockReturnValue(createQueryMock({ sku: 'sku-old', reserved: 2 }));

    await expect(
      productService.updateProduct('product-1', { variants: [{ sku: 'sku-keep' }] })
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  it('adds inventory rows for new variants and persists allowed fields on update', async () => {
    const session = createSessionMock();
    const productDoc = {
      _id: 'product-1',
      name: 'Existing Product',
      variants: [{ sku: 'sku-old' }],
      save: jest.fn().mockResolvedValue(undefined),
    };
    productDoc.save.mockResolvedValue(productDoc);
    mongoose.startSession.mockResolvedValue(session);
    Product.findById.mockReturnValue(createQueryMock(productDoc));
    Inventory.findOne.mockReturnValue(createQueryMock(null));

    const result = await productService.updateProduct('product-1', {
      name: 'Updated Product',
      variants: [{ sku: 'sku-old' }, { sku: 'sku-new' }],
    });

    expect(Inventory.insertMany).toHaveBeenCalledWith(
      [{ sku: 'sku-new', productId: 'product-1', stock: 0, reserved: 0 }],
      { session }
    );
    expect(productDoc.name).toBe('Updated Product');
    expect(result).toEqual({ _id: 'product-1', name: 'Updated Product', variants: [{ sku: 'sku-old' }, { sku: 'sku-new' }] });
  });

  it('soft deletes the product without removing inventory rows', async () => {
    const session = createSessionMock();
    const productDoc = {
      _id: 'product-1',
      isActive: true,
      variants: [{ sku: 'sku-1' }, { sku: 'sku-2' }],
      save: jest.fn().mockResolvedValue(undefined),
    };

    mongoose.startSession.mockResolvedValue(session);
    Product.findById.mockReturnValue(createQueryMock(productDoc));
    Inventory.findOne.mockReturnValue(createQueryMock(null));

    const result = await productService.deleteProduct('product-1');

    expect(productDoc.isActive).toBe(false);
    expect(productDoc.save).toHaveBeenCalledWith({ session });
    expect(Inventory.deleteMany).not.toHaveBeenCalled();
    expect(Product.findByIdAndDelete).not.toHaveBeenCalled();
    expect(result.message).toContain('Đã ẩn sản phẩm');
  });

  it('resets rating stats when a product has no reviews left', async () => {
    Review.aggregate.mockResolvedValue([]);

    await productService.updateRatingStats('507f1f77bcf86cd799439011');

    expect(Review.aggregate).toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({
        $match: expect.objectContaining({ isApproved: true }),
      }),
    ]));
    expect(Product.findByIdAndUpdate).toHaveBeenCalledWith('507f1f77bcf86cd799439011', {
      rating: { avg: 0, count: 0 },
    });
  });

  it('updates rating stats with the aggregated review average', async () => {
    Review.aggregate.mockResolvedValue([{ avgRating: 4.44, totalReviews: 3 }]);

    await productService.updateRatingStats('507f1f77bcf86cd799439011');

    expect(Product.findByIdAndUpdate).toHaveBeenCalledWith('507f1f77bcf86cd799439011', {
      rating: { avg: 4.4, count: 3 },
    });
  });
});
