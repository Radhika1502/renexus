# Script to fix Next.js installation and run the Renexus application
# This will properly set up both frontend and backend

Write-Host "Fixing Renexus Application..." -ForegroundColor Cyan
Write-Host "----------------------------------" -ForegroundColor Cyan

# Stop any running Node.js processes
Write-Host "Stopping any running Node.js processes..." -ForegroundColor Yellow
Get-Process | Where-Object { $_.ProcessName -eq "node" } | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# Fix frontend
Write-Host "Fixing Frontend..." -ForegroundColor Cyan
Set-Location -Path "$PSScriptRoot\frontend\web"

# Create .env.local file
Write-Host "Creating frontend environment file..." -ForegroundColor Yellow
$frontendEnv = "NEXT_PUBLIC_API_URL=http://localhost:3001"
Set-Content -Path ".env.local" -Value $frontendEnv -Force
Write-Host "Frontend .env.local file created" -ForegroundColor Green

# Fix Next.js installation
Write-Host "Reinstalling Next.js and dependencies..." -ForegroundColor Yellow
# First make sure node_modules exists
if (-not (Test-Path "node_modules")) {
    New-Item -ItemType Directory -Path "node_modules" -Force | Out-Null
}

# Clean install of dependencies
npm uninstall next react react-dom --no-save 2>$null
npm cache clean --force
npm install next@14.2.3 react@18.3.1 react-dom@18.3.1 --save --force
npm install --force

Write-Host "Frontend dependencies fixed!" -ForegroundColor Green

# Return to root directory
Set-Location -Path "$PSScriptRoot"

# Fix Backend
Write-Host "Fixing Backend..." -ForegroundColor Cyan
Set-Location -Path "$PSScriptRoot\backend\api"

# Create .env file
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

# Return to root directory
Set-Location -Path "$PSScriptRoot"

# Start servers
Write-Host "Starting Servers..." -ForegroundColor Cyan

# Start backend in new window
Write-Host "Starting Backend Server..." -ForegroundColor Yellow
$backendProcess = Start-Process -FilePath "powershell" -ArgumentList "-NoExit", "-Command", "Set-Location '$PSScriptRoot\backend\api'; npm run dev" -PassThru

# Give backend time to start
Start-Sleep -Seconds 5

# Start frontend in new window
Write-Host "Starting Frontend Server..." -ForegroundColor Yellow
$frontendProcess = Start-Process -FilePath "powershell" -ArgumentList "-NoExit", "-Command", "Set-Location '$PSScriptRoot\frontend\web'; npx next dev" -PassThru

# Open browser
Start-Sleep -Seconds 5
Write-Host "Opening Browser..." -ForegroundColor Cyan

try {
    Start-Process "http://localhost:3000"
} catch {
    Write-Host "Could not open browser automatically. Please open http://localhost:3000 manually." -ForegroundColor Yellow
}

Write-Host "DONE! Renexus should now be running" -ForegroundColor Green
Write-Host "- Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "- Backend: http://localhost:3001" -ForegroundColor Cyan
Write-Host "If you still see 'This site can't be reached', wait a few more seconds and refresh." -ForegroundColor Yellow
Write-Host "To stop the servers, close the terminal windows or press Ctrl+C in each." -ForegroundColor Yellow
