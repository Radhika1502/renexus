@echo off
echo Running all Task Management API tests...
echo =======================================

cd c:\Users\HP\Renexus\apps\frontend\web

echo.
echo 1. Running Task CRUD Operations tests...
npx jest src/features/task-management/api/__tests__/taskApi.test.ts --testNamePattern="CRUD operations" --verbose

echo.
echo 2. Running Task Dependencies tests...
npx jest src/features/task-management/api/__tests__/taskDependencies.test.ts --verbose

echo.
echo 3. Running Task Analytics tests...
npx jest src/features/task-management/api/__tests__/taskAnalytics.test.ts --verbose

echo.
echo 4. Running Task Workflow tests...
npx jest src/features/task-management/api/__tests__/taskWorkflow.test.ts --verbose

echo.
echo 5. Running Task Performance tests...
npx jest src/features/task-management/api/__tests__/taskPerformance.test.ts --verbose

echo.
echo =======================================
echo All tests completed!
echo.

pause
