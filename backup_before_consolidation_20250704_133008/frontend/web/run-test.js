const { execSync } = require('child_process');

try {
  const output = execSync('npx jest src/features/task-management/components/__tests__/TaskTimeTracking.test.tsx --no-cache', { 
    encoding: 'utf8',
    stdio: 'pipe'
  });
  console.log('Test output:');
  console.log(output);
  console.log('Tests completed successfully!');
} catch (error) {
  console.error('Tests failed with error:');
  console.error(error.stdout);
  console.error(error.stderr);
  process.exit(1);
}
