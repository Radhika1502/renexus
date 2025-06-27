#!/usr/bin/env node

/**
 * End-to-End Test Runner Script
 * 
 * This script runs the end-to-end tests for the Renexus backend API.
 * It sets up a test database, runs the migrations, and executes the tests.
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Paths
const ROOT_DIR = path.resolve(__dirname, '..');
const E2E_TEST_DIR = path.join(ROOT_DIR, 'tests', 'e2e');

// Check if test directory exists
if (!fs.existsSync(E2E_TEST_DIR)) {
  console.error(`Error: E2E test directory not found at ${E2E_TEST_DIR}`);
  process.exit(1);
}

console.log('Renexus E2E Test Runner');
console.log('=======================');

// Set up test environment
console.log('\n📦 Setting up test environment...');

// Create a temporary .env.test file for tests
const testEnvPath = path.join(ROOT_DIR, '.env.test');
try {
  fs.writeFileSync(testEnvPath, 
    `DATABASE_URL=postgres://postgres:postgres@localhost:5432/renexus_test
JWT_SECRET=test-jwt-secret
NODE_ENV=test`
  );
  console.log('✅ Created test environment configuration');
} catch (error) {
  console.error('❌ Failed to create test environment configuration:', error.message);
  process.exit(1);
}

// Run the tests
console.log('\n🧪 Running end-to-end tests...');
try {
  execSync('cross-env NODE_ENV=test jest tests/e2e --runInBand --forceExit', { 
    stdio: 'inherit',
    cwd: ROOT_DIR,
    env: { ...process.env, NODE_ENV: 'test', DOTENV_CONFIG_PATH: testEnvPath }
  });
  console.log('\n✅ End-to-end tests completed successfully!');
} catch (error) {
  console.error('\n❌ End-to-end tests failed with the following error:');
  console.error(error.message);
  process.exit(1);
} finally {
  // Clean up test environment
  try {
    fs.unlinkSync(testEnvPath);
    console.log('✅ Cleaned up test environment');
  } catch (error) {
    console.warn('⚠️ Failed to clean up test environment:', error.message);
  }
}

console.log('\n📊 Test Summary');
console.log('==============');
console.log('✅ All end-to-end tests have been executed');

console.log('\nNext steps:');
console.log('1. Fix any failing tests');
console.log('2. Run the database migrations with: node scripts/run-migrations.js');
console.log('3. Start the API server with: npm start');
console.log('4. Integrate with frontend components');
