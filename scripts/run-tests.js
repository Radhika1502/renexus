#!/usr/bin/env node

/**
 * Test Runner Script
 * 
 * This script runs the test suites for the Renexus backend services.
 * It can run unit tests, integration tests, or all tests based on the provided arguments.
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Parse command line arguments
const args = process.argv.slice(2);
const testType = args[0] || 'all'; // Default to running all tests

// Paths
const ROOT_DIR = path.resolve(__dirname, '..');
const TEST_DIR = path.join(ROOT_DIR, 'tests');

// Validate test directory
if (!fs.existsSync(TEST_DIR)) {
  console.error(`Error: Test directory not found at ${TEST_DIR}`);
  process.exit(1);
}

// Helper function to run tests
function runTests(command, description) {
  console.log(`\n🧪 Running ${description}...`);
  try {
    execSync(command, { 
      stdio: 'inherit',
      cwd: ROOT_DIR
    });
    console.log(`\n✅ ${description} completed successfully!`);
    return true;
  } catch (error) {
    console.error(`\n❌ ${description} failed with the following error:`);
    console.error(error.message);
    return false;
  }
}

// Main execution
console.log('Renexus Backend Test Runner');
console.log('==========================');

let success = true;

switch (testType.toLowerCase()) {
  case 'unit':
    success = runTests('npx jest tests/services', 'Unit Tests');
    break;
  
  case 'integration':
    success = runTests('npx jest tests/integration', 'Integration Tests');
    break;
  
  case 'all':
  default:
    const unitSuccess = runTests('npx jest tests/services', 'Unit Tests');
    const integrationSuccess = runTests('npx jest tests/integration', 'Integration Tests');
    success = unitSuccess && integrationSuccess;
    break;
}

// Summary
console.log('\n📊 Test Summary');
console.log('==============');
if (success) {
  console.log('✅ All tests passed successfully!');
} else {
  console.log('❌ Some tests failed. Please check the logs above for details.');
  process.exit(1);
}

console.log('\nNext steps:');
console.log('1. Fix any failing tests');
console.log('2. Run the database migrations with: node scripts/run-migrations.js');
console.log('3. Start the API server with: npm start');
