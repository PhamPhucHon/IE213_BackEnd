// config/db.js
const mongoose = require('mongoose');
const config = require('./env');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(config.mongodbUri, {
      // Các tùy chọn cho Mongoose 6+ (không cần useNewUrlParser... nữa)
      // Tuy nhiên vẫn có thể thêm một số option:
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

// Xử lý sự kiện kết nối
mongoose.connection.on('disconnected', () => {
  console.log('⚠️ MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
  console.error(`⚠️ MongoDB error: ${err}`);
});

module.exports = connectDB;