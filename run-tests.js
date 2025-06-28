const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Define test suites to run in small batches
const testSuites = [
  // Phase 2 Tests
  { name: 'TaskDependencyManager', path: 'tests/services/tasks/TaskDependencyManager.test.ts' },
  { name: 'OfflineManager', path: 'tests/services/offline/OfflineManager.test.ts' },
  
  // Phase 3 Tests
  { name: 'AnalyticsCore', path: 'tests/services/analytics/AnalyticsCore.test.ts' },
  { name: 'PredictiveAnalytics', path: 'tests/services/analytics/PredictiveAnalyticsService.test.ts' },
  { name: 'AIEnhancements', path: 'tests/services/ai/AIEnhancementService.test.ts' }
];

// Path to store passed tests
const passedTestsFile = path.join(__dirname, '.passed-tests.json');

// Load already passed tests to avoid re-running them
let passedTests = {};
if (fs.existsSync(passedTestsFile)) {
  try {
    const data = fs.readFileSync(passedTestsFile, 'utf8');
    passedTests = JSON.parse(data);
  } catch (err) {
    console.log('No previous test results found or file corrupted. Starting fresh.');
  }
}

// Check if specific test file is provided as command line argument
const specificTestFile = process.argv[2];

// Function to run a specific test
function runTest(testPath, testName) {
  console.log(`\n\n==== Running Test Suite: ${testName} ====`);
  try {
    // Run this specific test suite
    execSync(`npx jest ${testPath} --no-cache --verbose`, { 
      encoding: 'utf8',
      stdio: 'inherit' // Show output in real-time
    });
    
    // Mark as passed
    passedTests[testName] = true;
    fs.writeFileSync(passedTestsFile, JSON.stringify(passedTests, null, 2));
    
    console.log(`\n✅ Test Suite Passed: ${testName}\n`);
    return true;
  } catch (error) {
    console.error(`\n❌ Test Suite Failed: ${testName}\n`);
    return false;
  }
}

// Run tests one suite at a time
let allPassed = true;
let completedTests = 0;

// If specific test file is provided, run only that test
if (specificTestFile) {
  const testSuite = testSuites.find(suite => suite.path === specificTestFile);
  if (testSuite) {
    allPassed = runTest(testSuite.path, testSuite.name);
    completedTests = 1;
  } else {
    // Run the specific file even if it's not in our predefined list
    const testName = path.basename(specificTestFile, path.extname(specificTestFile));
    allPassed = runTest(specificTestFile, testName);
    completedTests = 1;
  }
} else {
  // Run all test suites
  for (const suite of testSuites) {
    // Skip if already passed successfully
    if (passedTests[suite.name]) {
      console.log(`✅ Skipping ${suite.name} - Already passed previously`);
      completedTests++;
      continue;
    }
    
    allPassed = runTest(suite.path, suite.name) && allPassed;
    completedTests++;
    console.log(`Progress: ${completedTests}/${testSuites.length} test suites completed\n`);
  }
}

// Final report
if (allPassed) {
  console.log('\n\n🎉 All test suites completed successfully! 🎉');
} else {
  console.error('\n\n⚠️ Some test suites failed. Please fix the issues and run again.');
  process.exit(1);
}
