// tests/setup.js
// Chạy sau khi mỗi test file được load (setupFilesAfterFramework)
const mongoose = require('mongoose');

beforeAll(async () => {
  // Kết nối tới MongoDB Memory Server
  await mongoose.connect(process.env.MONGODB_URI);
});

afterAll(async () => {
  // Đóng kết nối sau mỗi test file
  await mongoose.disconnect();
});

afterEach(async () => {
  // Xoá toàn bộ data sau mỗi test để test độc lập nhau
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});
