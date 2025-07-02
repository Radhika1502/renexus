/**
 * Task Management Module Test Fixer
 * 
 * This script helps identify and fix issues with the Task Management Module tests.
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const testDir = path.join(__dirname, 'src/features/task-management');
const outputFile = path.join(__dirname, 'task-test-fixes.log');

// Helper function to log messages to console and file
function log(message) {
  console.log(message);
  fs.appendFileSync(outputFile, message + '\n');
}

// Clear previous log file
if (fs.existsSync(outputFile)) {
  fs.unlinkSync(outputFile);
}

log('=== Task Management Module Test Fixer ===');
log(`Starting at: ${new Date().toISOString()}`);
log('');

// Step 1: Find all test files
log('Step 1: Finding all test files...');
const testFiles = [];

function findTestFiles(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      findTestFiles(filePath);
    } else if (file.endsWith('.test.js') || file.endsWith('.test.jsx') || 
               file.endsWith('.test.ts') || file.endsWith('.test.tsx')) {
      testFiles.push(filePath);
    }
  }
}

try {
  findTestFiles(testDir);
  log(`Found ${testFiles.length} test files:`);
  testFiles.forEach(file => log(`  - ${path.relative(__dirname, file)}`));
} catch (error) {
  log(`Error finding test files: ${error.message}`);
}

log('');

// Step 2: Check if dependencies are installed
log('Step 2: Checking dependencies...');
const requiredDependencies = [
  '@testing-library/jest-dom',
  '@testing-library/react',
  '@testing-library/user-event',
  '@adobe/css-tools',
  'jest',
  'ts-jest'
];

const packageJsonPath = path.join(__dirname, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
const allDependencies = {
  ...packageJson.dependencies || {},
  ...packageJson.devDependencies || {}
};

const missingDependencies = [];
for (const dep of requiredDependencies) {
  if (!allDependencies[dep]) {
    missingDependencies.push(dep);
  }
}

if (missingDependencies.length > 0) {
  log(`Missing dependencies: ${missingDependencies.join(', ')}`);
  log('Installing missing dependencies...');
  
  try {
    execSync(`npm install --save-dev ${missingDependencies.join(' ')}`, { stdio: 'inherit' });
    log('Dependencies installed successfully.');
  } catch (error) {
    log(`Error installing dependencies: ${error.message}`);
  }
} else {
  log('All required dependencies are installed.');
}

log('');

// Step 3: Create a simple test that should pass
log('Step 3: Creating a simple test that should pass...');
const simpleTestPath = path.join(testDir, 'tests', 'simple.test.js');

try {
  // Ensure directory exists
  const simpleTestDir = path.dirname(simpleTestPath);
  if (!fs.existsSync(simpleTestDir)) {
    fs.mkdirSync(simpleTestDir, { recursive: true });
  }
  
  // Write a simple test file
  fs.writeFileSync(simpleTestPath, `
// Simple test that should always pass
describe('Simple Test', () => {
  it('should add two numbers correctly', () => {
    expect(1 + 1).toBe(2);
  });
});
`);
  
  log(`Created simple test at: ${path.relative(__dirname, simpleTestPath)}`);
} catch (error) {
  log(`Error creating simple test: ${error.message}`);
}

log('');

// Step 4: Run the simple test
log('Step 4: Running the simple test...');
try {
  const result = execSync(`npx jest ${path.relative(__dirname, simpleTestPath)} --no-cache`, { 
    encoding: 'utf-8',
    stdio: 'pipe'
  });
  
  log('Simple test result:');
  log(result);
  log('Simple test passed successfully.');
} catch (error) {
  log('Simple test failed:');
  if (error.stdout) log(error.stdout);
  if (error.stderr) log(error.stderr);
}

log('');

// Step 5: Check Jest configuration
log('Step 5: Checking Jest configuration...');
const jestConfigPath = path.join(__dirname, 'jest.config.js');

if (fs.existsSync(jestConfigPath)) {
  log('Jest configuration exists. Content:');
  log(fs.readFileSync(jestConfigPath, 'utf-8'));
} else {
  log('Jest configuration does not exist. Creating one...');
  
  const jestConfig = `
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/__mocks__/fileMock.js'
  },
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      isolatedModules: true
    }],
    '^.+\\.(js|jsx)$': 'babel-jest'
  },
  testPathIgnorePatterns: ['/node_modules/'],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts'
  ],
  coverageThreshold: {
    global: {
      statements: 70,
      branches: 70,
      functions: 70,
      lines: 70
    }
  }
};
`;
  
  fs.writeFileSync(jestConfigPath, jestConfig);
  log('Created Jest configuration file.');
}

log('');

// Step 6: Fix setupTests.ts
log('Step 6: Fixing setupTests.ts...');
const setupTestsPath = path.join(__dirname, 'src', 'setupTests.ts');

if (fs.existsSync(setupTestsPath)) {
  log('setupTests.ts exists. Updating it...');
  
  const setupTestsContent = `
// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
try {
  require('@testing-library/jest-dom');
} catch (error) {
  console.warn('Could not load @testing-library/jest-dom:', error);
}

// Mock the fetch API
global.fetch = jest.fn();

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
};

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
};

Object.defineProperty(window, 'sessionStorage', { value: sessionStorageMock });

// Mock IntersectionObserver
class IntersectionObserverMock {
  constructor(callback) {
    this.callback = callback;
  }
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
}

Object.defineProperty(window, 'IntersectionObserver', { value: IntersectionObserverMock });

// Mock ResizeObserver
class ResizeObserverMock {
  constructor(callback) {
    this.callback = callback;
  }
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
}

Object.defineProperty(window, 'ResizeObserver', { value: ResizeObserverMock });

// Reset all mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});
`;
  
  fs.writeFileSync(setupTestsPath, setupTestsContent);
  log('Updated setupTests.ts file.');
} else {
  log('setupTests.ts does not exist. Creating it...');
  
  // Ensure directory exists
  const setupTestsDir = path.dirname(setupTestsPath);
  if (!fs.existsSync(setupTestsDir)) {
    fs.mkdirSync(setupTestsDir, { recursive: true });
  }
  
  const setupTestsContent = `
// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
try {
  require('@testing-library/jest-dom');
} catch (error) {
  console.warn('Could not load @testing-library/jest-dom:', error);
}

// Mock the fetch API
global.fetch = jest.fn();

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
};

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
};

Object.defineProperty(window, 'sessionStorage', { value: sessionStorageMock });

// Mock IntersectionObserver
class IntersectionObserverMock {
  constructor(callback) {
    this.callback = callback;
  }
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
}

Object.defineProperty(window, 'IntersectionObserver', { value: IntersectionObserverMock });

// Mock ResizeObserver
class ResizeObserverMock {
  constructor(callback) {
    this.callback = callback;
  }
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
}

Object.defineProperty(window, 'ResizeObserver', { value: ResizeObserverMock });

// Reset all mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});
`;
  
  fs.writeFileSync(setupTestsPath, setupTestsContent);
  log('Created setupTests.ts file.');
}

log('');

// Step 7: Create a test runner script
log('Step 7: Creating a test runner script...');
const testRunnerPath = path.join(__dirname, 'run-task-tests.js');

const testRunnerContent = `
/**
 * Task Management Module Test Runner
 */
const { execSync } = require('child_process');
const path = require('path');

console.log('Running Task Management Module Tests...');

try {
  // Run the tests with detailed output
  execSync('npx jest src/features/task-management --no-cache', { 
    stdio: 'inherit',
    encoding: 'utf-8'
  });
  
  console.log('\\nAll tests completed successfully!');
} catch (error) {
  console.error('\\nSome tests failed. See above for details.');
  process.exit(1);
}
`;

fs.writeFileSync(testRunnerPath, testRunnerContent);
log(`Created test runner script at: ${path.relative(__dirname, testRunnerPath)}`);

log('');
log('=== Task Management Module Test Fixer Completed ===');
log(`Finished at: ${new Date().toISOString()}`);
log('');
log('Next steps:');
log('1. Run the test runner script: node run-task-tests.js');
log('2. Fix any remaining test failures');
log('3. Verify all tests pass with 100% success rate');
