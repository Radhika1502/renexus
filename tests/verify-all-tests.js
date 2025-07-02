const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Utility to run a command and log output
function runCommand(command, args = [], options = {}) {
  console.log(`\n> Running: ${command} ${args.join(' ')}\n`);
  
  const result = spawnSync(command, args, {
    stdio: 'pipe', // Capture output
    encoding: 'utf-8',
    ...options
  });
  
  if (result.status === 0) {
    console.log('\n✅ COMMAND SUCCEEDED\n');
  } else {
    console.log('\n❌ COMMAND FAILED\n');
  }
  
  if (result.stdout) {
    console.log('--- STDOUT ---');
    console.log(result.stdout);
  }
  
  if (result.stderr) {
    console.log('--- STDERR ---');
    console.log(result.stderr);
  }
  
  return result;
}

console.log('\n========== RENEXUS PHASE 5 TEST VERIFICATION ==========\n');
console.log('This script will run each integration test and verify if it passes.');

// Create output directory for test results
const outputDir = path.join(__dirname, 'test-results');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

// Integration tests to run
const integrationTests = [
  'projects.test.ts',
  'tasks.test.ts',
  'task-analytics.test.ts',
  'migration-scripts.test.ts'
];

let allPassed = true;
const results = {};

// Run each integration test
integrationTests.forEach(testFile => {
  console.log(`\n\n===== Testing: ${testFile} =====\n`);
  const testPath = `tests/integration/${testFile}`;
  
  console.log('Running test with detailed error reporting...');
  const result = runCommand('npx', ['jest', testPath, '--no-cache', '--verbose', '--detectOpenHandles'], {
    cwd: process.cwd()
  });
  
  // Save detailed output to file for analysis
  const outputFile = path.join(outputDir, `${testFile.replace('.ts', '')}-result.log`);
  fs.writeFileSync(outputFile, `STDOUT:\n${result.stdout}\n\nSTDERR:\n${result.stderr}`);
  
  const passed = result.status === 0;
  results[testFile] = {
    passed,
    exitCode: result.status
  };
  
  if (!passed) {
    allPassed = false;
  }
});

// Final report
console.log('\n\n===== TEST RESULTS SUMMARY =====\n');
Object.entries(results).forEach(([test, result]) => {
  console.log(`${test}: ${result.passed ? '✅ PASSED' : '❌ FAILED'} (Exit code: ${result.exitCode})`);
});

console.log('\n===========================================\n');

if (allPassed) {
  console.log('✅ ALL TESTS PASSED SUCCESSFULLY! ✅');
  process.exit(0);
} else {
  console.log('❌ SOME TESTS FAILED! See logs in tests/test-results/ directory for details. ❌');
  process.exit(1);
}
