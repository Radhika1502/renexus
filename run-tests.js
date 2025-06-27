const { execSync } = require('child_process');

try {
  console.log('Running all unit tests...');
  const output = execSync('npx jest tests/unit --no-cache', { encoding: 'utf8' });
  console.log(output);
  console.log('All tests completed successfully!');
} catch (error) {
  console.error('Error running tests:');
  console.error(error.stdout);
  process.exit(1);
}
