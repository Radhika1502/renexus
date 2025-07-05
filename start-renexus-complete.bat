@echo off
echo ===============================================
echo    🚀 RENEXUS APPLICATION STARTUP SCRIPT 🚀
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
start "Renexus Backend API" cmd /k "cd /d %CD%\backend\api-gateway && echo 🚀 Starting Backend API Server... && node simple-server.js"

echo ⏳ Waiting for backend to start...
timeout /t 5 /nobreak >nul

echo.
echo 🎨 Starting Frontend Development Server (Port 3000)...
echo.
start "Renexus Frontend" cmd /k "cd /d %CD%\frontend\web && echo 🚀 Starting Frontend Server... && npm run dev"

echo ⏳ Waiting for frontend to start...
timeout /t 10 /nobreak >nul

echo.
echo ✅ APPLICATION STARTUP COMPLETE!
echo.
echo 📊 Service Status:
echo   • Backend API: http://localhost:3001
echo   • Frontend App: http://localhost:3000
echo   • Health Check: http://localhost:3001/health
echo.
echo 🌟 Your Renexus application is now running!
echo 🌐 Open your browser and go to: http://localhost:3000
echo.
echo 📝 Note: Two terminal windows will open:
echo   1. Backend API Server (Port 3001)
echo   2. Frontend Development Server (Port 3000)
echo.
echo 🛑 To stop the application, close both terminal windows
echo    or press Ctrl+C in each terminal.
echo.
echo 🎯 Enjoy your Renexus project management application!
echo ===============================================

pause 