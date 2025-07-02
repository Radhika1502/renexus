@echo off
echo Running tests with output...
cd c:\Users\HP\Renexus\apps\frontend\web
npx jest src/features/task-management/components/__tests__/SimpleTest.test.js --verbose > test-output.txt 2>&1
echo Test output saved to test-output.txt
type test-output.txt
