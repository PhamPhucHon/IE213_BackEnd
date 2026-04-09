// tests/globalSetup.js
// Chạy 1 lần trước khi toàn bộ test suite bắt đầu
const { MongoMemoryReplSet } = require('mongodb-memory-server');

module.exports = async () => {
  // Dùng Replica Set để hỗ trợ MongoDB Transactions
  const replset = await MongoMemoryReplSet.create({
    replSet: { count: 1 },
  });
  const uri = replset.getUri();

  process.env.MONGODB_URI = uri;
  global.__MONGOD__ = replset;
};
