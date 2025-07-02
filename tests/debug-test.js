const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Get test file from command line argument
const testFile = process.argv[2];
if (!testFile) {
  console.error('Please provide a test file name as an argument (e.g., projects.test.ts)');
  process.exit(1);
}

// Output directory for logs
const outputDir = path.join(__dirname, 'debug-logs');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

console.log(`\n===== DEBUGGING TEST: ${testFile} =====\n`);

// Run the test with maximum debugging information
const result = spawnSync(
  'npx', 
  [
    'jest',
    `tests/integration/${testFile}`,
    '--no-cache',
    '--detectOpenHandles',
    '--runInBand',
    '--verbose',
    '--forceExit'
  ],
  {
    stdio: 'pipe',
    encoding: 'utf-8',
    env: {
      ...process.env,
      // Enable Jest debug logs
      DEBUG: 'jest',
      NODE_OPTIONS: '--trace-warnings'
    },
    maxBuffer: 10 * 1024 * 1024 // 10MB buffer
  }
);

// Save output to file
const outputFile = path.join(outputDir, `${testFile}-debug.log`);
let output = `=== COMMAND EXIT CODE: ${result.status || 'null'} ===\n\n`;
output += `=== STDOUT ===\n${result.stdout || '(No standard output)'}\n\n`;
output += `=== STDERR ===\n${result.stderr || '(No error output)'}\n`;

fs.writeFileSync(outputFile, output);

// Display status
console.log(`Test exit code: ${result.status || 'null'}`);
console.log(`Debug log saved to: ${outputFile}`);

// Show the first part of any errors to help debugging
if (result.stderr) {
  console.log('\n=== ERROR PREVIEW ===');
  console.log(result.stderr.slice(0, 500) + (result.stderr.length > 500 ? '...' : ''));
}

// Export stdout/stderr to console for inspection
console.log('\n=== OUTPUT PREVIEW ===');
if (result.stdout) {
  console.log(result.stdout.slice(0, 300) + (result.stdout.length > 300 ? '...' : ''));
} else {
  console.log('(No output)');
}
