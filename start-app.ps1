# Simple script to start the Renexus application
Write-Host "Starting Renexus Application..." -ForegroundColor Cyan

# First, ensure we're in the project root
Set-Location -Path $PSScriptRoot

# Start backend
Write-Host "Starting backend server..." -ForegroundColor Yellow
$backendDir = Join-Path $PSScriptRoot "backend\api"
Start-Process -FilePath "powershell" -ArgumentList "-Command", "Set-Location -Path '$backendDir'; npm run dev" -WindowStyle Normal

# Wait for backend to initialize
Write-Host "Waiting for backend to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Start frontend - using direct path to next command to avoid path issues
Write-Host "Starting frontend server..." -ForegroundColor Yellow
$frontendDir = Join-Path $PSScriptRoot "frontend\web"
Start-Process -FilePath "powershell" -ArgumentList "-Command", "Set-Location -Path '$frontendDir'; npx.cmd next dev" -WindowStyle Normal

Write-Host "Application started!" -ForegroundColor Green
Write-Host "- Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "- Backend: http://localhost:3001" -ForegroundColor Cyan
Write-Host "Wait a few moments, then access the application in your browser." -ForegroundColor Yellow
