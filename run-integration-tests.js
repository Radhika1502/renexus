/**
 * Integration Test Runner
 * 
 * This script runs the integration tests for Phase 1 test cases.
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Create backups directory if it doesn't exist
const backupsDir = path.join(__dirname, 'backups');
if (!fs.existsSync(backupsDir)) {
  fs.mkdirSync(backupsDir, { recursive: true });
}

// Set up test environment
process.env.NODE_ENV = 'test';
process.env.DB_TYPE = 'test'; // Use test mode for backup/restore

console.log('Running Phase 1 Integration Tests\n');
console.log('=================================\n');

// List of integration test files
const testFiles = [
  'backup-recovery.test.ts',
  'migration-scripts.test.ts',
  'performance.test.ts',
  'end-to-end-flows.test.ts'
];

let allPassed = true;
const results = {};

// Run each test file individually
testFiles.forEach(testFile => {
  const fullPath = path.join('tests/integration', testFile);
  console.log(`Testing: ${testFile}`);
  
  try {
    // Run Jest with detailed output and pass with no tests flag
    execSync(`npx jest ${fullPath} --no-cache --verbose --passWithNoTests`, { 
      stdio: 'inherit' 
    });
    
    console.log(`✅ PASSED: ${testFile}\n`);
    results[testFile] = 'PASSED';
  } catch (error) {
    console.error(`❌ FAILED: ${testFile}\n`);
    allPassed = false;
    results[testFile] = 'FAILED';
  }
  
  console.log('--------------------------\n');
});

// Summary
console.log('\nTest Results Summary:');
console.log('======================');

Object.entries(results).forEach(([file, result]) => {
  const icon = result === 'PASSED' ? '✅' : '❌';
  console.log(`${icon} ${file}: ${result}`);
});

console.log('\nOverall Status:', allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED');

// Exit with appropriate code
process.exit(allPassed ? 0 : 1);
