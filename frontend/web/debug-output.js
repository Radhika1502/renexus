const { spawnSync } = require('child_process');
const fs = require('fs');

// Run the test and capture output
const result = spawnSync('npx', ['jest', 'src/features/task-management/components/__tests__/BasicTest.test.tsx', '--no-cache'], {
  encoding: 'utf8',
  shell: true
});

// Write output to files
fs.writeFileSync('test-stdout.txt', result.stdout || '');
fs.writeFileSync('test-stderr.txt', result.stderr || '');
fs.writeFileSync('test-status.txt', `Exit code: ${result.status}\nError: ${result.error ? result.error.toString() : 'none'}`);

console.log('Debug files created: test-stdout.txt, test-stderr.txt, test-status.txt');
