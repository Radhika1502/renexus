@echo off
echo Renexus Application Launcher
echo ===========================
echo.

if "%1"=="help" goto help
if "%1"=="stop" goto stop
if "%1"=="status" goto status
if "%1"=="" goto start
if "%1"=="start" goto start
goto help

:help
echo Usage: run-app.bat [command]
echo.
echo Commands:
echo   start    Start all services (default)
echo   stop     Stop all services
echo   status   Show status of all services
echo   help     Show this help message
echo.
echo Services:
echo   - Frontend (Next.js) - Port 3000
echo   - API Gateway - Port 3001
echo   - Auth Service - Port 4001
echo   - Notification Service - Port 4002
echo.
echo Note: This version doesn't require Docker
goto end

:start
echo Starting Renexus Application...
echo.

echo Installing root dependencies...
call npm install
if errorlevel 1 (
    echo Error: Failed to install root dependencies
    goto end
)

echo.
echo Starting services...
echo.

echo Starting Frontend (Next.js)...
start "Frontend" cmd /c "cd frontend/web && npm install && npm run dev"
timeout /t 3 /nobreak >nul

echo Starting API Gateway...
start "API Gateway" cmd /c "cd backend/api-gateway && npm install && npm run dev"
timeout /t 3 /nobreak >nul

echo Starting Auth Service...
start "Auth Service" cmd /c "cd backend/auth-service && npm install && npm run dev"
timeout /t 3 /nobreak >nul

echo Starting Notification Service...
start "Notification Service" cmd /c "cd backend/notification-service && npm install && npm run dev"
timeout /t 3 /nobreak >nul

echo.
echo All services are starting...
echo.
echo Application URLs:
echo   Frontend: http://localhost:3000
echo   API Gateway: http://localhost:3001
echo   Auth Service: http://localhost:4001
echo   Notification Service: http://localhost:4002
echo.
echo Press any key to stop all services...
pause >nul
goto stop

:stop
echo Stopping all services...
taskkill /f /im node.exe 2>nul
taskkill /f /im npm.cmd 2>nul
echo All services stopped.
goto end

:status
echo Checking service status...
echo.
netstat -an | findstr :3000 >nul && echo Frontend: Running || echo Frontend: Stopped
netstat -an | findstr :3001 >nul && echo API Gateway: Running || echo API Gateway: Stopped
netstat -an | findstr :4001 >nul && echo Auth Service: Running || echo Auth Service: Stopped
netstat -an | findstr :4002 >nul && echo Notification Service: Running || echo Notification Service: Stopped
goto end

:end
echo. 