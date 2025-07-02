/**
 * Debug Jest Configuration for fixing test failures
 * Temporary config to help fix Phase 5 test issues
 */
const baseConfig = require('./jest.config.js');

module.exports = {
  ...baseConfig,
  // Temporarily reduce coverage thresholds to identify issues
  coverageThreshold: {
    global: {
      statements: 0,
      branches: 0,
      functions: 0,
      lines: 0,
    },
  },
  // Verbose output to see detailed failures
  verbose: true
};
