const { spawn } = require('child_process');

const jest = spawn('npx', ['jest', 'src/features/task-management/components/__tests__/TaskTimeTracking.test.tsx', '--no-cache'], {
  stdio: 'pipe',
  shell: true
});

jest.stdout.on('data', (data) => {
  console.log(`STDOUT: ${data}`);
});

jest.stderr.on('data', (data) => {
  console.error(`STDERR: ${data}`);
});

jest.on('error', (error) => {
  console.error(`ERROR: ${error.message}`);
});

jest.on('close', (code) => {
  console.log(`Process exited with code ${code}`);
});
