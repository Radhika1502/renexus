module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  testMatch: ['**/tests/**/*.test.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'services/**/*.{ts,tsx}',
    '!**/node_modules/**',
    '!**/vendor/**',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  verbose: true,
  // Added global setup and teardown for integration tests with real database
  globalSetup: '<rootDir>/tests/jest-setup.js',
  globalTeardown: '<rootDir>/tests/jest-teardown.js',
  // Set longer timeout for database operations
  testTimeout: 30000,
  // Force tests to run in series for database stability
  maxWorkers: 1,
};
