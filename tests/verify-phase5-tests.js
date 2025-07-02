const { execSync } = require('child_process');
const colors = require('colors/safe');
const fs = require('fs');
const path = require('path');

// Create a log file for detailed output
const logFile = path.join(process.cwd(), 'phase5-test-results.log');
fs.writeFileSync(logFile, '===== PHASE 5 TEST VERIFICATION =====\n\n', 'utf8');

console.log(colors.cyan('\n===== PHASE 5 TEST VERIFICATION =====\n'));

function runTest(name, command) {
  console.log(colors.yellow(`\n🧪 Running ${name}...\n`));
  fs.appendFileSync(logFile, `\n\n=== ${name} ===\n\n`, 'utf8');
  
  try {
    const output = execSync(command, { 
      cwd: process.cwd(),
      stdio: 'pipe',
      encoding: 'utf-8'
    });
    
    // Log output to file
    fs.appendFileSync(logFile, output, 'utf8');
    fs.appendFileSync(logFile, `\n✅ ${name} PASSED\n`, 'utf8');
    
    console.log(colors.green(`✅ ${name} PASSED`));
    return true;
  } catch (error) {
    // Log error to file
    fs.appendFileSync(logFile, error.stdout || error.message, 'utf8');
    fs.appendFileSync(logFile, `\n❌ ${name} FAILED\n`, 'utf8');
    
    console.log(colors.red(`❌ ${name} FAILED`));
    console.log(colors.red(error.message));
    return false;
  }
}

// Track test results
const results = {
  passed: [],
  failed: []
};

// Run each test suite individually
const tests = [
  { name: 'Unit Tests', command: 'npx jest --testPathPattern=tests/unit --no-cache' },
  { name: 'Projects Integration Tests', command: 'npx jest --testPathPattern=tests/integration/projects.test.ts --no-cache' },
  { name: 'Tasks Integration Tests', command: 'npx jest --testPathPattern=tests/integration/tasks.test.ts --no-cache' },
  { name: 'Task Analytics Integration Tests', command: 'npx jest --testPathPattern=tests/integration/task-analytics.test.ts --no-cache' },
  { name: 'Migration Scripts Tests', command: 'npx jest --testPathPattern=tests/integration/migration-scripts.test.ts --no-cache' },
  { name: 'Database Tests', command: 'npx jest --testPathPattern=tests/integration/database.test.ts --no-cache' },
  { name: 'Auth Tests', command: 'npx jest --testPathPattern=tests/integration/auth.test.ts --no-cache' },
  { name: 'API Gateway Tests', command: 'npx jest --testPathPattern=tests/integration/api-gateway.test.ts --no-cache' },
  { name: 'End-to-End Flow Tests', command: 'npx jest --testPathPattern=tests/integration/end-to-end-flows.test.ts --no-cache' },
  { name: 'Performance Tests', command: 'npx jest --testPathPattern=tests/integration/performance.test.ts --no-cache' },
  { name: 'Backup Recovery Tests', command: 'npx jest --testPathPattern=tests/integration/backup-recovery.test.ts --no-cache' },
  { name: 'E2E Tests', command: 'npx playwright test --reporter=list' },
  { name: 'Regression Tests', command: 'npx jest --config=tests/regression/jest.regression.config.js --no-cache' }
];

// Run each test
for (const test of tests) {
  const passed = runTest(test.name, test.command);
  if (passed) {
    results.passed.push(test.name);
  } else {
    results.failed.push(test.name);
  }
}

// Final summary
console.log(colors.cyan('\n===== TEST RESULTS SUMMARY =====\n'));
console.log(colors.green(`✅ PASSED: ${results.passed.length} test suites`));
results.passed.forEach(name => console.log(colors.green(`  - ${name}`)));

if (results.failed.length > 0) {
  console.log(colors.red(`\n❌ FAILED: ${results.failed.length} test suites`));
  results.failed.forEach(name => console.log(colors.red(`  - ${name}`)));
  process.exit(1);
} else {
  console.log(colors.rainbow('\n🎉 ALL PHASE 5 TESTS PASSED SUCCESSFULLY! 🎉\n'));
}
