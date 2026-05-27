const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const hpp = require('hpp');
const config = require('./config/env');
const logger = require('./config/logger');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger-output.json');

const { globalApiLimiter } = require('./middleware/authRateLimit');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');
const {
	sanitizeMongoPayload,
	sanitizeRequestPayload,
} = require('./middleware/securityMiddleware');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const productRoutes = require('./routes/productRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const inventoryAdminRoutes = require('./routes/inventoryAdminRoutes');
const adminRoutes = require('./routes/adminRoutes');
const { successResponse } = require('./utils/apiResponse');
const { HTTP_STATUS } = require('./config/constants');

const app = express();

// Chỉ bật khi app thật sự chạy sau reverse proxy/API Gateway đáng tin cậy.
if (config.trustProxy) {
	app.set('trust proxy', config.trustProxy);
}

const allowedOrigins = (config.clientUrl || 'http://localhost:3001')
	.split(',')
	.map(origin => origin.trim())
	.filter(Boolean);

app.use(helmet());
app.use(cors({
	origin(origin, callback) {
		if (!origin) return callback(null, true);
		if (allowedOrigins.includes(origin)) return callback(null, true);
		return callback(new Error('Not allowed by CORS'));
	},
	credentials: true,
}));

app.use(logger.httpMiddleware);
app.use(globalApiLimiter);
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(sanitizeMongoPayload);
app.use(sanitizeRequestPayload);
app.use(hpp());
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.get('/', (req, res) => {
	return successResponse(res, HTTP_STATUS.OK, 'IE213 Backend API is running');
});

app.get('/api', (req, res) => {
	return successResponse(res, HTTP_STATUS.OK, 'API base path is available');
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/admin/inventory', inventoryAdminRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
