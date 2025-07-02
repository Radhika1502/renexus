/**
 * Unit Test Configuration for Renexus
 * Phase 5.1.1 - Unit Testing Implementation
 */

module.exports = {
  // Unit test specific configuration
  verbose: true,
  bail: false, // Continue running tests even if one fails
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/index.{js,ts}',
    '!src/mocks/**',
    '!src/**/types/**',
    '!src/themes/**',
    '!src/constants/**',
    '!src/**/styles/**',
  ],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/coverage/',
    '/public/',
    '/build/',
    '/__tests__/',
    '__mocks__',
  ],
  // Minimum threshold enforcement per directory
  coverageThreshold: {
    './src/components/': {
      statements: 85,
      branches: 80,
      functions: 85,
      lines: 85
    },
    './src/services/': {
      statements: 90,
      branches: 85, 
      functions: 90,
      lines: 90
    },
    './src/utils/': {
      statements: 95,
      branches: 90,
      functions: 95,
      lines: 95
    }
  },
  // Watch plugins for interactive development
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname',
  ],
};
