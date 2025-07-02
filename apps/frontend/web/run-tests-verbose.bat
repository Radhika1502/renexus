@echo off
echo Running Task Management Tests with Verbose Output...
echo.

set TEST_PATH=%1
if "%TEST_PATH%"=="" set TEST_PATH=src/features/task-management

echo Test path: %TEST_PATH%
echo.

npx jest %TEST_PATH% --no-cache --verbose > test-output.txt 2>&1
set EXIT_CODE=%ERRORLEVEL%

echo.
echo Test Results:
echo -------------
type test-output.txt

echo.
if %EXIT_CODE% EQU 0 (
  echo All tests PASSED!
) else (
  echo Some tests FAILED! See above for details.
)

exit /b %EXIT_CODE%
