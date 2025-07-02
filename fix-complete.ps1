# Comprehensive fix script for Renexus application
# This script will properly install all dependencies and start both services

Write-Host "🔧 Fixing Renexus Application..." -ForegroundColor Cyan
Write-Host "----------------------------------" -ForegroundColor Cyan

# Stop any running Node.js processes
Write-Host "Stopping any running Node.js processes..." -ForegroundColor Yellow
Get-Process | Where-Object { $_.ProcessName -eq "node" } | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# Clear logs
Write-Host "Clearing log files..." -ForegroundColor Yellow
if (Test-Path "$PSScriptRoot\logs") {
    Remove-Item -Path "$PSScriptRoot\logs\*.log" -Force -ErrorAction SilentlyContinue
}
else {
    New-Item -ItemType Directory -Path "$PSScriptRoot\logs" -Force | Out-Null
}

# Fix frontend
Write-Host "`n🔧 Fixing Frontend..." -ForegroundColor Cyan
Set-Location -Path "$PSScriptRoot\frontend\web"

# Create environment file
Write-Host "Creating frontend environment file..." -ForegroundColor Yellow
$frontendEnv = "NEXT_PUBLIC_API_URL=http://localhost:3001"
Set-Content -Path ".env.local" -Value $frontendEnv -Force
Write-Host "Frontend .env.local file created" -ForegroundColor Green

# Clean install of Next.js
Write-Host "Reinstalling Next.js and dependencies..." -ForegroundColor Yellow

# Remove node_modules completely and reinstall
if (Test-Path "node_modules") {
    Write-Host "Removing old node_modules..." -ForegroundColor Yellow
    Remove-Item -Path "node_modules" -Recurse -Force -ErrorAction SilentlyContinue
}

# Clean npm cache
Write-Host "Cleaning npm cache..." -ForegroundColor Yellow
npm cache clean --force

# Install dependencies with explicit Next.js version
Write-Host "Installing dependencies..." -ForegroundColor Yellow
npm install --save next@14.2.3 react@18.3.1 react-dom@18.3.1
npm install

# Verify Next.js installation
if (Test-Path "node_modules\.bin\next.cmd") {
    Write-Host "✅ Next.js installed successfully!" -ForegroundColor Green
} else {
    Write-Host "❌ Next.js installation failed. Installing globally..." -ForegroundColor Red
    npm install -g next
}

Write-Host "Frontend dependencies fixed!" -ForegroundColor Green

# Return to root directory
Set-Location -Path "$PSScriptRoot"

# Fix Backend
Write-Host "`n🔧 Fixing Backend..." -ForegroundColor Cyan
Set-Location -Path "$PSScriptRoot\backend\api"

# Create environment file
Write-Host "Creating backend environment file..." -ForegroundColor Yellow
$backendEnv = @'
# Database Configuration
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/renexus?schema=public"

# Server Configuration
PORT=3001
NODE_ENV=development
LOG_LEVEL=debug

# Security
JWT_SECRET=renexus-jwt-secret-dev-only
ALLOWED_ORIGINS=http://localhost:3000
'@
Set-Content -Path ".env" -Value $backendEnv -Force
Write-Host "Backend .env file created" -ForegroundColor Green

# Clean install of backend dependencies
Write-Host "Reinstalling backend dependencies..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Write-Host "Removing old node_modules..." -ForegroundColor Yellow
    Remove-Item -Path "node_modules" -Recurse -Force -ErrorAction SilentlyContinue
}

# Install dependencies
npm install

# Return to root directory
Set-Location -Path "$PSScriptRoot"

# Start servers
Write-Host "`n🚀 Starting Servers..." -ForegroundColor Cyan

# Start backend with explicit logging
Write-Host "Starting Backend Server..." -ForegroundColor Yellow
$backendLogPath = "$PSScriptRoot\logs\backend.log"
Start-Process -FilePath "powershell" -ArgumentList "-Command", "Set-Location -Path '$PSScriptRoot\backend\api'; npm run dev | Tee-Object -FilePath '$backendLogPath'" -WindowStyle Normal

# Wait for backend to initialize
Write-Host "Waiting for backend to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Start frontend with explicit path to next binary
Write-Host "Starting Frontend Server..." -ForegroundColor Yellow
$frontendLogPath = "$PSScriptRoot\logs\frontend.log"

# Use direct path to next.cmd if it exists, otherwise try global next
if (Test-Path "$PSScriptRoot\frontend\web\node_modules\.bin\next.cmd") {
    $nextPath = "$PSScriptRoot\frontend\web\node_modules\.bin\next.cmd"
    Write-Host "Using local Next.js installation: $nextPath" -ForegroundColor Green
    Start-Process -FilePath "powershell" -ArgumentList "-Command", "Set-Location -Path '$PSScriptRoot\frontend\web'; & '$nextPath' dev | Tee-Object -FilePath '$frontendLogPath'" -WindowStyle Normal
} else {
    Write-Host "Using global Next.js installation" -ForegroundColor Yellow
    Start-Process -FilePath "powershell" -ArgumentList "-Command", "Set-Location -Path '$PSScriptRoot\frontend\web'; npx next dev | Tee-Object -FilePath '$frontendLogPath'" -WindowStyle Normal
}

# Open browser
Start-Sleep -Seconds 5
Write-Host "`n🌐 Opening Browser..." -ForegroundColor Cyan

try {
    Start-Process "http://localhost:3000"
} catch {
    Write-Host "Could not open browser automatically. Please open http://localhost:3000 manually." -ForegroundColor Yellow
}

Write-Host "`n✅ DONE! Renexus should now be running" -ForegroundColor Green
Write-Host "- Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "- Backend: http://localhost:3001" -ForegroundColor Cyan
Write-Host "If you still see 'This site can't be reached', wait a few more seconds and refresh." -ForegroundColor Yellow
Write-Host "To stop the servers, close the terminal windows or press Ctrl+C in each." -ForegroundColor Yellow
