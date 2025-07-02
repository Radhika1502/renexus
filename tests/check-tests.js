const { spawnSync } = require('child_process');

console.log('\n===== CHECKING PHASE 5 TEST STATUS =====\n');

// Run a test and display its output directly
function runTest(name, command) {
  console.log(`\n----- ${name} -----\n`);
  
  const result = spawnSync(command, [], { 
    cwd: process.cwd(),
    shell: true,
    stdio: 'inherit'
  });
  
  if (result.status === 0) {
    console.log(`\n✅ ${name} PASSED\n`);
    return true;
  } else {
    console.log(`\n❌ ${name} FAILED\n`);
    return false;
  }
}

// Run key test files
const tests = [
  { name: 'Projects Integration Test', command: 'npx jest --testPathPattern=tests/integration/projects.test.ts --no-cache' },
  { name: 'Tasks Integration Test', command: 'npx jest --testPathPattern=tests/integration/tasks.test.ts --no-cache' },
  { name: 'Task Analytics Test', command: 'npx jest --testPathPattern=tests/integration/task-analytics.test.ts --no-cache' }
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
if (allPassed) {
  console.log('\n✅ ALL TESTS PASSED\n');
} else {
  console.log('\n❌ SOME TESTS FAILED\n');
  process.exit(1);
}
