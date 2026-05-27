const baseConfig = require('./jest.config');

module.exports = {
  ...baseConfig,
  globalSetup: undefined,
  globalTeardown: undefined,
  setupFilesAfterEnv: [],
  collectCoverage: false,
};
