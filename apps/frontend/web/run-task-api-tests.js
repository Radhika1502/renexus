/**
 * Task API Test Runner
 * This script tests the Task API endpoints and verifies all acceptance criteria
 */
const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Configuration
const outputFile = path.join(__dirname, 'task-api-test-results.txt');
const testCategories = [
  {
    name: 'Task CRUD Operations',
    command: 'npx jest src/features/task-management/api/__tests__/taskApi.test.ts --testNamePattern="CRUD operations"',
    acceptanceCriteria: 'All task operations perform correctly'
  },
  {
    name: 'Task Dependencies',
    command: 'npx jest src/features/task-management/api/__tests__/taskDependencies.test.ts',
    acceptanceCriteria: 'Task dependencies can be created and managed'
  },
  {
    name: 'Analytics Data',
    command: 'npx jest src/features/task-management/api/__tests__/taskAnalytics.test.ts',
    acceptanceCriteria: 'Analytics show real-time data'
  },
  {
    name: 'Workflow Automation',
    command: 'npx jest src/features/task-management/api/__tests__/taskWorkflow.test.ts',
    acceptanceCriteria: 'Workflow automation correctly applies business rules'
  },
  {
    name: 'Performance Tests',
    command: 'npx jest src/features/task-management/api/__tests__/taskPerformance.test.ts',
    acceptanceCriteria: 'Performance with large task sets'
  }
];

// Helper function to run a command
function runCommand(command) {
  console.log(`Running command: ${command}`);
  const result = spawnSync(command, {
    encoding: 'utf-8',
    shell: true
  });
  
  return {
    stdout: result.stdout,
    stderr: result.stderr,
    status: result.status,
    success: result.status === 0
  };
}

// Main function to run all tests
async function runTests() {
  console.log('Starting Task API Tests...');
  console.log('==========================');
  
  const results = [];
  let allPassed = true;
  
  // Run each test category
  for (const test of testCategories) {
    console.log(`\nRunning ${test.name}...`);
    const result = runCommand(test.command);
    
    const testResult = {
      name: test.name,
      acceptanceCriteria: test.acceptanceCriteria,
      success: result.success,
      output: result.stdout,
      error: result.stderr
    };
    
    results.push(testResult);
    
    if (!result.success) {
      allPassed = false;
      console.log(`❌ ${test.name} failed!`);
      console.log(result.stderr || 'No error output');
    } else {
      console.log(`✅ ${test.name} passed!`);
    }
  }
  
  // Write results to file
  fs.writeFileSync(outputFile, JSON.stringify(results, null, 2));
  
  // Print summary
  console.log('\n==========================');
  console.log('Test Summary:');
  results.forEach(result => {
    const status = result.success ? '✅ PASSED' : '❌ FAILED';
    console.log(`${status} - ${result.name} (${result.acceptanceCriteria})`);
  });
  
  console.log(`\nOverall Result: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
  console.log(`Detailed results saved to: ${outputFile}`);
  
  return allPassed;
}

// Run the tests
runTests().then(success => {
  if (!success) {
    console.log('\nSome tests failed. Please check the detailed results.');
    process.exit(1);
  } else {
    console.log('\nAll tests passed successfully!');
  }
});
