const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// List of test files to run
const testFiles = [
  'tests/unit/api-gateway.test.ts',
  'tests/unit/error-handler.test.ts',
  'tests/unit/mfa-service.test.ts',
  'tests/unit/project-service.test.ts',
  'tests/unit/session-service.test.ts'
];

console.log('Running individual test files...\n');

// Run each test file individually
testFiles.forEach(testFile => {
  console.log(`Testing: ${testFile}`);
  try {
    const output = execSync(`npx jest ${testFile} --no-cache --passWithNoTests`, { 
      encoding: 'utf8',
      stdio: 'pipe'
    });
    console.log(`✅ PASSED: ${testFile}`);
  } catch (error) {
    console.error(`❌ FAILED: ${testFile}`);
    console.error(error.stdout || error.message);
  }
  console.log('-----------------------------------');
});

console.log('\nAll individual tests completed!');
