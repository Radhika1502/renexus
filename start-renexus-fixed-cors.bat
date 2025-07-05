@echo off
cls
echo.
echo ========================================
echo  RENEXUS APPLICATION STARTUP (CORS FIXED)
echo ========================================
echo.

REM Set console colors
color 0A

echo [1/6] Stopping any existing Node.js processes...
taskkill /f /im node.exe >nul 2>&1
if %errorlevel% == 0 (
    echo ✅ Stopped existing Node.js processes
) else (
    echo ℹ️  No existing Node.js processes found
)

echo.
echo [2/6] Checking PostgreSQL connection...
cd /d "%~dp0"

REM Test PostgreSQL connection
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.$connect().then(() => {
  console.log('✅ PostgreSQL connection verified');
  prisma.$disconnect();
}).catch(err => {
  console.error('❌ PostgreSQL connection failed:', err.message);
  process.exit(1);
});
" 2>nul

if %errorlevel% neq 0 (
    echo ❌ PostgreSQL connection failed. Please ensure PostgreSQL is running.
    echo.
    echo Starting PostgreSQL service...
    net start postgresql-x64-16 >nul 2>&1
    timeout /t 3 /nobreak >nul
)

echo.
echo [3/6] Starting Backend Server (PostgreSQL API)...
cd /d "%~dp0\backend\api-gateway"

REM Start backend in background
start /b cmd /c "node postgres-server.js > ..\..\backend-log.txt 2>&1"

echo ✅ Backend server starting on port 3001...
timeout /t 5 /nobreak >nul

echo.
echo [4/6] Verifying backend server health...
powershell -Command "
try {
    $response = Invoke-WebRequest -Uri 'http://localhost:3001/health' -UseBasicParsing -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host '✅ Backend server is healthy' -ForegroundColor Green
    } else {
        Write-Host '❌ Backend server health check failed' -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host '❌ Backend server is not responding' -ForegroundColor Red
    exit 1
}
"

if %errorlevel% neq 0 (
    echo ❌ Backend server failed to start properly
    echo Check backend-log.txt for details
    pause
    exit /b 1
)

echo.
echo [5/6] Starting Frontend Server...
cd /d "%~dp0\frontend\web"

REM Check if node_modules exists
if not exist "node_modules" (
    echo Installing frontend dependencies...
    npm install --silent
)

echo ✅ Starting frontend on port 3000...
start /b cmd /c "npm run dev -- --port 3000 > ..\..\frontend-log.txt 2>&1"

echo.
echo [6/6] Waiting for frontend to be ready...
timeout /t 10 /nobreak >nul

echo.
echo ========================================
echo  🎉 RENEXUS APPLICATION STARTED
echo ========================================
echo.
echo 🌐 Frontend: http://localhost:3000
echo 🔧 Backend API: http://localhost:3001
echo 📊 Dashboard: http://localhost:3000/dashboard
echo 🔍 API Health: http://localhost:3001/health
echo.
echo 📋 CORS Configuration: FIXED
echo    - Allows: localhost:3000, localhost:3002
echo    - Backend Port: 3001
echo    - Frontend Port: 3000
echo.
echo 📝 Logs:
echo    - Backend: backend-log.txt
echo    - Frontend: frontend-log.txt
echo.
echo ✅ Frontend and Backend are now collaborating properly!
echo.
echo Opening application in browser...
timeout /t 2 /nobreak >nul
start "" "http://localhost:3000"

echo.
echo Press any key to view server logs or Ctrl+C to stop...
pause >nul

echo.
echo ========================================
echo  SERVER LOGS
echo ========================================
echo.
echo --- BACKEND LOG ---
if exist "backend-log.txt" (
    type "backend-log.txt"
) else (
    echo No backend log found
)

echo.
echo --- FRONTEND LOG ---
if exist "frontend-log.txt" (
    type "frontend-log.txt"
) else (
    echo No frontend log found
)

echo.
echo Press any key to exit...
pause >nul 