const request = require('supertest');
const app = require('../../../app');
const User = require('../../../models/User');

const getAdminToken = async () => {
  await User.create({
    name: 'Admin',
    email: 'admin-users@test.com',
    password: 'adminpass',
    isAdmin: true,
  });

  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin-users@test.com', password: 'adminpass' });

  return res.body.data.token;
};

describe('GET /api/admin/users', () => {
  it('returns inactive users and counts them in pagination', async () => {
    const adminToken = await getAdminToken();
    await User.create({
      name: 'Active User',
      email: 'active-admin-list@test.com',
      password: '123456',
      isActive: true,
    });
    await User.create({
      name: 'Inactive User',
      email: 'inactive-admin-list@test.com',
      password: '123456',
      isActive: false,
      deletedAt: new Date(),
    });

    const res = await request(app)
      .get('/api/admin/users?limit=10')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.meta.totalUsers).toBe(3);
    expect(res.body.data.map((user) => user.email)).toEqual(
      expect.arrayContaining([
        'admin-users@test.com',
        'active-admin-list@test.com',
        'inactive-admin-list@test.com',
      ])
    );
  });
});
