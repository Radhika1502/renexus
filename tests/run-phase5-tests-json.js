const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Define test files
const testFiles = [
  'projects.test.ts',
  'tasks.test.ts',
  'task-analytics.test.ts',
  'migration-scripts.test.ts'
];

// Create output directory
const outputDir = path.join(__dirname, 'test-results');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

// Results summary
const results = {};

// Run each test file with JSON reporter
console.log('Running Phase 5 integration tests with JSON output...\n');

testFiles.forEach(testFile => {
  const testPath = `tests/integration/${testFile}`;
  console.log(`Testing: ${testFile}`);
  
  try {
    // Run test with JSON output
    const jsonOutputFile = path.join(outputDir, `${testFile.replace('.ts', '')}.json`);
    
    // Execute Jest with JSON output
    execSync(
      `npx jest ${testPath} --json --outputFile=${jsonOutputFile} --no-cache --detectOpenHandles --forceExit`, 
      { stdio: 'inherit' }
    );
    
    // Read the JSON output
    const jsonResult = JSON.parse(fs.readFileSync(jsonOutputFile, 'utf-8'));
    
    // Check if tests passed
    const numFailedTests = jsonResult.numFailedTests;
    const passed = numFailedTests === 0;
    
    results[testFile] = {
      passed,
      failedTests: numFailedTests,
      totalTests: jsonResult.numTotalTests
    };
    
    console.log(`${testFile}: ${passed ? '✓ PASSED' : '✗ FAILED'} (${jsonResult.numPassedTests}/${jsonResult.numTotalTests} passed)\n`);
    
  } catch (error) {
    console.error(`Error running ${testFile}:`, error.message);
    results[testFile] = { passed: false, error: error.message };
  }
});

// Summary report
console.log('\n===== TEST RESULTS SUMMARY =====');
let allPassed = true;

Object.entries(results).forEach(([test, result]) => {
  console.log(`${test}: ${result.passed ? '✓ PASSED' : '✗ FAILED'}`);
  if (!result.passed) allPassed = false;
});

console.log('\nSee detailed results in the test-results directory.');

if (allPassed) {
  console.log('\n✅ ALL TESTS PASSED!');
  process.exit(0);
} else {
  console.log('\n❌ SOME TESTS FAILED!');
  process.exit(1);
}
