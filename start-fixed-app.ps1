# Script to start the fixed Renexus application
Write-Host "Starting Fixed Renexus Application..." -ForegroundColor Cyan
Write-Host "------------------------------------------" -ForegroundColor Cyan

# First, ensure we're in the project root
Set-Location -Path $PSScriptRoot

# Define paths
$rootPath = $PSScriptRoot
$backendApiPath = Join-Path $rootPath "backend\api"
$frontendWebPath = Join-Path $rootPath "frontend\web"

# Start backend
Write-Host "Starting backend server..." -ForegroundColor Yellow
Start-Process -FilePath "powershell" -ArgumentList "-Command", "Set-Location -Path '$backendApiPath'; npm run dev" -WindowStyle Normal

# Wait for backend to initialize
Write-Host "Waiting for backend to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Start frontend
Write-Host "Starting frontend server..." -ForegroundColor Yellow
Start-Process -FilePath "powershell" -ArgumentList "-Command", "Set-Location -Path '$frontendWebPath'; npx.cmd next dev" -WindowStyle Normal

Write-Host "Application started!" -ForegroundColor Green
Write-Host "- Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "- Backend: http://localhost:3001" -ForegroundColor Cyan
Write-Host "Wait a few moments, then access the application in your browser." -ForegroundColor Yellow
