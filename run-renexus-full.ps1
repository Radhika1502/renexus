# Comprehensive script to run Renexus application with PostgreSQL
# This script sets up both backend and frontend

Write-Host "Starting Renexus Full Setup..." -ForegroundColor Cyan
Write-Host "----------------------------------" -ForegroundColor Cyan

# Create necessary directories
if (-not (Test-Path "backend\api\.env")) {
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
    Set-Content -Path "backend\api\.env" -Value $backendEnv
    Write-Host "Backend .env file created" -ForegroundColor Green
}

if (-not (Test-Path "frontend\web\.env.local")) {
    Write-Host "Creating frontend environment file..." -ForegroundColor Yellow
    $frontendEnv = @"
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001
"@
    Set-Content -Path "frontend\web\.env.local" -Value $frontendEnv
    Write-Host "Frontend .env.local file created" -ForegroundColor Green
}

# Check if PostgreSQL is running
Write-Host "Checking PostgreSQL connection..." -ForegroundColor Yellow
try {
    $env:PGPASSWORD = "postgres"
    $testConnection = & psql -U postgres -h localhost -c "\conninfo" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "PostgreSQL is running" -ForegroundColor Green
        
        # Check if database exists
        $dbExists = & psql -U postgres -h localhost -t -c "SELECT 1 FROM pg_database WHERE datname='renexus'" 2>&1
        if ($dbExists -notmatch "1") {
            Write-Host "Creating renexus database..." -ForegroundColor Yellow
            & psql -U postgres -h localhost -c "CREATE DATABASE renexus" 2>&1
            Write-Host "Database created" -ForegroundColor Green
        } else {
            Write-Host "Database renexus already exists" -ForegroundColor Green
        }
    } else {
        Write-Host "PostgreSQL is not running or not accessible. Please start PostgreSQL first." -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "Failed to connect to PostgreSQL: $_" -ForegroundColor Red
    Write-Host "Please make sure PostgreSQL is installed and running with username 'postgres' and password 'postgres'" -ForegroundColor Red
    exit 1
}

# Start backend server
Write-Host "`nStarting backend server..." -ForegroundColor Cyan
Start-Process -FilePath "powershell" -ArgumentList "-NoExit", "-Command", "cd '$PWD\backend\api'; Write-Host 'Starting Renexus Backend...' -ForegroundColor Cyan; npm run start:dev" -WorkingDirectory "$PWD\backend\api"

# Give the backend time to start
Write-Host "Waiting for backend server to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Start frontend server
Write-Host "`nStarting frontend server..." -ForegroundColor Cyan
Start-Process -FilePath "powershell" -ArgumentList "-NoExit", "-Command", "cd '$PWD\frontend\web'; Write-Host 'Starting Renexus Frontend...' -ForegroundColor Cyan; npm run dev" -WorkingDirectory "$PWD\frontend\web"

# Open application in browser
Write-Host "`nOpening application in browser..." -ForegroundColor Cyan
Start-Process "http://localhost:3000/debug"

Write-Host "`nRenexus is now running!" -ForegroundColor Green
Write-Host "- Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "- Backend: http://localhost:3001" -ForegroundColor Cyan
Write-Host "- Debug Page: http://localhost:3000/debug" -ForegroundColor Cyan
Write-Host "`nPress Ctrl+C in the respective terminal windows to stop the servers" -ForegroundColor Yellow
