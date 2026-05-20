const request = require('supertest');
const app = require('../../../app');
const Category = require('../../../models/Category');

describe('GET /api/categories/:id', () => {
  it('does not expose inactive categories on the public detail endpoint', async () => {
    const category = await Category.create({
      name: 'Inactive Category',
      isActive: false,
    });

    const res = await request(app).get(`/api/categories/${category._id}`);

    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
  });
});
