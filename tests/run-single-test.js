const { spawnSync } = require('child_process');
const fs = require('fs');

// Get test file from command line argument
const testFile = process.argv[2];
if (!testFile) {
  console.error('Please provide a test file name as an argument');
  process.exit(1);
}

console.log(`Running test: ${testFile}`);

// Run Jest directly with all output captured
const result = spawnSync('npx', 
  ['jest', `tests/integration/${testFile}`, '--no-cache', '--verbose', '--detectOpenHandles'], 
  {
    stdio: 'pipe',
    encoding: 'utf-8'
  }
);

// Save all output regardless of success or failure
fs.writeFileSync(`tests/${testFile}-output.txt`, 
  `STDOUT:\n${result.stdout || ''}\n\nSTDERR:\n${result.stderr || ''}`);

console.log(`Exit code: ${result.status}`);
console.log(`Output saved to tests/${testFile}-output.txt`);

if (result.stdout) {
  console.log('\n--- STDOUT PREVIEW ---');
  console.log(result.stdout.slice(0, 500) + '...');
}

if (result.stderr) {
  console.log('\n--- STDERR PREVIEW ---');
  console.log(result.stderr.slice(0, 500) + '...');
}

process.exit(result.status);
