# Renexus Full Application Starter Script
# This script fixes configuration issues and starts both frontend and backend servers

$ErrorActionPreference = "SilentlyContinue"
Write-Host "🚀 Starting Renexus Application..." -ForegroundColor Cyan

# Make sure we're in the project root
Set-Location -Path "C:\Users\HP\Renexus"

# Check and stop any existing processes on relevant ports
Write-Host "Checking for processes on ports 3000 and 3001..." -ForegroundColor Yellow
$port3000 = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
$port3001 = Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue

if ($port3000) {
    $process3000 = Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess -ErrorAction SilentlyContinue
    if ($process3000) {
        Write-Host "Stopping process on port 3000: $($process3000.ProcessName)" -ForegroundColor Yellow
        Stop-Process -Id $process3000.Id -Force
    }
}

if ($port3001) {
    $process3001 = Get-Process -Id (Get-NetTCPConnection -LocalPort 3001).OwningProcess -ErrorAction SilentlyContinue
    if ($process3001) {
        Write-Host "Stopping process on port 3001: $($process3001.ProcessName)" -ForegroundColor Yellow
        Stop-Process -Id $process3001.Id -Force
    }
}

# Setup backend environment
Write-Host "`n📋 Setting up backend environment..." -ForegroundColor Cyan
Set-Location -Path "backend\api"

# Create .env file if it doesn't exist
if (-not (Test-Path ".env")) {
    Write-Host "Creating backend .env file..." -ForegroundColor Yellow
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
    Set-Content -Path ".env" -Value $backendEnv
    Write-Host "Backend .env file created" -ForegroundColor Green
} else {
    Write-Host "Backend .env file already exists" -ForegroundColor Green
}

# Start backend server in a new window
Write-Host "Starting backend server..." -ForegroundColor Green
Start-Process -FilePath "powershell" -ArgumentList "-NoExit", "-Command", "Set-Location -Path 'C:\Users\HP\Renexus\backend\api'; npm run dev" -WorkingDirectory "C:\Users\HP\Renexus\backend\api"

# Setup frontend environment
Write-Host "`n📋 Setting up frontend environment..." -ForegroundColor Cyan
Set-Location -Path "..\..\frontend\web"

# Create .env.local file if it doesn't exist
if (-not (Test-Path ".env.local")) {
    Write-Host "Creating frontend .env.local file..." -ForegroundColor Yellow
    $frontendEnv = @"
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001
NODE_ENV=development
"@
    Set-Content -Path ".env.local" -Value $frontendEnv
    Write-Host "Frontend .env.local file created" -ForegroundColor Green
} else {
    Write-Host "Frontend .env.local file already exists" -ForegroundColor Green
}

# Install required dependencies
Write-Host "Checking and installing required dependencies..." -ForegroundColor Yellow
npm install @tanstack/react-query @tanstack/react-query-devtools --silent

# Start frontend server in a new window with explicit npx command
Write-Host "Starting frontend server..." -ForegroundColor Green
Start-Process -FilePath "powershell" -ArgumentList "-NoExit", "-Command", "Set-Location -Path 'C:\Users\HP\Renexus\frontend\web'; npx next dev" -WorkingDirectory "C:\Users\HP\Renexus\frontend\web"

# Open browser after a short delay
Write-Host "`n🌐 Opening application in browser..." -ForegroundColor Cyan
Start-Sleep -Seconds 5
Start-Process "http://localhost:3000"

Write-Host "`n✅ Renexus is now running!" -ForegroundColor Green
Write-Host "- Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "- Backend: http://localhost:3001" -ForegroundColor Cyan
Write-Host "- Debug page: http://localhost:3000/debug" -ForegroundColor Cyan
Write-Host "`nPress Ctrl+C in the respective terminal windows to stop the servers" -ForegroundColor Yellow
