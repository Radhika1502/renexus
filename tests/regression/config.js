/**
 * Regression Testing Configuration
 * Phase 5.2.3 - Regression Testing
 */
const path = require('path');

module.exports = {
  // Test environment
  testEnvironment: 'node',
  
  // Test match patterns
  testMatch: [
    '**/regression/**/*.test.js',
    '**/regression/**/*.spec.js'
  ],
  
  // Test sequencing
  testSequencer: path.join(__dirname, 'sequencer.js'),
  
  // Test reporters
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: path.join(__dirname, '..', 'test-reports', 'regression'),
      outputName: 'junit.xml',
      classNameTemplate: '{classname}',
      titleTemplate: '{title}',
      ancestorSeparator: ' › ',
      usePathForSuiteName: true
    }],
    ['jest-html-reporter', {
      pageTitle: 'Renexus Regression Test Report',
      outputPath: path.join(__dirname, '..', 'test-reports', 'regression', 'report.html'),
      includeFailureMsg: true,
      includeConsoleLog: true,
      executionTimeWarningThreshold: 5,
      executionMode: 'reporter',
      dateFormat: 'yyyy-mm-dd HH:MM:ss',
      sort: 'status'
    }]
  ],
  
  // Coverage threshold settings
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 75,
      functions: 80,
      lines: 80
    }
  },

  // Setup and teardown
  globalSetup: path.join(__dirname, 'setup', 'globalSetup.js'),
  globalTeardown: path.join(__dirname, 'setup', 'globalTeardown.js'),
  setupFilesAfterEnv: [path.join(__dirname, 'setup', 'setupAfterEnv.js')],
  
  // Test timeout
  testTimeout: 30000,
  
  // Whether to use watchman for file crawling
  watchman: true,
  
  // Whether to use verbose output
  verbose: true
};
