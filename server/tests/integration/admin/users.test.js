const request = require('supertest');
const app = require('../../../app');
const User = require('../../../models/User');

const getAdminToken = async () => {
  const admin = await User.create({
    name: 'Admin',
    email: 'admin-users@test.com',
    password: 'adminpass',
    isAdmin: true,
  });

  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin-users@test.com', password: 'adminpass' });

  return { token: res.body.data.token, adminId: admin._id };
};

describe('GET /api/admin/users', () => {
  it('returns inactive customer users and excludes admin accounts from pagination', async () => {
    const adminSession = await getAdminToken();
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
      .set('Authorization', `Bearer ${adminSession.token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.meta.totalUsers).toBe(2);
    expect(res.body.data.map((user) => user.email)).toEqual(
      expect.arrayContaining([
        'active-admin-list@test.com',
        'inactive-admin-list@test.com',
      ])
    );
    expect(res.body.data.map((user) => user.email)).not.toContain('admin-users@test.com');
  });

  it('blocks direct admin account detail and status changes', async () => {
    const adminSession = await getAdminToken();

    const detailRes = await request(app)
      .get(`/api/admin/users/${adminSession.adminId}`)
      .set('Authorization', `Bearer ${adminSession.token}`);
    const toggleRes = await request(app)
      .put(`/api/admin/users/${adminSession.adminId}/toggle-status`)
      .set('Authorization', `Bearer ${adminSession.token}`);

    expect(detailRes.statusCode).toBe(403);
    expect(toggleRes.statusCode).toBe(403);
  });
});
