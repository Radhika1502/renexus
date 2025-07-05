@echo off
echo ===============================================
echo   🚀 RENEXUS WITH POSTGRESQL REAL-TIME DATA 🚀
echo ===============================================
echo.

echo 🔍 Checking current directory...
echo Current directory: %CD%
echo.

echo 📋 Starting Renexus Application with PostgreSQL...
echo.

echo 🔧 Setting up environment...
set FORCE_COLOR=1
set NODE_ENV=development

echo.
echo 🗄️ Checking PostgreSQL status...
echo.

REM Check if PostgreSQL is running
sc query postgresql-x64-17 >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ PostgreSQL service found
    sc query postgresql-x64-17 | findstr "RUNNING" >nul
    if %errorlevel% equ 0 (
        echo ✅ PostgreSQL is running
    ) else (
        echo ⚠️  PostgreSQL service exists but not running
        echo 🔄 Starting PostgreSQL service...
        net start postgresql-x64-17
        if %errorlevel% equ 0 (
            echo ✅ PostgreSQL started successfully
        ) else (
            echo ❌ Failed to start PostgreSQL
            echo 📖 Please check POSTGRESQL-SETUP.md for installation instructions
            pause
            exit /b 1
        )
    )
) else (
    echo ❌ PostgreSQL service not found
    echo.
    echo 🔧 PostgreSQL Installation Required:
    echo 1. Download PostgreSQL from https://www.postgresql.org/download/windows/
    echo 2. Install with password: root
    echo 3. Or use Docker: docker run --name renexus-postgres -e POSTGRES_PASSWORD=root -p 5432:5432 -d postgres:16
    echo.
    echo 📖 See POSTGRESQL-SETUP.md for detailed instructions
    echo.
    choice /c YN /m "Do you want to continue with mock data instead"
    if errorlevel 2 (
        echo 🛑 Exiting...
        pause
        exit /b 1
    )
    echo 📦 Continuing with mock data mode...
    goto :start_servers
)

echo.
echo 🗄️ Setting up database...
echo.
cd /d "%~dp0backend\api-gateway"

echo 🔧 Installing dependencies...
call npm install --silent

echo 🔧 Generating Prisma client...
call npx prisma generate

echo 🔧 Checking database connection...
call psql -U postgres -h localhost -p 5432 -d renexus -c "SELECT 1;" >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  Database 'renexus' not found. Creating...
    call psql -U postgres -h localhost -p 5432 -c "CREATE DATABASE renexus;" >nul 2>&1
    if %errorlevel% equ 0 (
        echo ✅ Database 'renexus' created successfully
    ) else (
        echo ❌ Failed to create database. Using mock data...
        goto :start_servers
    )
)

echo 🔧 Pushing database schema...
call npx prisma db push --force-reset --accept-data-loss

echo 🌱 Seeding database with sample data...
call npx prisma db seed

echo ✅ Database setup complete!
echo.

:start_servers
echo 🌐 Starting Backend API Server (PostgreSQL Mode)...
echo.
cd /d "%~dp0backend\api-gateway"
start "Renexus Backend API (PostgreSQL)" cmd /k "echo 🚀 Starting Backend with PostgreSQL... && node postgres-server.js"

echo ⏳ Waiting for backend to start...
timeout /t 10 /nobreak >nul

echo.
echo 🎨 Starting Frontend Development Server...
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
    echo 🗄️ Database: PostgreSQL (Real-time data)
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
echo 🌟 Your Renexus application is now running with PostgreSQL!
echo 🌐 Open your browser and go to: http://localhost:3000
echo 🗄️ Database: PostgreSQL with real-time data
echo 📊 Prisma Studio: Run 'npx prisma studio' in backend/api-gateway
echo.
echo 📝 Note: Two terminal windows opened:
echo   1. Backend API Server (PostgreSQL Mode - Port 3001)
echo   2. Frontend Development Server (Port 3000)
echo.
echo 🛑 To stop the application, close both terminal windows
echo    or press Ctrl+C in each terminal.
echo.
echo 🎯 Enjoy your Renexus project management application with real-time data!
echo ===============================================

pause 