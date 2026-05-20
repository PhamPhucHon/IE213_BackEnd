const User = require('../../../models/User');
require('../../../models/Cart');

describe('User model', () => {
  it('persists deletedAt for soft-deleted users', async () => {
    const user = await User.create({
      name: 'Soft Deleted User',
      email: 'soft-deleted@example.com',
      password: '123456',
    });
    const deletedAt = new Date();

    user.isActive = false;
    user.deletedAt = deletedAt;
    await user.save();

    const savedUser = await User.findById(user._id).setOptions({ includeInactive: true });
    expect(savedUser.deletedAt).toBeInstanceOf(Date);
    expect(savedUser.deletedAt.toISOString()).toBe(deletedAt.toISOString());
  });
});
