const { execSync } = require('child_process');
const path = require('path');

// List of Phase 1 unit test files
const testFiles = [
  'api-gateway.test.ts',
  'error-handler.test.ts',
  'mfa-service.test.ts',
  'project-service.test.ts',
  'session-service.test.ts'
];

console.log('Running Phase 1 Unit Tests\n');
console.log('=========================\n');

let allPassed = true;
const results = {};

// Run each test file individually
testFiles.forEach(testFile => {
  const fullPath = path.join('tests/unit', testFile);
  console.log(`Testing: ${testFile}`);
  
  try {
    // Run Jest with detailed output
    execSync(`npx jest ${fullPath} --no-cache --verbose`, { 
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
