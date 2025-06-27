/**
 * Renexus Integration Test Runner
 * 
 * This script runs the Phase 1 backend integration tests one by one
 * and provides a clear summary of the results.
 */

const { execSync } = require('child_process');
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

// Results tracking
const results = {
  passed: [],
  failed: []
};

// Print header
console.log('\n========================================');
console.log('RENEXUS PHASE 1 INTEGRATION TEST RUNNER');
console.log('========================================\n');

// Run each test file individually
for (const testFile of testFiles) {
  const testPath = path.join('tests/integration', testFile);
  
  console.log(`Running: ${testFile}`);
  console.log('----------------------------------------');
  
  try {
    // Run Jest with the specific test file
    execSync(`npx jest ${testPath} --passWithNoTests --forceExit`, { 
      stdio: 'inherit'
    });
    
    results.passed.push(testFile);
    console.log(`\n✅ PASSED: ${testFile}\n`);
  } catch (error) {
    results.failed.push(testFile);
    console.log(`\n❌ FAILED: ${testFile}\n`);
  }
}

// Print summary
console.log('========================================');
console.log('TEST SUMMARY');
console.log('========================================');
console.log(`Total test files: ${testFiles.length}`);
console.log(`Passed: ${results.passed.length}`);
console.log(`Failed: ${results.failed.length}`);

if (results.failed.length > 0) {
  console.log('\nFailed tests:');
  results.failed.forEach(test => console.log(`- ${test}`));
  process.exit(1);
} else {
  console.log('\n✅ All Phase 1 backend integration tests passed!');
  process.exit(0);
}
