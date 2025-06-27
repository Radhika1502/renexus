/**
 * Integration Test Runner for Phase 1 Backend Tests
 * 
 * This script runs all integration tests for the Renexus backend Phase 1
 * and reports any failures. It helps identify and fix issues across all
 * test suites.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const testDir = path.join(__dirname);
const testFiles = [
  'backup-recovery.test.ts',
  'database.test.ts',
  'migration-scripts.test.ts',
  'performance.test.ts',
  'api-gateway.test.ts',
  'end-to-end-flows.test.ts'
];

// Results tracking
const results = {
  passed: [],
  failed: []
};

console.log('='.repeat(80));
console.log('RENEXUS PHASE 1 BACKEND INTEGRATION TEST RUNNER');
console.log('='.repeat(80));
console.log(`Starting tests at ${new Date().toISOString()}`);
console.log('-'.repeat(80));

// Run each test file individually
testFiles.forEach(testFile => {
  const testPath = path.join(testDir, testFile);
  
  // Skip if file doesn't exist
  if (!fs.existsSync(testPath)) {
    console.log(`⚠️  Test file not found: ${testFile}`);
    return;
  }
  
  console.log(`Running tests for: ${testFile}`);
  
  try {
    // Run the test with Jest
    execSync(`npx jest ${testPath} --detectOpenHandles`, { 
      stdio: 'inherit',
      timeout: 30000 // 30 second timeout
    });
    
    results.passed.push(testFile);
    console.log(`✅ PASSED: ${testFile}`);
  } catch (error) {
    results.failed.push(testFile);
    console.log(`❌ FAILED: ${testFile}`);
  }
  
  console.log('-'.repeat(80));
});

// Summary
console.log('\nTEST SUMMARY:');
console.log(`Total test files: ${testFiles.length}`);
console.log(`Passed: ${results.passed.length}`);
console.log(`Failed: ${results.failed.length}`);

if (results.failed.length > 0) {
  console.log('\nFailed tests:');
  results.failed.forEach(test => console.log(`  - ${test}`));
  process.exit(1);
} else {
  console.log('\n✅ All integration tests passed!');
  process.exit(0);
}
