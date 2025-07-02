/**
 * Custom test runner script to ensure proper output
 */
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Configuration
const TEST_FILE = process.argv[2] || 'tests/integration/projects.test.ts';
const LOG_DIR = path.join(__dirname, 'test-results');

// Ensure log directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

// Generate log file names
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const baseLogName = path.basename(TEST_FILE).replace('.ts', '');
const outputLogPath = path.join(LOG_DIR, `${baseLogName}-output-${timestamp}.log`);
const resultLogPath = path.join(LOG_DIR, `${baseLogName}-result-${timestamp}.log`);

console.log(`Running test: ${TEST_FILE}`);
console.log(`Output log: ${outputLogPath}`);
console.log(`Result log: ${resultLogPath}`);

// Set up output streams
const outputLog = fs.createWriteStream(outputLogPath, { flags: 'w' });
const resultLog = fs.createWriteStream(resultLogPath, { flags: 'w' });

// Write header to logs
outputLog.write(`===== TEST OUTPUT LOG =====\n`);
outputLog.write(`Test: ${TEST_FILE}\n`);
outputLog.write(`Date: ${new Date().toISOString()}\n\n`);

resultLog.write(`===== TEST RESULT LOG =====\n`);
resultLog.write(`Test: ${TEST_FILE}\n`);
resultLog.write(`Date: ${new Date().toISOString()}\n\n`);

// Run test with Jest
const testProcess = spawn(
  'npx', 
  [
    'jest', 
    TEST_FILE,
    '--verbose',
    '--no-cache',
    '--forceExit',
    '--detectOpenHandles',
    '--runInBand',
  ],
  { 
    stdio: 'pipe',
    shell: true
  }
);

// Log everything to console and to file
testProcess.stdout.on('data', (data) => {
  const output = data.toString();
  console.log(output);
  outputLog.write(output);
});

testProcess.stderr.on('data', (data) => {
  const output = data.toString();
  console.error(output);
  outputLog.write(`[ERROR] ${output}`);
});

// Handle test completion
testProcess.on('close', (code) => {
  const result = `\nTest process exited with code ${code}`;
  console.log(result);
  resultLog.write(result);
  
  // Close log files
  outputLog.end();
  resultLog.end();
  
  // Exit with the same code
  process.exit(code);
});
