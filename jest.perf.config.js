module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src/test/performance'],
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
  testMatch: ['**/*.perf.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testTimeout: 60000, // 60 seconds for performance tests
  maxWorkers: 1, // Run performance tests sequentially
  reporters: [
    'default',
    [
      './node_modules/jest-html-reporter',
      {
        pageTitle: 'Performance Test Report',
        outputPath: './reports/performance.html',
        includeFailureMsg: true,
        includeConsoleLog: true,
      },
    ],
  ],
}; 