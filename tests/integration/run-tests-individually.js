/**
 * Renexus Integration Test Runner
 * 
 * This script runs each integration test file individually and collects results.
 */

const { execSync } = require('child_process');
const fs = require('fs');
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
console.log('\n=================================================');
console.log('       RENEXUS PHASE 1 INTEGRATION TESTS         ');
console.log('=================================================\n');

// Run each test file individually
testFiles.forEach((testFile, index) => {
  const testPath = path.join('tests', 'integration', testFile);
  
  // Check if file exists
  const fullPath = path.join(process.cwd(), testPath);
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  File not found: ${testFile}`);
    return;
  }
  
  console.log(`[${index + 1}/${testFiles.length}] Testing: ${testFile}`);
  
  try {
    // Run Jest with the specific test file and capture output
    const output = execSync(`npx jest "${testPath}" --passWithNoTests --forceExit`, { 
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    // Check if test passed
    results.passed.push(testFile);
    console.log(`✅ PASSED: ${testFile}\n`);
  } catch (error) {
    // Test failed
    results.failed.push(testFile);
    console.log(`❌ FAILED: ${testFile}`);
    console.log(`   Error: ${error.message.split('\n')[0]}\n`);
  }
});

// Print summary
console.log('=================================================');
console.log('                  TEST SUMMARY                   ');
console.log('=================================================');
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
