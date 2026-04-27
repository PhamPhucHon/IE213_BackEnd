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
    Category.findById.mockResolvedValue({ _id: 'cat-1', name: 'Eyeglasses' });
    Category.findOne.mockResolvedValue({ _id: 'cat-2', name: 'Sunglasses' });

    const byId = await categoryService.getCategoryById('cat-1');
    const bySlug = await categoryService.getCategoryBySlug('sun');

    expect(byId).toEqual({ _id: 'cat-1', name: 'Eyeglasses' });
    expect(bySlug).toEqual({ _id: 'cat-2', name: 'Sunglasses' });
  });

  it('rejects duplicate category names on create', async () => {
    Category.findOne.mockResolvedValue({ _id: 'cat-dup' });

    await expect(categoryService.createCategory({ name: 'Frames' })).rejects.toMatchObject({
      statusCode: 409,
    });
  });

  it('creates a category when its name is unique', async () => {
    Category.findOne.mockResolvedValue(null);
    Category.create.mockResolvedValue({ _id: 'cat-3', name: 'Accessories' });

    const result = await categoryService.createCategory({ name: 'Accessories' });

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