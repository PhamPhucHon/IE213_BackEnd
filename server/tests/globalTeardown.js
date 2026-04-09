// tests/globalTeardown.js
// Chạy 1 lần sau khi toàn bộ test suite kết thúc
module.exports = async () => {
  if (global.__MONGOD__) {
    await global.__MONGOD__.stop();
  }
};
