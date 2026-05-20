jest.mock('../../../models/User');
jest.mock('../../../models/LoginLog');
jest.mock('../../../models/PasswordResetToken');
jest.mock('../../../utils/generateToken', () => ({
  generateToken: jest.fn(),
  generateRefreshToken: jest.fn(),
}));
jest.mock('../../../utils/sendEmail', () => jest.fn());
jest.mock('../../../utils/dto', () => ({
  userDTO: jest.fn((user) => ({ _id: user._id, email: user.email, name: user.name })),
}));

const mongoose = require('mongoose');
const User = require('../../../models/User');
const LoginLog = require('../../../models/LoginLog');
const PasswordResetToken = require('../../../models/PasswordResetToken');
const { generateToken, generateRefreshToken } = require('../../../utils/generateToken');
const sendEmail = require('../../../utils/sendEmail');
const authService = require('../../../services/authService');
const { createQueryMock, createSessionMock } = require('../utils/testHelpers');

describe('authService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mongoose.startSession = jest.fn().mockResolvedValue(createSessionMock());
  });

  describe('registerUser', () => {
    it('creates a user and token when email is available', async () => {
      User.findOne.mockResolvedValue(null);
      User.create.mockResolvedValue({ _id: 'user-1', email: 'john@example.com', name: 'John' });
      generateToken.mockReturnValue('jwt-token');
      generateRefreshToken.mockReturnValue('refresh-token');

      const result = await authService.registerUser({
        name: 'John',
        email: 'john@example.com',
        password: 'secret',
        phone: '0900000000',
      });

      expect(User.create).toHaveBeenCalledWith({
        name: 'John',
        email: 'john@example.com',
        password: 'secret',
        phone: '0900000000',
      });
      expect(generateToken).toHaveBeenCalledWith('user-1');
      expect(generateRefreshToken).toHaveBeenCalledWith('user-1');
      expect(result).toEqual({
        user: { _id: 'user-1', email: 'john@example.com', name: 'John' },
        token: 'jwt-token',
        refreshToken: 'refresh-token',
      });
    });

    it('throws 409 when email already exists', async () => {
      User.findOne.mockResolvedValue({ _id: 'existing-user' });

      await expect(authService.registerUser({ email: 'john@example.com' })).rejects.toMatchObject({
        statusCode: 409,
      });
    });
  });

  describe('loginUser', () => {
    it('rejects brute-force attempts before querying user credentials', async () => {
      LoginLog.isBruteForceAttack.mockResolvedValue(true);

      await expect(authService.loginUser('locked@example.com', 'secret')).rejects.toMatchObject({
        statusCode: 429,
      });
      expect(User.findOne).not.toHaveBeenCalled();
    });

    it('records failed login when the user does not exist', async () => {
      LoginLog.isBruteForceAttack.mockResolvedValue(false);
      User.findOne.mockResolvedValue(null);

      await expect(
        authService.loginUser('missing@example.com', 'secret', { ipAddress: '127.0.0.1', userAgent: 'jest' })
      ).rejects.toMatchObject({ statusCode: 401 });

      expect(LoginLog.recordLog).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'missing@example.com',
          status: 'failed',
          failureReason: 'Email không tồn tại',
        })
      );
    });

    it('returns DTO and token on successful login', async () => {
      const user = {
        _id: 'user-2',
        email: 'login@example.com',
        name: 'Login User',
        isActive: true,
        matchPassword: jest.fn().mockResolvedValue(true),
      };

      LoginLog.isBruteForceAttack.mockResolvedValue(false);
      User.findOne.mockResolvedValue(user);
      generateToken.mockReturnValue('login-token');
      generateRefreshToken.mockReturnValue('login-refresh-token');

      const result = await authService.loginUser('login@example.com', '123456', {
        ipAddress: '127.0.0.1',
        userAgent: 'jest',
      });

      expect(user.matchPassword).toHaveBeenCalledWith('123456');
      expect(LoginLog.recordLog).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'success', email: 'login@example.com' })
      );
      expect(result).toEqual({
        user: { _id: 'user-2', email: 'login@example.com', name: 'Login User' },
        token: 'login-token',
        refreshToken: 'login-refresh-token',
      });
    });
  });

  describe('requestPasswordReset', () => {
    it('silently ignores admin accounts in password reset flow', async () => {
      User.findOne.mockResolvedValue({ isAdmin: true });

      await expect(authService.requestPasswordReset('admin@example.com')).resolves.toBeUndefined();
      expect(PasswordResetToken.deleteMany).not.toHaveBeenCalled();
      expect(PasswordResetToken.create).not.toHaveBeenCalled();
      expect(sendEmail).not.toHaveBeenCalled();
    });

    it('rolls back reset tokens when sending email fails', async () => {
      User.findOne.mockResolvedValue({ isAdmin: false });
      sendEmail.mockRejectedValue(new Error('SMTP unavailable'));

      await expect(authService.requestPasswordReset('user@example.com')).rejects.toMatchObject({
        statusCode: 500,
      });

      expect(PasswordResetToken.create).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'user@example.com' })
      );
      expect(PasswordResetToken.deleteMany).toHaveBeenCalledTimes(2);
    });
  });

  describe('resetPassword', () => {
    it('updates password and removes reset tokens for valid requests', async () => {
      const session = createSessionMock();
      const user = {
        password: 'old-password',
        save: jest.fn().mockResolvedValue(undefined),
      };

      mongoose.startSession.mockResolvedValue(session);
      PasswordResetToken.findOne.mockReturnValue(createQueryMock({ email: 'reset@example.com' }));
      User.findOne.mockReturnValue(createQueryMock(user));

      await authService.resetPassword('raw-token', 'new-password');

      expect(user.password).toBe('new-password');
      expect(user.save).toHaveBeenCalledWith({ session });
      expect(PasswordResetToken.deleteMany).toHaveBeenCalledWith({ email: 'reset@example.com' }, { session });
    });

    it('throws 400 when token is invalid or expired', async () => {
      PasswordResetToken.findOne.mockReturnValue(createQueryMock(null));

      await expect(authService.resetPassword('bad-token', 'new-password')).rejects.toMatchObject({
        statusCode: 400,
      });
    });
  });
});
