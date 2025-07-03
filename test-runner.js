const { spawn } = require('child_process');

// Test files to run for Task Management Module (Section 1.1)
const testFiles = [
  'src/features/task-management/components/__tests__/TaskTimeTracking.test.tsx',
  'src/features/task-management/components/__tests__/TaskBoard.test.tsx',
  'src/features/task-management/hooks/__tests__/useTaskRealtime.test.ts',
  'src/features/task-management/components/__tests__/TaskAttachments.test.tsx'
];

async function runTest(testFile) {
  return new Promise((resolve) => {
    console.log(`\n🧪 Running tests for: ${testFile}`);
    console.log('='.repeat(60));
    
    const child = spawn('npm', ['test', testFile, '--verbose'], {
      cwd: process.cwd(),
      stdio: 'inherit',
      shell: true
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ PASSED: ${testFile}`);
      } else {
        console.log(`❌ FAILED: ${testFile} (exit code: ${code})`);
      }
      resolve(code);
    });
  });
}

async function runAllTests() {
  console.log('🚀 Starting Task Management Module Tests (Section 1.1)');
  console.log('='.repeat(60));
  
  const results = [];
  
  for (const testFile of testFiles) {
    const exitCode = await runTest(testFile);
    results.push({ testFile, passed: exitCode === 0 });
  }
  
  // Summary
  console.log('\n📊 TEST SUMMARY');
  console.log('='.repeat(60));
  
  let totalPassed = 0;
  results.forEach(({ testFile, passed }) => {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} ${testFile.split('/').pop()}`);
    if (passed) totalPassed++;
  });
  
  console.log(`\n🎯 OVERALL: ${totalPassed}/${results.length} test suites passed`);
  console.log(`📈 Success Rate: ${Math.round((totalPassed / results.length) * 100)}%`);
  
  if (totalPassed === results.length) {
    console.log('🎉 ALL TESTS PASSED! Task Management Module is 100% functional!');
  } else {
    console.log('⚠️  Some tests failed. Please review the failures above.');
  }
}

runAllTests().catch(console.error); 