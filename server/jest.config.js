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

  // Coverage cho các lớp business logic chính
  collectCoverageFrom: [
    'services/**/*.js',
    'utils/apiResponse.js',
    'models/Cart.js',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },

  // Xoá mock giữa các test
  clearMocks: true,
};
