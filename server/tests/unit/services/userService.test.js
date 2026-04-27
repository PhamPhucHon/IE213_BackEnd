jest.mock('../../../models/User');
jest.mock('../../../models/Order');
jest.mock('../../../utils/dto', () => ({
  userDTO: jest.fn((user) => ({ _id: user._id, name: user.name, phone: user.phone })),
}));

const User = require('../../../models/User');
const Order = require('../../../models/Order');
const userService = require('../../../services/userService');
const { createQueryMock } = require('../utils/testHelpers');

const createAddresses = (...items) => {
  const addresses = [...items];
  addresses.id = jest.fn((addressId) => addresses.find((item) => item._id === addressId) || null);
  addresses.pull = jest.fn((addressId) => {
    const index = addresses.findIndex((item) => item._id === addressId);
    if (index >= 0) {
      addresses.splice(index, 1);
    }
  });
  return addresses;
};

describe('userService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns paginated users for admin screens', async () => {
    User.find.mockReturnValue(createQueryMock([{ _id: 'user-1', name: 'Alice' }]));
    User.countDocuments.mockResolvedValue(1);

    const result = await userService.getAllUsers(1, 10);

    expect(result.pagination).toEqual({ totalUsers: 1, currentPage: 1, totalPages: 1, limit: 10 });
    expect(result.users).toEqual([{ _id: 'user-1', name: 'Alice' }]);
  });

  it('returns the current user profile by id', async () => {
    User.findById.mockResolvedValue({ _id: 'user-1', name: 'Alice', phone: '0901' });

    const result = await userService.getUserProfile('user-1');

    expect(result).toEqual({ _id: 'user-1', name: 'Alice', phone: '0901' });
  });

  it('updates only whitelisted profile fields', async () => {
    User.findByIdAndUpdate.mockReturnValue(createQueryMock({ _id: 'user-1', name: 'Alice', phone: '0901' }));

    const result = await userService.updateUserProfile('user-1', {
      name: 'Alice',
      phone: '0901',
      email: 'should-not-update@example.com',
    });

    expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
      'user-1',
      { $set: { name: 'Alice', phone: '0901' } },
      expect.objectContaining({ returnDocument: 'after', runValidators: true })
    );
    expect(result).toEqual({ _id: 'user-1', name: 'Alice', phone: '0901' });
  });

  it('rejects password changes when the current password is incorrect', async () => {
    User.findById.mockResolvedValue({ matchPassword: jest.fn().mockResolvedValue(false) });

    await expect(userService.changeUserPassword('user-1', 'wrong', 'newpass')).rejects.toMatchObject({
      statusCode: 401,
    });
  });

  it('changes password when the current password matches', async () => {
    const userDoc = {
      matchPassword: jest.fn().mockResolvedValue(true),
      save: jest.fn().mockResolvedValue(undefined),
    };
    User.findById.mockResolvedValue(userDoc);

    const result = await userService.changeUserPassword('user-1', 'oldpass', 'newpass');

    expect(userDoc.password).toBe('newpass');
    expect(userDoc.save).toHaveBeenCalled();
    expect(result).toEqual({ message: 'Đổi mật khẩu thành công.' });
  });

  it('marks the first address as default when adding it', async () => {
    const userDoc = {
      addresses: [],
      save: jest.fn().mockResolvedValue(undefined),
    };
    User.findById.mockResolvedValue(userDoc);

    const result = await userService.addAddress('user-1', { label: 'Home', address: '123 Street' });

    expect(result[0]).toEqual(expect.objectContaining({ label: 'Home', address: '123 Street', isDefault: true }));
    expect(userDoc.save).toHaveBeenCalled();
  });

  it('updates an address and promotes it to default when requested', async () => {
    const addresses = createAddresses(
      { _id: 'addr-1', label: 'Home', address: 'Old', isDefault: true },
      { _id: 'addr-2', label: 'Work', address: 'Office', isDefault: false }
    );
    const userDoc = { addresses, save: jest.fn().mockResolvedValue(undefined) };
    User.findById.mockResolvedValue(userDoc);

    const result = await userService.updateAddress('user-1', 'addr-2', {
      label: 'HQ',
      address: 'New Office',
      isDefault: true,
    });

    expect(result[0].isDefault).toBe(false);
    expect(result[1]).toEqual(expect.objectContaining({ label: 'HQ', address: 'New Office', isDefault: true }));
  });

  it('deletes the default address and promotes the next one', async () => {
    const addresses = createAddresses(
      { _id: 'addr-1', label: 'Home', isDefault: true },
      { _id: 'addr-2', label: 'Work', isDefault: false }
    );
    const userDoc = { addresses, save: jest.fn().mockResolvedValue(undefined) };
    User.findById.mockResolvedValue(userDoc);

    const result = await userService.deleteAddress('user-1', 'addr-1');

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(expect.objectContaining({ _id: 'addr-2', isDefault: true }));
  });

  it('sets an address as the only default address', async () => {
    const addresses = createAddresses(
      { _id: 'addr-1', label: 'Home', isDefault: true },
      { _id: 'addr-2', label: 'Work', isDefault: false }
    );
    const userDoc = { addresses, save: jest.fn().mockResolvedValue(undefined) };
    User.findById.mockResolvedValue(userDoc);

    const result = await userService.setDefaultAddress('user-1', 'addr-2');

    expect(result[0].isDefault).toBe(false);
    expect(result[1].isDefault).toBe(true);
  });

  it('returns the saved addresses list', async () => {
    User.findById.mockReturnValue(createQueryMock({ addresses: [{ _id: 'addr-1' }] }));

    const result = await userService.getAddresses('user-1');

    expect(result).toEqual([{ _id: 'addr-1' }]);
  });

  it('blocks account deletion when the user still has pending orders', async () => {
    User.findById.mockResolvedValue({ _id: 'user-1', save: jest.fn() });
    Order.findOne.mockResolvedValue({ _id: 'order-1' });

    await expect(userService.deleteOwnAccount('user-1')).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it('soft deletes the account when no pending orders remain', async () => {
    const userDoc = { _id: 'user-1', isActive: true, save: jest.fn().mockResolvedValue(undefined) };
    User.findById.mockResolvedValue(userDoc);
    Order.findOne.mockResolvedValue(null);

    const result = await userService.deleteOwnAccount('user-1');

    expect(userDoc.isActive).toBe(false);
    expect(userDoc.deletedAt).toBeInstanceOf(Date);
    expect(userDoc.save).toHaveBeenCalled();
    expect(result).toEqual({ message: 'Tài khoản đã được vô hiệu hóa' });
  });
});