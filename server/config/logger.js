const { randomUUID } = require('crypto');
const { Writable } = require('stream');
const pino = require('pino');
const pinoHttp = require('pino-http');
const config = require('./env');

const LOG_FORWARDING_ERROR_THROTTLE_MS = 30 * 1000;

const normalizeMeta = (meta) => {
  if (meta === undefined || meta === null) {
    return undefined;
  }

  if (meta instanceof Error) {
    return {
      err: meta,
      error: meta.message,
    };
  }

  if (typeof meta === 'object') {
    return meta;
  }

  return { value: meta };
};

const createExternalSinkStream = () => {
  if (!config.logging.sinkUrl || config.env === 'test') {
    return null;
  }

  let lastErrorAt = 0;

  return new Writable({
    write(chunk, encoding, callback) {
      const body = chunk.toString();
      const headers = {
        'content-type': 'application/json',
      };

      if (config.logging.sinkAuthToken) {
        headers.authorization = `Bearer ${config.logging.sinkAuthToken}`;
      }

      void fetch(config.logging.sinkUrl, {
        method: 'POST',
        headers,
        body,
      }).then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
      }).catch((error) => {
        const now = Date.now();
        if (now - lastErrorAt > LOG_FORWARDING_ERROR_THROTTLE_MS) {
          lastErrorAt = now;
          process.stderr.write(`[logger] Failed to forward logs to external sink: ${error.message}\n`);
        }
      });

      callback();
    },
  });
};

const createDestination = () => {
  const externalSinkStream = createExternalSinkStream();
  if (!externalSinkStream) {
    return process.stdout;
  }

  return pino.multistream([
    { stream: process.stdout },
    { stream: externalSinkStream },
  ]);
};

const baseLogger = pino({
  level: config.logging.level,
  messageKey: 'message',
  timestamp: pino.stdTimeFunctions.isoTime,
  base: {
    service: 'ie213-backend',
    env: config.env,
  },
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'password',
      'currentPassword',
      'newPassword',
      'token',
      'refreshToken',
      'authorization',
    ],
    censor: '[Redacted]',
  },
  formatters: {
    level(label) {
      return { level: label };
    },
  },
  serializers: {
    err: pino.stdSerializers.err,
  },
}, createDestination());

const genReqId = (req, res) => {
  const incomingRequestId = typeof req.headers['x-request-id'] === 'string'
    ? req.headers['x-request-id'].trim()
    : '';
  const requestId = incomingRequestId || randomUUID();

  req.requestId = requestId;
  req.id = requestId;
  res.setHeader('x-request-id', requestId);

  return requestId;
};

const httpMiddleware = pinoHttp({
  logger: baseLogger,
  genReqId,
  autoLogging: config.logging.requestLoggingEnabled,
  customLogLevel(req, res, error) {
    if (error || res.statusCode >= 500) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },
  customSuccessMessage(req, res) {
    return 'request completed';
  },
  customErrorMessage(req, res, error) {
    return 'request failed';
  },
  customProps(req, res) {
    return {
      requestId: req.requestId,
      userId: req.user?._id?.toString?.() || req.user?.id || null,
    };
  },
  serializers: {
    req(request) {
      return {
        id: request.requestId || request.id,
        method: request.method,
        url: request.originalUrl || request.url,
        remoteAddress: request.ip || request.socket?.remoteAddress,
        userAgent: request.headers['user-agent'],
      };
    },
    res(response) {
      return {
        statusCode: response.statusCode,
      };
    },
    err: pino.stdSerializers.err,
  },
});

const write = (instance, level, message, meta) => {
  const payload = normalizeMeta(meta);
  if (payload) {
    instance[level](payload, message);
    return;
  }

  instance[level](message);
};

const createFacade = (instance) => ({
  raw: instance,
  child(bindings = {}) {
    return createFacade(instance.child(bindings));
  },
  debug(message, meta) {
    write(instance, 'debug', message, meta);
  },
  info(message, meta) {
    write(instance, 'info', message, meta);
  },
  warn(message, meta) {
    write(instance, 'warn', message, meta);
  },
  error(message, meta) {
    write(instance, 'error', message, meta);
  },
});

const logger = createFacade(baseLogger);
logger.httpMiddleware = httpMiddleware;

module.exports = logger;
