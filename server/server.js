const express = require('express');
const connectDB = require('./config/db');
const config = require('./config/env');
// Swagger setup
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger-output.json');

const { notFound, errorHandler } = require('./middleware/errorMiddleware');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const productRoutes = require('./routes/productRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

app.use(express.json({ limit: '2mb' }));
// Cấu hình Swagger UI tại đường dẫn /api-docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
	return res.status(200).json({
		success: true,
		message: 'IE213 Backend API is running',
	});
});

app.get('/api', (req, res) => {
	return res.status(200).json({
		success: true,
		message: 'API base path is available',
	});
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/admin', adminRoutes);

app.use(notFound);
app.use(errorHandler);

const startServer = async () => {
	await connectDB();
	app.listen(config.port, () => {
		console.log(`🚀 Server đang chạy tại http://localhost:${config.port}`);
		// Cảnh báo: Đảm bảo đã chạy `node swagger.js` để tạo file swagger-output.json trước khi khởi động server
		console.log(`📄 Swagger UI đang chạy tại http://localhost:${config.port}/api-docs`);
	});
};

// Chỉ khởi động server nếu không phải môi trường test
if (process.env.NODE_ENV !== 'test') {
	startServer();
}

module.exports = app;
