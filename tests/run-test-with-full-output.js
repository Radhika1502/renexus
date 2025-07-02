const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Get test file argument
const testFile = process.argv[2];
if (!testFile) {
  console.error('Please provide a test file name (e.g., projects.test.ts)');
  process.exit(1);
}

console.log(`\n===== RUNNING TEST: ${testFile} =====\n`);

// Create output directory if it doesn't exist
const outputDir = path.join(__dirname, 'test-results');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

// Full test path
const testPath = path.join('tests', 'integration', testFile);

// Run the test with jest
const result = spawnSync(
  'npx',
  ['jest', testPath, '--no-cache', '--verbose', '--detectOpenHandles', '--forceExit'],
  {
    stdio: 'pipe',
    encoding: 'utf-8',
    maxBuffer: 5 * 1024 * 1024 // Increase buffer size to 5MB
  }
);

// Print output
console.log('\n----- TEST STDOUT -----\n');
console.log(result.stdout || '(No standard output)');

console.log('\n----- TEST STDERR -----\n');
console.log(result.stderr || '(No error output)');

// Save output to file
const outputFile = path.join(outputDir, `${testFile.replace('.ts', '')}-output.log`);
fs.writeFileSync(outputFile, `STDOUT:\n${result.stdout || '(No output)'}\n\nSTDERR:\n${result.stderr || '(No errors)'}`);

console.log(`\n----- TEST RESULT -----\n`);
console.log(`Exit Code: ${result.status}`);
console.log(`Full output saved to: ${outputFile}`);

if (result.status === 0) {
  console.log('\n✅ TEST PASSED\n');
} else {
  console.log('\n❌ TEST FAILED\n');
}

process.exit(result.status || 0);
