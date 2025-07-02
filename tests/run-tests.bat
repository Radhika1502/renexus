@echo off
echo.
echo ===== RUNNING FIXED INTEGRATION TESTS =====
echo.

echo ----- Testing: Projects Integration Test -----
call npx jest tests/integration/projects.test.ts --no-cache
if %ERRORLEVEL% EQU 0 (
  echo Projects Integration Test: PASSED
) else (
  echo Projects Integration Test: FAILED
)

echo.
echo ----- Testing: Tasks Integration Test -----
call npx jest tests/integration/tasks.test.ts --no-cache
if %ERRORLEVEL% EQU 0 (
  echo Tasks Integration Test: PASSED
) else (
  echo Tasks Integration Test: FAILED
)

echo.
echo ----- Testing: Task Analytics Test -----
call npx jest tests/integration/task-analytics.test.ts --no-cache
if %ERRORLEVEL% EQU 0 (
  echo Task Analytics Test: PASSED
) else (
  echo Task Analytics Test: FAILED
)

echo.
echo ----- Testing: Migration Scripts Test -----
call npx jest tests/integration/migration-scripts.test.ts --no-cache
if %ERRORLEVEL% EQU 0 (
  echo Migration Scripts Test: PASSED
) else (
  echo Migration Scripts Test: FAILED
)

echo.
echo ===== TEST VERIFICATION COMPLETE =====
