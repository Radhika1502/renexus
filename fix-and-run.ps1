# Script to fix Next.js installation and run the Renexus application
# This will properly set up both frontend and backend

Write-Host "🛠️ Fixing Renexus Application..." -ForegroundColor Cyan
Write-Host "----------------------------------" -ForegroundColor Cyan

# Stop any running Node.js processes
Write-Host "Stopping any running Node.js processes..." -ForegroundColor Yellow
Get-Process | Where-Object { $_.ProcessName -eq "node" } | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# Fix frontend
Write-Host "`n🔧 Fixing Frontend..." -ForegroundColor Cyan
Set-Location -Path "frontend\web"

# Create .env.local file
Write-Host "Creating frontend environment file..." -ForegroundColor Yellow
$frontendEnv = @"
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001
"@
Set-Content -Path ".env.local" -Value $frontendEnv -Force
Write-Host "Frontend .env.local file created" -ForegroundColor Green

# Fix Next.js installation
Write-Host "Reinstalling Next.js and dependencies..." -ForegroundColor Yellow
npm uninstall next react react-dom
npm install --save next@latest react@latest react-dom@latest
npm install

Write-Host "Frontend dependencies fixed!" -ForegroundColor Green

# Return to root directory
Set-Location -Path "..\.."

# Fix Backend
Write-Host "`n🔧 Fixing Backend..." -ForegroundColor Cyan
Set-Location -Path "backend\api"

# Create .env file
Write-Host "Creating backend environment file..." -ForegroundColor Yellow
$backendEnv = @"
# Database Configuration
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/renexus?schema=public"

# Server Configuration
PORT=3001
NODE_ENV=development
LOG_LEVEL=debug

# Security
JWT_SECRET=renexus-jwt-secret-dev-only
ALLOWED_ORIGINS=http://localhost:3000
"@
Set-Content -Path ".env" -Value $backendEnv -Force
Write-Host "Backend .env file created" -ForegroundColor Green

# Return to root directory
Set-Location -Path "..\.."

# Check PostgreSQL connection
Write-Host "`n🔍 Checking PostgreSQL..." -ForegroundColor Cyan
$pgConnected = $false

try {
    # Use environment variable for psql password
    $env:PGPASSWORD = "postgres"
    $pgOutput = & psql -U postgres -h localhost -c "\conninfo" 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ PostgreSQL is running!" -ForegroundColor Green
        $pgConnected = $true
        
        # Check if database exists
        $dbExists = & psql -U postgres -h localhost -t -c "SELECT 1 FROM pg_database WHERE datname='renexus'" 2>&1
        if ($dbExists -notmatch "1") {
            Write-Host "Creating renexus database..." -ForegroundColor Yellow
            & psql -U postgres -h localhost -c "CREATE DATABASE renexus;" 2>&1
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✅ Database created!" -ForegroundColor Green
            } else {
                Write-Host "⚠️ Failed to create database, but will continue..." -ForegroundColor Yellow
            }
        } else {
            Write-Host "✅ Database renexus already exists" -ForegroundColor Green
        }
    } else {
        Write-Host "⚠️ PostgreSQL not running or not accessible - database features may not work" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️ PostgreSQL check failed: $_" -ForegroundColor Yellow
    Write-Host "⚠️ Continuing without confirmed database connection" -ForegroundColor Yellow
}

# Start servers
Write-Host "`n🚀 Starting Servers..." -ForegroundColor Cyan

# Start backend
Write-Host "Starting Backend Server..." -ForegroundColor Yellow
Start-Process -FilePath "powershell" -ArgumentList "-NoExit", "-Command", "cd '$PWD\backend\api'; npm run dev" -WorkingDirectory "$PWD\backend\api"

# Give backend time to start
Start-Sleep -Seconds 5

# Start frontend
Write-Host "Starting Frontend Server..." -ForegroundColor Yellow
Start-Process -FilePath "powershell" -ArgumentList "-NoExit", "-Command", "cd '$PWD\frontend\web'; npm run dev" -WorkingDirectory "$PWD\frontend\web"

# Open browser
Start-Sleep -Seconds 3
Write-Host "`n🌐 Opening Browser..." -ForegroundColor Cyan

try {
    Start-Process "http://localhost:3000"
    Start-Process "http://localhost:3000/debug"
} catch {
    Write-Host "⚠️ Couldn't open browser automatically. Please open http://localhost:3000 manually." -ForegroundColor Yellow
}

Write-Host "`n✅ DONE! Renexus should now be running" -ForegroundColor Green
Write-Host "- Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "- Backend: http://localhost:3001" -ForegroundColor Cyan
Write-Host "- Debug: http://localhost:3000/debug" -ForegroundColor Cyan
Write-Host "`nℹ️ If you still see 'This site can't be reached', wait a few more seconds and refresh." -ForegroundColor Yellow
Write-Host "ℹ️ To stop the servers, close the terminal windows or press Ctrl+C in each." -ForegroundColor Yellow
