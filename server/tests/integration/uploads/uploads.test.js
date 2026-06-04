const request = require('supertest');
const app = require('../../../app');
const User = require('../../../models/User');

const getAdminToken = async () => {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const email = `upload-admin-${suffix}@test.com`;

  await User.create({
    name: 'Upload Admin',
    email,
    password: 'adminpass',
    isAdmin: true,
  });

  const res = await request(app)
    .post('/api/auth/login')
    .send({ email, password: 'adminpass' });

  return res.body.data.token;
};

describe('POST /api/uploads/images', () => {
  it('keeps the single upload endpoint available', async () => {
    const token = await getAdminToken();

    const res = await request(app)
      .post('/api/uploads/images')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('does not expose the old admin upload endpoint', async () => {
    const token = await getAdminToken();

    const res = await request(app)
      .post('/api/admin/uploads/images')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
  });
});
