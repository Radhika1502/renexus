@echo off
setlocal enabledelayedexpansion

echo ============================================
echo           Renexus Application Launcher
echo ============================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if npm is installed
npm --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: npm is not installed or not in PATH
    echo Please install npm or update Node.js
    pause
    exit /b 1
)

echo Node.js and npm are installed. Continuing...
echo.

REM Stop any existing Node.js processes
echo Stopping any existing Node.js processes...
taskkill /f /im node.exe >nul 2>&1
taskkill /f /im npm.cmd >nul 2>&1
echo.

REM Install root dependencies
echo Installing root dependencies...
if exist package.json (
    npm install
    if errorlevel 1 (
        echo ERROR: Failed to install root dependencies
        pause
        exit /b 1
    )
    echo Root dependencies installed successfully.
) else (
    echo WARNING: No package.json found in root directory
)
echo.

REM Install frontend dependencies
echo Installing frontend dependencies...
if exist frontend\web\package.json (
    cd frontend\web
    npm install
    if errorlevel 1 (
        echo ERROR: Failed to install frontend dependencies
        cd ..\..
        pause
        exit /b 1
    )
    echo Frontend dependencies installed successfully.
    cd ..\..
) else (
    echo ERROR: Frontend package.json not found
    pause
    exit /b 1
)
echo.

REM Install backend dependencies
echo Installing backend dependencies...

REM API Gateway
if exist backend\api-gateway\package.json (
    echo Installing API Gateway dependencies...
    cd backend\api-gateway
    npm install
    if errorlevel 1 (
        echo ERROR: Failed to install API Gateway dependencies
        cd ..\..
        pause
        exit /b 1
    )
    echo API Gateway dependencies installed successfully.
    cd ..\..
) else (
    echo WARNING: API Gateway package.json not found
)

REM Auth Service
if exist backend\auth-service\package.json (
    echo Installing Auth Service dependencies...
    cd backend\auth-service
    npm install
    if errorlevel 1 (
        echo ERROR: Failed to install Auth Service dependencies
        cd ..\..
        pause
        exit /b 1
    )
    echo Auth Service dependencies installed successfully.
    cd ..\..
) else (
    echo WARNING: Auth Service package.json not found
)

REM Notification Service
if exist backend\notification-service\package.json (
    echo Installing Notification Service dependencies...
    cd backend\notification-service
    npm install
    if errorlevel 1 (
        echo ERROR: Failed to install Notification Service dependencies
        cd ..\..
        pause
        exit /b 1
    )
    echo Notification Service dependencies installed successfully.
    cd ..\..
) else (
    echo WARNING: Notification Service package.json not found
)

echo.
echo All dependencies installed successfully!
echo.

REM Start services
echo Starting services...
echo.

echo Starting Frontend (Next.js) on port 3000...
start "Renexus Frontend" cmd /k "cd /d %~dp0frontend\web && npm run dev"
timeout /t 5 /nobreak >nul

echo Starting API Gateway on port 3001...
start "Renexus API Gateway" cmd /k "cd /d %~dp0backend\api-gateway && npm run dev"
timeout /t 3 /nobreak >nul

echo Starting Auth Service on port 4001...
start "Renexus Auth Service" cmd /k "cd /d %~dp0backend\auth-service && npm run dev"
timeout /t 3 /nobreak >nul

echo Starting Notification Service on port 4002...
start "Renexus Notification Service" cmd /k "cd /d %~dp0backend\notification-service && npm run dev"
timeout /t 3 /nobreak >nul

echo.
echo ============================================
echo           Services Started Successfully!
echo ============================================
echo.
echo Application URLs:
echo   Frontend:              http://localhost:3000
echo   API Gateway:           http://localhost:3001
echo   Auth Service:          http://localhost:4001
echo   Notification Service:  http://localhost:4002
echo.
echo Note: Each service is running in its own window.
echo       Close the individual windows to stop services.
echo.
echo Waiting 10 seconds for services to fully start...
timeout /t 10 /nobreak >nul

echo.
echo Checking service status...
netstat -an | findstr :3000 >nul && echo   Frontend: Running || echo   Frontend: Not responding
netstat -an | findstr :3001 >nul && echo   API Gateway: Running || echo   API Gateway: Not responding
netstat -an | findstr :4001 >nul && echo   Auth Service: Running || echo   Auth Service: Not responding
netstat -an | findstr :4002 >nul && echo   Notification Service: Running || echo   Notification Service: Not responding

echo.
echo ============================================
echo   Your Renexus application is now running!
echo   Open http://localhost:3000 in your browser
echo ============================================
echo.

REM Try to open the application in the default browser
echo Opening application in browser...
start http://localhost:3000

echo.
echo Press any key to exit this launcher...
echo (Note: Services will continue running in their own windows)
pause >nul 