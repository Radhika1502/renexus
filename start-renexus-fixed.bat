@echo off
echo ===============================================
echo    🚀 RENEXUS APPLICATION STARTUP (FIXED) 🚀
echo ===============================================
echo.

echo 🔍 Checking current directory...
echo Current directory: %CD%
echo.

echo 📋 Starting Renexus Application Services...
echo.

echo 🔧 Setting up environment...
set FORCE_COLOR=1
set NODE_ENV=development

echo.
echo 🌐 Starting Backend API Server (Port 3001)...
echo.
cd /d "%~dp0backend\api-gateway"
start "Renexus Backend API" cmd /k "echo 🚀 Starting Backend API Server... && node simple-server.js"

echo ⏳ Waiting for backend to start...
timeout /t 8 /nobreak >nul

echo.
echo 🎨 Starting Frontend Development Server (Port 3000)...
echo.
cd /d "%~dp0frontend\web"
start "Renexus Frontend" cmd /k "echo 🚀 Starting Frontend Server... && npm run dev"

echo ⏳ Waiting for frontend to start...
timeout /t 15 /nobreak >nul

echo.
echo ✅ APPLICATION STARTUP COMPLETE!
echo.

echo 📊 Checking Service Status...
cd /d "%~dp0"

echo.
echo 🔍 Testing Backend API...
curl -s http://localhost:3001/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Backend API: RUNNING on http://localhost:3001
) else (
    echo ❌ Backend API: NOT RESPONDING
)

echo.
echo 🔍 Testing Frontend...
curl -s http://localhost:3000 >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Frontend: RUNNING on http://localhost:3000
) else (
    echo ❌ Frontend: NOT RESPONDING
)

echo.
echo 🌟 Your Renexus application should now be running!
echo 🌐 Open your browser and go to: http://localhost:3000
echo.
echo 📝 Note: Two terminal windows opened:
echo   1. Backend API Server (Port 3001)
echo   2. Frontend Development Server (Port 3000)
echo.
echo 🛑 To stop the application, close both terminal windows
echo    or press Ctrl+C in each terminal.
echo.
echo 🎯 Enjoy your Renexus project management application!
echo ===============================================

pause 