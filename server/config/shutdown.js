const mongoose = require('mongoose');
const logger = require('./logger');

const registeredTimers = new Set();
const cleanupTasks = new Set();

let httpServer = null;
let handlersAttached = false;
let isShuttingDown = false;

const registerServer = (server) => {
	httpServer = server;
	return server;
};

const registerTimer = (timer) => {
	if (timer) {
		registeredTimers.add(timer);
	}
	return timer;
};

const unregisterTimer = (timer) => {
	if (timer) {
		registeredTimers.delete(timer);
	}
};

const registerCleanupTask = (task) => {
	if (typeof task !== 'function') {
		return () => {};
	}

	cleanupTasks.add(task);
	return () => cleanupTasks.delete(task);
};

const closeHttpServer = () => new Promise((resolve) => {
	if (!httpServer) {
		return resolve();
	}

	httpServer.close((error) => {
		if (error) {
			logger.error('Error while closing HTTP server', { error: error.message });
		}
		resolve();
	});

	if (typeof httpServer.closeIdleConnections === 'function') {
		httpServer.closeIdleConnections();
	}
});

const clearTimers = () => {
	for (const timer of registeredTimers) {
		clearInterval(timer);
		clearTimeout(timer);
		registeredTimers.delete(timer);
	}
};

const runCleanupTasks = async () => {
	for (const task of cleanupTasks) {
		try {
			await task();
		} catch (error) {
			logger.error('Cleanup task failed during shutdown', { error: error.message });
		}
		cleanupTasks.delete(task);
	}
};

const disconnectMongo = async () => {
	if (mongoose.connection.readyState === 0) {
		return;
	}

	await mongoose.disconnect();
	logger.info('MongoDB disconnected');
};

const shutdown = async (signal = 'manual') => {
	if (isShuttingDown) {
		return;
	}

	isShuttingDown = true;
	logger.info('Shutdown signal received', { signal });

	const forceExitTimer = setTimeout(() => {
		logger.error('Forced shutdown after timeout', { signal });
		process.exit(1);
	}, 10000);
	forceExitTimer.unref?.();

	let exitCode = 0;

	try {
		clearTimers();
		await closeHttpServer();
		await runCleanupTasks();
		await disconnectMongo();
		logger.info('Shutdown completed');
	} catch (error) {
		exitCode = 1;
		logger.error('Shutdown failed', { signal, error: error.message });
	} finally {
		clearTimeout(forceExitTimer);
		process.exit(exitCode);
	}
};

const initializeShutdown = () => {
	if (handlersAttached) {
		return;
	}

	handlersAttached = true;
	process.on('SIGINT', () => {
		void shutdown('SIGINT');
	});
	process.on('SIGTERM', () => {
		void shutdown('SIGTERM');
	});
};

module.exports = {
	initializeShutdown,
	registerCleanupTask,
	registerServer,
	registerTimer,
	shutdown,
	unregisterTimer,
};