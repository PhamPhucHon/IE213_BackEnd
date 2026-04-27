// tests/auth.test.js
jest.mock('../../../utils/sendEmail', () => jest.fn().mockResolvedValue({ messageId: 'mocked-message-id' }));

const crypto = require('crypto');
const request = require('supertest');
const app = require('../../../app');
const User = require('../../../models/User');
const PasswordResetToken = require('../../../models/PasswordResetToken');
const sendEmail = require('../../../utils/sendEmail');

describe('POST /api/auth/register', () => {
  const validUser = {
    name: 'Test User',
    email: 'test@example.com',
    password: '123456',
  };

  it('should register successfully with valid data', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(validUser);

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('token');
    expect(res.body.data.user.email).toBe(validUser.email);
    // Không trả về password
    expect(res.body.data.user.password).toBeUndefined();
  });

  it('should return 422 if email is missing', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'A', password: '123456' });

    expect(res.statusCode).toBe(422);
    expect(res.body.success).toBe(false);
  });

  it('should return 409 if email already exists', async () => {
    // Đăng ký lần 1
    await request(app).post('/api/auth/register').send(validUser);
    // Đăng ký lại cùng email
    const res = await request(app)
      .post('/api/auth/register')
      .send(validUser);

    expect(res.statusCode).toBe(409);
    expect(res.body.success).toBe(false);
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    // Tạo sẵn 1 user để test login
    await request(app).post('/api/auth/register').send({
      name: 'Login User',
      email: 'login@example.com',
      password: '123456',
    });
  });

  it('should login successfully with correct credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login@example.com', password: '123456' });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('token');
  });

  it('should return 401 with wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login@example.com', password: 'wrong' });

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should return 401 with non-existent email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'notexist@example.com', password: '123456' });

    expect(res.statusCode).toBe(401);
  });
});

describe('GET /api/auth/me', () => {
  let token;

  beforeEach(async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Me User',
      email: 'me@example.com',
      password: '123456',
    });
    token = res.body.data.token;
  });

  it('should return current user when authenticated', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.email).toBe('me@example.com');
  });

  it('should return 401 without token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.statusCode).toBe(401);
  });
});

describe('POST /api/auth/forgot-password', () => {
  it('should create a reset token and send email for normal user', async () => {
    await User.create({
      name: 'Normal User',
      email: 'normal@example.com',
      password: '123456',
      isAdmin: false,
    });

    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'normal@example.com' });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Email đặt lại mật khẩu đã được gửi');

    const tokenDoc = await PasswordResetToken.findOne({ email: 'normal@example.com' });
    expect(tokenDoc).toBeTruthy();
    expect(sendEmail).toHaveBeenCalledTimes(1);
    expect(sendEmail.mock.calls[0][0].email).toBe('normal@example.com');
    expect(sendEmail.mock.calls[0][0].html).toContain('token=');
  });

  it('should return 403 and not create token for admin account', async () => {
    await User.create({
      name: 'Admin User',
      email: 'admin-reset@example.com',
      password: '123456',
      isAdmin: true,
    });

    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'admin-reset@example.com' });

    expect(res.statusCode).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Tai khoan admin khong duoc phep su dung tinh nang quen mat khau.');
    expect(await PasswordResetToken.findOne({ email: 'admin-reset@example.com' })).toBeNull();
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('should respond success even when email does not exist', async () => {
    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'missing-user@example.com' });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Email đặt lại mật khẩu đã được gửi');
    expect(await PasswordResetToken.findOne({ email: 'missing-user@example.com' })).toBeNull();
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('should keep only one active token per email', async () => {
    await User.create({
      name: 'Single Token User',
      email: 'single-token@example.com',
      password: '123456',
      isAdmin: false,
    });

    await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'single-token@example.com' });

    const firstTokenDoc = await PasswordResetToken.findOne({ email: 'single-token@example.com' });
    expect(firstTokenDoc).toBeTruthy();

    await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'single-token@example.com' });

    const allDocs = await PasswordResetToken.find({ email: 'single-token@example.com' });
    expect(allDocs).toHaveLength(1);
    expect(String(allDocs[0]._id)).not.toBe(String(firstTokenDoc._id));
  });

  it('should rate limit repeated forgot password requests', async () => {
    await User.create({
      name: 'Rate Limit User',
      email: 'rate-limit@example.com',
      password: '123456',
      isAdmin: false,
    });

    for (let index = 0; index < 3; index += 1) {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'rate-limit@example.com' });

      expect(res.statusCode).toBe(200);
    }

    const blockedRes = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'rate-limit@example.com' });

    expect(blockedRes.statusCode).toBe(429);
    expect(blockedRes.body.success).toBe(false);
  });
});

describe('POST /api/auth/reset-password', () => {
  it('should reset password successfully for normal user and delete token', async () => {
    await User.create({
      name: 'Reset User',
      email: 'reset-user@example.com',
      password: '123456',
      isAdmin: false,
    });

    await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'reset-user@example.com' });

    const html = sendEmail.mock.calls[0][0].html;
    const tokenMatch = html.match(/token=([a-f0-9]+)/i);
    const rawToken = tokenMatch?.[1];

    const resetRes = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: rawToken, newPassword: 'newpass123' });

    expect(resetRes.statusCode).toBe(200);
    expect(resetRes.body.success).toBe(true);
    expect(await PasswordResetToken.findOne({ email: 'reset-user@example.com' })).toBeNull();

    const oldLoginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'reset-user@example.com', password: '123456' });
    expect(oldLoginRes.statusCode).toBe(401);

    const newLoginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'reset-user@example.com', password: 'newpass123' });
    expect(newLoginRes.statusCode).toBe(200);
  });

  it('should reject expired reset token', async () => {
    await User.create({
      name: 'Expired User',
      email: 'expired@example.com',
      password: '123456',
      isAdmin: false,
    });

    const rawToken = 'expired-token';
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    await PasswordResetToken.create({
      email: 'expired@example.com',
      token: hashedToken,
      expiresAt: new Date(Date.now() - 60 * 1000),
    });

    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: rawToken, newPassword: 'newpass123' });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
