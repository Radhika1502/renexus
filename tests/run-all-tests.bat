@echo off
echo ===== RUNNING ALL INTEGRATION TESTS =====
echo.

echo Testing projects.test.ts...
call npx jest tests/integration/projects.test.ts --no-cache
if %ERRORLEVEL% EQU 0 (
  echo [PASSED] projects.test.ts
) else (
  echo [FAILED] projects.test.ts
)
echo.

echo Testing tasks.test.ts...
call npx jest tests/integration/tasks.test.ts --no-cache
if %ERRORLEVEL% EQU 0 (
  echo [PASSED] tasks.test.ts
) else (
  echo [FAILED] tasks.test.ts
)
echo.

echo Testing task-analytics.test.ts...
call npx jest tests/integration/task-analytics.test.ts --no-cache
if %ERRORLEVEL% EQU 0 (
  echo [PASSED] task-analytics.test.ts
) else (
  echo [FAILED] task-analytics.test.ts
)
echo.

echo Testing migration-scripts.test.ts...
call npx jest tests/integration/migration-scripts.test.ts --no-cache
if %ERRORLEVEL% EQU 0 (
  echo [PASSED] migration-scripts.test.ts
) else (
  echo [FAILED] migration-scripts.test.ts
)
echo.

echo ===== SUMMARY =====
echo Done running all integration tests.
echo Check output above for any failures.
pause
