/**
 * Simple Integration Test Runner
 * 
 * This script runs specified integration tests and reports results.
 */

const { spawnSync } = require('child_process');
const path = require('path');

// Phase 1 backend integration test files
const testFiles = [
  'backup-recovery.test.ts',
  'database.test.ts',
  'migration-scripts.test.ts',
  'performance.test.ts',
  'api-gateway.test.ts',
  'end-to-end-flows.test.ts'
];

console.log('\n=== RENEXUS PHASE 1 BACKEND INTEGRATION TESTS ===\n');

// Track results
let passed = 0;
let failed = 0;
let failedTests = [];

// Run each test file
testFiles.forEach(testFile => {
  console.log(`Running: ${testFile}`);
  
  // Run Jest with the specific test file
  const result = spawnSync('npx', [
    'jest', 
    path.join('tests/integration', testFile), 
    '--passWithNoTests',
    '--forceExit'
  ], { 
    stdio: 'inherit',
    shell: true
  });
  
  // Check result
  if (result.status === 0) {
    console.log(`✅ PASSED: ${testFile}\n`);
    passed++;
  } else {
    console.log(`❌ FAILED: ${testFile}\n`);
    failed++;
    failedTests.push(testFile);
  }
});

// Print summary
console.log('=== TEST SUMMARY ===');
console.log(`Total: ${testFiles.length}`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);

if (failed > 0) {
  console.log('\nFailed tests:');
  failedTests.forEach(test => console.log(`- ${test}`));
  process.exit(1);
} else {
  console.log('\n✅ All tests passed!');
  process.exit(0);
}
