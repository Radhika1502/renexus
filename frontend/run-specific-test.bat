@echo off
echo Running specific test with full path...
cd c:\Users\HP\Renexus\apps\frontend\web
npx jest c:/Users/HP/Renexus/apps/frontend/web/src/features/task-management/components/__tests__/TaskBoard.test.tsx --verbose > specific-test-output.txt 2>&1
echo Test output saved to specific-test-output.txt
type specific-test-output.txt
