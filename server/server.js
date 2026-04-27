const connectDB = require('./config/db');
const config = require('./config/env');
const logger = require('./config/logger');
const app = require('./app');
const {
	initializeShutdown,
	registerServer,
	registerTimer,
} = require('./config/shutdown');
const orderService = require('./services/orderService');

const ORDER_EXPIRATION_MINUTES = 30;
const ORDER_CANCELLATION_INTERVAL_MS = 5 * 60 * 1000;

const startOrderCancellationJob = () => {
	const timer = setInterval(async () => {
		try {
			const result = await orderService.cancelExpiredOrders(ORDER_EXPIRATION_MINUTES);
			if (result.cancelledCount > 0) {
				logger.info('Expired pending orders were cancelled automatically', {
					cancelledCount: result.cancelledCount,
					checkedCount: result.checkedCount,
				});
			}
		} catch (error) {
			logger.error('Failed to cancel expired pending orders', { error: error.message });
		}
	}, ORDER_CANCELLATION_INTERVAL_MS);

	timer.unref?.();
	return registerTimer(timer);
};

const startServer = async () => {
	initializeShutdown();
	await connectDB();
	const server = app.listen(config.port, () => {
		logger.info(`Server đang chạy tại http://localhost:${config.port}`);
		logger.info(`Swagger UI đang chạy tại http://localhost:${config.port}/api-docs`);
	});

	registerServer(server);
	startOrderCancellationJob();
	return server;
};

// Chỉ khởi động server nếu không phải môi trường test
if (process.env.NODE_ENV !== 'test') {
	startServer().catch((error) => {
		logger.error('Server failed to start', { error: error.message });
		process.exit(1);
	});
}

module.exports = startServer;
