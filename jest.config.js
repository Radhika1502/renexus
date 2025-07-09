/** @type {import('jest').Config} */
export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests', '<rootDir>/services', '<rootDir>/packages'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@packages/(.*)$': '<rootDir>/packages/$1',
    '^@services/(.*)$': '<rootDir>/services/$1',
    '^@types/(.*)$': '<rootDir>/types/$1',
    '^@frontend/(.*)$': '<rootDir>/frontend/web/src/$1',
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '^(\\.{1,2}/.*)\\.ts$': '$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
  },
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: 'tsconfig.json'
    }]
  },
  transformIgnorePatterns: [
    'node_modules/(?!(drizzle-orm|@drizzle|pg|@types/pg)/)'
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  collectCoverageFrom: [
    'services/**/*.{ts,tsx}',
    'packages/**/*.{ts,tsx}',
    'frontend/**/*.{ts,tsx}',
    '!**/*.d.ts'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/tests/e2e/specs/',
    '/tests/accessibility/',
    '/tests/performance/'
  ],
  verbose: true,
  moduleDirectories: ['node_modules', '.'],
  projects: [
    {
      displayName: 'node',
      testEnvironment: 'node',
      testMatch: [
        '<rootDir>/tests/unit/**/*.test.ts',
        '<rootDir>/tests/integration/**/*.test.ts',
        '<rootDir>/tests/services/**/*.test.ts',
        '!<rootDir>/tests/unit/hooks/**/*.test.ts',
        '!<rootDir>/tests/unit/components/**/*.test.tsx'
      ],
      setupFilesAfterEnv: ['<rootDir>/tests/jest.setup.ts']
    },
    {
      displayName: 'jsdom',
      testEnvironment: 'jsdom',
      testMatch: [
        '<rootDir>/tests/unit/hooks/**/*.test.ts',
        '<rootDir>/tests/unit/components/**/*.test.tsx'
      ],
      setupFilesAfterEnv: [
        '<rootDir>/tests/jest.setup.ts',
        '<rootDir>/tests/jest.react.setup.ts'
      ],
      testEnvironmentOptions: {
        url: 'http://localhost'
      }
    }
  ]
};
