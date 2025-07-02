const { execSync } = require('child_process');

console.log('\n===== VERIFYING FIXED TESTS =====\n');

// Function to run a test and display result
function runTest(name, command) {
  console.log(`\n----- Testing: ${name} -----`);
  
  try {
    // Run the test with output displayed directly to console
    execSync(command, { 
      cwd: process.cwd(),
      stdio: 'inherit'
    });
    console.log(`\n✅ ${name} PASSED\n`);
    return true;
  } catch (error) {
    console.log(`\n❌ ${name} FAILED\n`);
    return false;
  }
}

// Run the previously failing tests
const tests = [
  { 
    name: 'Projects Integration Test', 
    command: 'npx jest tests/integration/projects.test.ts --no-cache' 
  },
  { 
    name: 'Tasks Integration Test', 
    command: 'npx jest tests/integration/tasks.test.ts --no-cache' 
  },
  { 
    name: 'Task Analytics Test', 
    command: 'npx jest tests/integration/task-analytics.test.ts --no-cache' 
  },
  { 
    name: 'Migration Scripts Test', 
    command: 'npx jest tests/integration/migration-scripts.test.ts --no-cache' 
  }
];

// Run each test
let allPassed = true;
for (const test of tests) {
  const passed = runTest(test.name, test.command);
  if (!passed) {
    allPassed = false;
  }
}

// Final status
console.log('\n===== TEST RESULTS =====');
if (allPassed) {
  console.log('\n✅ ALL FIXED TESTS ARE NOW PASSING!\n');
} else {
  console.log('\n❌ SOME TESTS ARE STILL FAILING\n');
  process.exit(1);
}
