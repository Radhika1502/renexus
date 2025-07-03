/**
 * Simple Test Runner with Console Output
 */
const { spawnSync } = require('child_process');

console.log('Starting test run...');

const result = spawnSync('npx', ['jest', 'src/features/task-management/components/__tests__/SimpleTest.test.js', '--verbose'], {
  stdio: 'inherit',
  shell: true
});

console.log(`Test process exited with code: ${result.status}`);

if (result.status === 0) {
  console.log('✅ Tests PASSED');
} else {
  console.log('❌ Tests FAILED');
}
