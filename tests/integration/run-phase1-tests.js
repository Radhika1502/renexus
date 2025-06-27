/**
 * Renexus Phase 1 Backend Integration Test Runner
 * 
 * This script runs all Phase 1 backend integration tests in sequence
 * and provides a detailed report of test results.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const testDir = path.resolve(__dirname);
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
  failed: [],
  skipped: []
};

// Helper function to format time
function formatTime(ms) {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

// Print header
console.log('\n' + '='.repeat(80));
console.log(' '.repeat(25) + 'RENEXUS PHASE 1 BACKEND TESTS');
console.log('='.repeat(80));
console.log(`Started: ${new Date().toISOString()}`);
console.log('-'.repeat(80));

// Track overall time
const startTime = Date.now();

// Run each test file individually
testFiles.forEach(testFile => {
  const testPath = path.join(testDir, testFile);
  
  // Skip if file doesn't exist
  if (!fs.existsSync(testPath)) {
    console.log(`⚠️  Test file not found: ${testFile}`);
    results.skipped.push({ file: testFile, reason: 'File not found' });
    return;
  }
  
  console.log(`\nRunning: ${testFile}`);
  console.log('-'.repeat(40));
  
  const fileStartTime = Date.now();
  
  try {
    // Run the test with Jest
    execSync(`npx jest "${testPath}" --passWithNoTests --verbose`, { 
      stdio: 'inherit',
      timeout: 60000 // 60 second timeout
    });
    
    const duration = Date.now() - fileStartTime;
    results.passed.push({ file: testFile, duration });
    console.log(`\n✅ PASSED: ${testFile} (${formatTime(duration)})`);
  } catch (error) {
    const duration = Date.now() - fileStartTime;
    results.failed.push({ file: testFile, duration, error: error.message });
    console.log(`\n❌ FAILED: ${testFile} (${formatTime(duration)})`);
  }
});

// Calculate total time
const totalTime = Date.now() - startTime;

// Print summary
console.log('\n' + '='.repeat(80));
console.log(' '.repeat(30) + 'SUMMARY');
console.log('='.repeat(80));
console.log(`Total time: ${formatTime(totalTime)}`);
console.log(`Total test files: ${testFiles.length}`);
console.log(`  ✅ Passed: ${results.passed.length}`);
console.log(`  ❌ Failed: ${results.failed.length}`);
console.log(`  ⚠️  Skipped: ${results.skipped.length}`);

if (results.failed.length > 0) {
  console.log('\nFailed tests:');
  results.failed.forEach(test => {
    console.log(`  - ${test.file} (${formatTime(test.duration)})`);
  });
}

if (results.passed.length === testFiles.length) {
  console.log('\n✅ All Phase 1 backend integration tests passed!');
  process.exit(0);
} else {
  console.log('\n❌ Some tests failed. See details above.');
  process.exit(1);
}
