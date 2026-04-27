// config/db.js
const mongoose = require('mongoose');
const config = require('./env');
const logger = require('./logger').child({ component: 'database' });

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(config.mongodbUri, {
      // Các tùy chọn cho Mongoose 6+ (không cần useNewUrlParser... nữa)
      // Tuy nhiên vẫn có thể thêm một số option:
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    logger.info('MongoDB connected', { host: conn.connection.host });
  } catch (error) {
    logger.error('MongoDB connection error', { error: error.message });
    process.exit(1);
  }
};

// Xử lý sự kiện kết nối
mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
  logger.error('MongoDB emitted an error event', { error: err.message });
});

module.exports = connectDB;