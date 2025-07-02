
/**
 * Task Management Module Test Runner
 */
const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Configuration
const testDir = path.join(__dirname, 'src/features/task-management');
const outputFile = path.join(__dirname, 'task-test-results.txt');

// Run the tests
console.log('Running Task Management Module Tests...');

const result = spawnSync('npx', ['jest', testDir, '--json'], {
  encoding: 'utf-8',
  shell: true
});

// Parse the results
try {
  const jsonResult = JSON.parse(result.stdout);
  
  // Write results to file
  fs.writeFileSync(outputFile, JSON.stringify(jsonResult, null, 2));
  
  // Display summary
  console.log('\nTest Summary:');
  console.log(`Total Tests: ${jsonResult.numTotalTests}`);
  console.log(`Passed Tests: ${jsonResult.numPassedTests}`);
  console.log(`Failed Tests: ${jsonResult.numFailedTests}`);
  
  // Display failed tests
  if (jsonResult.numFailedTests > 0) {
    console.log('\nFailed Tests:');
    jsonResult.testResults.forEach(testFile => {
      if (testFile.status === 'failed') {
        console.log(`- ${path.relative(__dirname, testFile.name)}`);
        
        testFile.assertionResults.forEach(test => {
          if (test.status === 'failed') {
            console.log(`  * ${test.fullName}`);
            console.log(`    ${test.failureMessages.join('\n    ')}`);
          }
        });
      }
    });
  }
  
  console.log(`\nDetailed results saved to: ${outputFile}`);
} catch (e) {
  console.error('Failed to parse test results:', e);
  console.log('Raw output:', result.stdout);
  console.log('Error output:', result.stderr);
}
