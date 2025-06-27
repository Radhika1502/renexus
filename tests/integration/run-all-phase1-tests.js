/**
 * Phase 1 Backend Integration Test Runner
 * 
 * This script runs all Phase 1 backend integration tests and reports results.
 */

const { spawnSync } = require('child_process');
const path = require('path');

// Configuration
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
  const testPath = `tests/integration/${testFile}`;
  
  console.log(`Running tests for: ${testFile}`);
  
  // Run the test with Jest using spawnSync for better output handling
  const result = spawnSync('npx', ['jest', testPath, '--passWithNoTests', '--verbose'], { 
    stdio: 'inherit',
    shell: true
  });
  
  if (result.status === 0) {
    results.passed.push(testFile);
    console.log(`✅ PASSED: ${testFile}`);
  } else {
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
  console.log('\n✅ All Phase 1 backend integration tests passed!');
  process.exit(0);
}
