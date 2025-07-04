// Merged from both api and api-gateway jest.config.js files
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.test.ts', '**/*.spec.ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/main.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  testTimeout: 10000,
  setupFilesAfterEnv: ['<rootDir>/src/test-setup.ts'],
}; 
// Additional configuration from api/jest.config.js:
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
