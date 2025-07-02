# Renexus Full Application Starter Script
# This script fixes configuration issues and starts both frontend and backend servers

$ErrorActionPreference = "SilentlyContinue"
Write-Host "Starting Renexus Application..." -ForegroundColor Cyan

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
Write-Host "Setting up backend environment..." -ForegroundColor Cyan
Set-Location -Path "backend\api"

# Create .env file if it doesn't exist
if (-not (Test-Path ".env")) {
    Write-Host "Creating backend .env file..." -ForegroundColor Yellow
    
    $backendEnvContent = "# Database Configuration`nDATABASE_URL=`"postgresql://postgres:postgres@localhost:5432/renexus?schema=public`"`n`n# Server Configuration`nPORT=3001`nNODE_ENV=development`nLOG_LEVEL=debug`n`n# Security`nJWT_SECRET=renexus-jwt-secret-dev-only`nALLOWED_ORIGINS=http://localhost:3000"
    
    Set-Content -Path ".env" -Value $backendEnvContent
    Write-Host "Backend .env file created" -ForegroundColor Green
} else {
    Write-Host "Backend .env file already exists" -ForegroundColor Green
}

# Start backend server in a new window
Write-Host "Starting backend server..." -ForegroundColor Green
Start-Process -FilePath "powershell" -ArgumentList "-NoExit", "-Command", "cd 'C:\Users\HP\Renexus\backend\api'; npm run dev"

# Setup frontend environment
Write-Host "Setting up frontend environment..." -ForegroundColor Cyan
Set-Location -Path "..\..\frontend\web"

# Create .env.local file if it doesn't exist
if (-not (Test-Path ".env.local")) {
    Write-Host "Creating frontend .env.local file..." -ForegroundColor Yellow
    
    $frontendEnvContent = "# API Configuration`nNEXT_PUBLIC_API_URL=http://localhost:3001`nNODE_ENV=development"
    
    Set-Content -Path ".env.local" -Value $frontendEnvContent
    Write-Host "Frontend .env.local file created" -ForegroundColor Green
} else {
    Write-Host "Frontend .env.local file already exists" -ForegroundColor Green
}

# Start frontend server in a new window with explicit npx command
Write-Host "Starting frontend server..." -ForegroundColor Green
Start-Process -FilePath "powershell" -ArgumentList "-NoExit", "-Command", "cd 'C:\Users\HP\Renexus\frontend\web'; npx next dev"

# Open browser after a short delay
Write-Host "Opening application in browser..." -ForegroundColor Cyan
Start-Sleep -Seconds 5
Start-Process "http://localhost:3000"

Write-Host "Renexus is now running!" -ForegroundColor Green
Write-Host "- Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "- Backend: http://localhost:3001" -ForegroundColor Cyan
Write-Host "- Debug page: http://localhost:3000/debug" -ForegroundColor Cyan
Write-Host "Press Ctrl+C in the respective terminal windows to stop the servers" -ForegroundColor Yellow
