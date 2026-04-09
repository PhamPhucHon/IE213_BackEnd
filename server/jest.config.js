/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',

  // Tìm test files trong thư mục tests/
  testMatch: ['**/tests/**/*.test.js'],

  // Chạy file setup trước mỗi test suite
  globalSetup: './tests/globalSetup.js',
  globalTeardown: './tests/globalTeardown.js',
  setupFilesAfterEnv: ['./tests/setup.js'],

  // Timeout mỗi test (ms)
  testTimeout: 30000,

  // Hiển thị kết quả chi tiết
  verbose: true,

  // Xoá mock giữa các test
  clearMocks: true,
};
