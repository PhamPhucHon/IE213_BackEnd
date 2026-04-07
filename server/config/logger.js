const formatMeta = (meta = {}) => {
  try {
    return JSON.stringify(meta);
  } catch (_) {
    return '{}';
  }
};

const log = (level, message, meta = {}) => {
  const timestamp = new Date().toISOString();
  const suffix = Object.keys(meta || {}).length ? ` ${formatMeta(meta)}` : '';
  // Keep logger simple and dependency-free for local development.
  console[level](`[${timestamp}] [${level.toUpperCase()}] ${message}${suffix}`);
};

module.exports = {
  info: (message, meta) => log('log', message, meta),
  warn: (message, meta) => log('warn', message, meta),
  error: (message, meta) => log('error', message, meta),
};
