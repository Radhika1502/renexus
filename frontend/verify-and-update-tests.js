/**
 * This script runs all the Task API tests and updates the QA_Analysis_FIX_Implement.md file
 * with the test results and acceptance criteria status
 */
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const qaFilePath = path.join(__dirname, '..', '..', 'QA_Analysis_FIX_Implement.md');
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
    name: 'Task Analytics',
    command: 'npx jest src/features/task-management/api/__tests__/taskAnalytics.test.ts',
    acceptanceCriteria: 'Analytics show real-time data'
  },
  {
    name: 'Task Workflow',
    command: 'npx jest src/features/task-management/api/__tests__/taskWorkflow.test.ts',
    acceptanceCriteria: 'Workflow automation correctly applies business rules'
  },
  {
    name: 'Task Performance',
    command: 'npx jest src/features/task-management/api/__tests__/taskPerformance.test.ts',
    acceptanceCriteria: 'Performance with large task sets'
  }
];

// Helper function to run a command
function runCommand(command) {
  console.log(`Running command: ${command}`);
  const result = spawnSync(command, {
    encoding: 'utf-8',
    shell: true,
    cwd: __dirname
  });
  
  return {
    stdout: result.stdout,
    stderr: result.stderr,
    status: result.status,
    success: result.status === 0
  };
}

// Update the QA file with test results
function updateQAFile(results) {
  console.log('Updating QA_Analysis_FIX_Implement.md file...');
  
  try {
    // Read the current content of the QA file
    let content = fs.readFileSync(qaFilePath, 'utf8');
    
    // Update acceptance criteria
    results.forEach(result => {
      const checkmark = result.success ? '✅' : '⬜️';
      const regex = new RegExp(`- (?:⬜️|✅) ${result.acceptanceCriteria}`, 'g');
      content = content.replace(regex, `- ${checkmark} ${result.acceptanceCriteria}`);
    });
    
    // Write the updated content back to the file
    fs.writeFileSync(qaFilePath, content);
    
    console.log('QA file updated successfully!');
  } catch (error) {
    console.error('Failed to update QA file:', error);
  }
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
  
  // Print summary
  console.log('\n==========================');
  console.log('Test Summary:');
  results.forEach(result => {
    const status = result.success ? '✅ PASSED' : '❌ FAILED';
    console.log(`${status} - ${test.name} (${result.acceptanceCriteria})`);
  });
  
  console.log(`\nOverall Result: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
  
  // Update the QA file with the test results
  updateQAFile(results);
  
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
