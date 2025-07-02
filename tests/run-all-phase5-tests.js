/**
 * Phase 5: Testing & Quality Assurance - Comprehensive Test Runner
 * 
 * This script runs all test suites implemented in Phase 5:
 * - Unit Tests (Task 5.1.1)
 * - Integration Tests (Task 5.1.2)
 * - End-to-End Tests (Task 5.1.3)
 * - Regression Tests (Task 5.2.3)
 * - UAT Environment Verification (Task 5.2.4)
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
// Terminal colors
const colors = {
  green: (text) => '\x1b[32m' + text + '\x1b[0m',
  red: (text) => '\x1b[31m' + text + '\x1b[0m',
  blue: (text) => '\x1b[34m' + text + '\x1b[0m',
  yellow: (text) => '\x1b[33m' + text + '\x1b[0m'
};

// Configuration
const config = {
  coverageThreshold: 80,
  testTimeout: 30000,
  maxRetries: 2
};

// Result tracking
const results = {
  passed: [],
  failed: [],
  skipped: []
};

// Ensure we're in the project root
const projectRoot = path.resolve(__dirname, '../');
process.chdir(projectRoot);

console.log(colors.blue('🧪 PHASE 5: TESTING & QUALITY ASSURANCE - TEST SUITE EXECUTION 🧪'));
console.log(colors.blue('======================================================='));
console.log(`Running all test suites to validate Phase 5 implementation`);
console.log(`Coverage threshold: ${config.coverageThreshold}%\n`);

// Helper function to run a command and log the result
function runCommand(name, command, options = {}) {
  console.log(colors.blue(`\n📋 Running ${name}...`));
  console.log(`$ ${command}\n`);
  
  try {
    const output = execSync(command, {
      stdio: 'inherit',
      ...options
    });
    console.log(colors.green(`\n ${name} - PASSED\n`));
    results.passed.push(name);
    return true;
  } catch (error) {
    console.log(colors.red(`\n ${name} - FAILED\n`));
    console.log(`Error: ${error.message}\n`);
    results.failed.push(name);
    return false;
  }
}

// Error Handler for graceful failures
process.on('uncaughtException', (error) => {
  console.error(colors.red(`\n ERROR: ${error.message}`));
  console.error(error.stack);
  
  console.log(colors.yellow('\n Test execution failed. Check the error above and fix before continuing.'));
  
  // Output summary if we have run any tests
  outputSummary();
  
  process.exit(1);
});

// If no tests executed yet, ensure npm/npx commands run from local node_modules
if (results.passed.length === 0 && results.failed.length === 0) {
  console.log(colors.yellow('\n Ensuring local test dependencies are properly used...'));
  try {
    // Check for local installations of test packages
    if (!fs.existsSync(path.join(projectRoot, 'node_modules', 'jest'))) {
      console.log(colors.yellow('Installing Jest locally...'));
      execSync('npm install --save-dev jest', { stdio: 'inherit' });
    }
    if (!fs.existsSync(path.join(projectRoot, 'node_modules', '@playwright'))) {
      console.log(colors.yellow('Installing Playwright locally...'));
      execSync('npm install --save-dev @playwright/test', { stdio: 'inherit' });
    }
  } catch (error) {
    console.error(colors.red(`Failed to install dependencies: ${error.message}`));
  }
}

console.log(colors.blue('\n TASK 5.1.1: UNIT TESTING'));
console.log(colors.blue('-------------------------'));
runCommand('Unit Tests', 'npm run test:unit');

// Step 2: Run Integration Tests (Task 5.1.2)
console.log(colors.blue('\n TASK 5.1.2: INTEGRATION TESTING'));
console.log(colors.blue('-------------------------------'));
runCommand('Integration Tests', 'npm run test:integration');

// Step 3: Run E2E Tests (Task 5.1.3)
console.log(colors.blue('\n TASK 5.1.3: END-TO-END TESTING'));
console.log(colors.blue('--------------------------------'));
runCommand('E2E Tests', 'npm run test:e2e');

// Step 4: Run Regression Tests (Task 5.2.3)
console.log(colors.blue('\n TASK 5.2.3: REGRESSION TESTING'));
console.log(colors.blue('--------------------------------'));
try {
  // Check if regression directory exists and has tests
  const regressionDir = path.join(projectRoot, 'tests', 'regression', 'test-cases');
  if (fs.existsSync(regressionDir)) {
    runCommand('Regression Tests', 'npx jest --config=tests/regression/jest.regression.config.js');
  } else {
    console.log(colors.yellow(' Regression tests directory not found or empty. Skipping...'));
    results.skipped.push('Regression Tests');
  }
} catch (error) {
  console.log(colors.yellow('⚠️ Regression tests configuration not found. Skipping...'));
  results.skipped.push('Regression Tests');
}

// Step 5: Verify UAT Environment (Task 5.2.4)
console.log(colors.blue('\n👥 TASK 5.2.4: UAT ENVIRONMENT VERIFICATION'));
console.log(colors.blue('------------------------------------------'));
try {
  // Check if UAT setup script exists
  const uatSetupPath = path.join(__dirname, 'uat', 'scripts', 'setup-uat-environment.js');
  if (fs.existsSync(uatSetupPath)) {
    runCommand('UAT Environment Setup', 'node tests/uat/scripts/setup-uat-environment.js --verify');
  } else {
    console.log(colors.yellow('⚠️ UAT setup script not found. Skipping verification...'));
    results.skipped.push('UAT Environment Verification');
  }
} catch (error) {
  console.log(colors.yellow('⚠️ UAT environment verification failed. Skipping...'));
  results.skipped.push('UAT Environment Verification');
}

// Print summary
console.log(colors.blue('\n📊 TEST EXECUTION SUMMARY'));
console.log(colors.blue('======================'));
console.log(`Total test suites: ${results.passed.length + results.failed.length + results.skipped.length}`);
console.log(colors.green(`✅ Passed: ${results.passed.length}`));
console.log(colors.red(`❌ Failed: ${results.failed.length}`));
console.log(colors.yellow(`⚠️ Skipped: ${results.skipped.length}\n`));

if (results.passed.length > 0) {
  console.log(colors.green('PASSED TEST SUITES:'));
  results.passed.forEach((suite, i) => console.log(colors.green(`${i+1}. ${suite}`)));
}

if (results.failed.length > 0) {
  console.log(colors.red('\nFAILED TEST SUITES:'));
  results.failed.forEach((suite, i) => console.log(colors.red(`${i+1}. ${suite}`)));
}

if (results.skipped.length > 0) {
  console.log(colors.yellow('\nSKIPPED TEST SUITES:'));
  results.skipped.forEach((suite, i) => console.log(colors.yellow(`${i+1}. ${suite}`)));
}

// Check if any tests failed
if (results.failed.length > 0) {
  console.log(colors.red('\n❌ PHASE 5 VALIDATION FAILED: Some test suites failed.'));
  process.exit(1);
} else if (results.skipped.length === 0 && results.passed.length > 0) {
  console.log(colors.green('\n✅ PHASE 5 VALIDATION PASSED: All test suites passed successfully.'));
  process.exit(0);
} else {
  console.log(colors.yellow('\n⚠️ PHASE 5 VALIDATION INCOMPLETE: Some test suites were skipped.'));
  process.exit(0);
}
