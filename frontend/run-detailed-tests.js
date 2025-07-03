/**
 * Detailed Test Runner for Task Management Module
 * 
 * This script runs tests for each file individually and provides detailed output.
 */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

// Configuration
const testDir = path.join(__dirname, 'src/features/task-management');
const outputFile = path.join(__dirname, 'detailed-test-results.txt');

// Clear previous output file
if (fs.existsSync(outputFile)) {
  fs.unlinkSync(outputFile);
}

// Helper function to log messages
function log(message) {
  console.log(message);
  fs.appendFileSync(outputFile, message + '\n');
}

// Find all test files
function findTestFiles(dir) {
  const testFiles = [];
  
  function traverse(currentDir) {
    const files = fs.readdirSync(currentDir);
    
    for (const file of files) {
      const filePath = path.join(currentDir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        traverse(filePath);
      } else if (file.endsWith('.test.js') || file.endsWith('.test.jsx') || 
                file.endsWith('.test.ts') || file.endsWith('.test.tsx')) {
        testFiles.push(filePath);
      }
    }
  }
  
  traverse(dir);
  return testFiles;
}

// Run tests for each file
function runTests() {
  log('=== Task Management Module Test Results ===');
  log(`Started at: ${new Date().toISOString()}`);
  log('');
  
  const testFiles = findTestFiles(testDir);
  log(`Found ${testFiles.length} test files.`);
  log('');
  
  let passedTests = 0;
  let failedTests = 0;
  
  for (const testFile of testFiles) {
    const relativePath = path.relative(__dirname, testFile);
    log(`Running test: ${relativePath}`);
    
    const result = spawnSync('npx', ['jest', relativePath, '--no-cache'], {
      encoding: 'utf-8',
      shell: true
    });
    
    if (result.status === 0) {
      log(`✅ PASSED: ${relativePath}`);
      passedTests++;
    } else {
      log(`❌ FAILED: ${relativePath}`);
      log('Error output:');
      log(result.stdout || 'No stdout');
      log(result.stderr || 'No stderr');
      failedTests++;
    }
    
    log('');
  }
  
  log('=== Summary ===');
  log(`Total tests: ${testFiles.length}`);
  log(`Passed: ${passedTests}`);
  log(`Failed: ${failedTests}`);
  log(`Success rate: ${(passedTests / testFiles.length * 100).toFixed(2)}%`);
  log('');
  log(`Finished at: ${new Date().toISOString()}`);
  
  console.log(`\nDetailed results saved to: ${outputFile}`);
  
  return {
    total: testFiles.length,
    passed: passedTests,
    failed: failedTests
  };
}

// Run the tests
const results = runTests();

// Exit with appropriate code
process.exit(results.failed > 0 ? 1 : 0);
