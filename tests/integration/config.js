/**
 * Integration Test Configuration for Renexus
 * Phase 5.1.2 - Integration Testing Implementation
 */

module.exports = {
  // Integration test specific configuration
  verbose: true,
  // Running integration tests serially to prevent test interference
  maxConcurrency: 1,
  testTimeout: 30000,
  // More detailed reporting for integration tests
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: '<rootDir>/test-reports/integration',
      outputName: 'junit-integration.xml',
      classNameTemplate: '{classname}',
      titleTemplate: '{title}',
      ancestorSeparator: ' › '
    }],
    ['jest-html-reporter', {
      pageTitle: 'Renexus Integration Test Report',
      outputPath: '<rootDir>/test-reports/integration/test-report.html',
      includeFailureMsg: true,
      includeConsoleLog: true,
      useCSSFile: true,
      theme: 'lightTheme'
    }]
  ],
  // Global setup and teardown scripts
  globalSetup: '<rootDir>/tests/integration/setup/globalSetup.js',
  globalTeardown: '<rootDir>/tests/integration/setup/globalTeardown.js',
  setupFilesAfterEnv: ['<rootDir>/tests/integration/setup/setupAfterEnv.js'],
  // Database cleanup between tests
  testSequencer: '<rootDir>/tests/integration/setup/testSequencer.js',
  // Coverage config
  collectCoverageFrom: [
    'src/services/**/*.{js,jsx,ts,tsx}',
    'src/controllers/**/*.{js,jsx,ts,tsx}',
    'src/repositories/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/mocks/**',
  ],
};
