const { exec } = require('child_process');

console.log('Starting Project API Integration Tests Debug...');

// Run Jest with specific options to get maximum debug info
const command = 'npx jest tests/integration/projects.test.ts --no-cache --runInBand --detectOpenHandles --forceExit --verbose';

exec(command, { maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
  console.log('=== STDOUT ===');
  console.log(stdout);
  
  console.log('\n=== STDERR ===');
  console.log(stderr);
  
  if (error) {
    console.log('\n=== ERROR ===');
    console.log(`Exit code: ${error.code}`);
    console.log(error);
  } else {
    console.log('\n=== SUCCESS ===');
  }
});
