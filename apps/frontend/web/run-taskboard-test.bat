@echo off
echo Running TaskBoard tests with output...
cd c:\Users\HP\Renexus\apps\frontend\web
npx jest src/features/task-management/components/__tests__/TaskBoard.test.tsx --verbose > taskboard-test-output.txt 2>&1
echo Test output saved to taskboard-test-output.txt
type taskboard-test-output.txt
