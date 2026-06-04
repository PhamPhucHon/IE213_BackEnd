jest.mock('../../../models/Category');
jest.mock('../../../utils/dto', () => ({
  categoryDTO: jest.fn((category) => ({ _id: category._id, name: category.name })),
}));

const Category = require('../../../models/Category');
const categoryService = require('../../../services/categoryService');
const { createQueryMock } = require('../utils/testHelpers');

describe('categoryService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns active categories sorted by order', async () => {
    Category.find.mockReturnValue(createQueryMock([{ _id: 'cat-1', name: 'Eyeglasses' }]));

    const result = await categoryService.getAllCategories();

    expect(Category.find).toHaveBeenCalledWith({ isActive: true });
    expect(result).toEqual([{ _id: 'cat-1', name: 'Eyeglasses' }]);
  });

  it('returns a category by id and slug', async () => {
    Category.findOne
      .mockResolvedValueOnce({ _id: 'cat-1', name: 'Eyeglasses' })
      .mockResolvedValueOnce({ _id: 'cat-2', name: 'Sunglasses' });

    const byId = await categoryService.getCategoryById('cat-1');
    const bySlug = await categoryService.getCategoryBySlug('sun');

    expect(Category.findOne).toHaveBeenNthCalledWith(1, { _id: 'cat-1', isActive: true });
    expect(Category.findOne).toHaveBeenNthCalledWith(2, { slug: 'sun', isActive: true });
    expect(byId).toEqual({ _id: 'cat-1', name: 'Eyeglasses' });
    expect(bySlug).toEqual({ _id: 'cat-2', name: 'Sunglasses' });
  });

  it('throws 404 when category by id is inactive or missing', async () => {
    Category.findOne.mockResolvedValue(null);

    await expect(categoryService.getCategoryById('inactive-cat')).rejects.toMatchObject({
      statusCode: 404,
    });
    expect(Category.findOne).toHaveBeenCalledWith({ _id: 'inactive-cat', isActive: true });
  });

  it('rejects duplicate category names on create', async () => {
    Category.findOne.mockResolvedValue({ _id: 'cat-dup' });

    await expect(categoryService.createCategory({ name: 'Frames' })).rejects.toMatchObject({
      statusCode: 409,
    });
  });

  it('creates a category with the next display order when its name is unique', async () => {
    const latestOrderQuery = createQueryMock({ order: 7 });
    Category.findOne
      .mockResolvedValueOnce(null)
      .mockReturnValueOnce(latestOrderQuery);
    Category.create.mockResolvedValue({ _id: 'cat-3', name: 'Accessories', order: 8 });

    const result = await categoryService.createCategory({ name: 'Accessories', order: 99 });

    expect(Category.findOne).toHaveBeenNthCalledWith(1, { name: 'Accessories' });
    expect(Category.findOne).toHaveBeenNthCalledWith(2, {});
    expect(latestOrderQuery.sort).toHaveBeenCalledWith({ order: -1 });
    expect(latestOrderQuery.select).toHaveBeenCalledWith('order');
    expect(Category.create).toHaveBeenCalledWith({ name: 'Accessories', order: 8 });
    expect(result).toEqual({ _id: 'cat-3', name: 'Accessories' });
  });

  it('updates mutable fields and saves the category', async () => {
    const categoryDoc = {
      _id: 'cat-1',
      name: 'Frames',
      description: 'Old description',
      save: jest.fn().mockResolvedValue(undefined),
    };
    categoryDoc.save.mockResolvedValue(categoryDoc);
    Category.findById.mockResolvedValue(categoryDoc);
    Category.findOne.mockResolvedValue(null);

    const result = await categoryService.updateCategory('cat-1', {
      name: 'New Frames',
      description: 'Updated description',
      order: 5,
    });

    expect(categoryDoc.name).toBe('New Frames');
    expect(categoryDoc.description).toBe('Updated description');
    expect(categoryDoc.order).toBe(5);
    expect(categoryDoc.save).toHaveBeenCalled();
    expect(result).toEqual({ _id: 'cat-1', name: 'New Frames' });
  });

  it('throws 404 when deleting a missing category', async () => {
    Category.findById.mockResolvedValue(null);

    await expect(categoryService.deleteCategory('missing-cat')).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it('deletes an existing category', async () => {
    Category.findById.mockResolvedValue({ _id: 'cat-4' });

    const result = await categoryService.deleteCategory('cat-4');

    expect(Category.findByIdAndDelete).toHaveBeenCalledWith('cat-4');
    expect(result).toEqual({ message: 'Đã xóa danh mục thành công.' });
  });
});
