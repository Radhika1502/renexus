# Renexus Application Startup Script
# PowerShell version for Windows

Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "   🚀 RENEXUS APPLICATION STARTUP SCRIPT 🚀" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "🔍 Checking current directory..." -ForegroundColor Yellow
Write-Host "Current directory: $(Get-Location)" -ForegroundColor Gray

Write-Host ""
Write-Host "📋 Starting Renexus Application Services..." -ForegroundColor Green
Write-Host ""

# Set environment variables
$env:FORCE_COLOR = "1"
$env:NODE_ENV = "development"

Write-Host "🔧 Environment configured" -ForegroundColor Gray

Write-Host ""
Write-Host "🌐 Starting Backend API Server (Port 3001)..." -ForegroundColor Blue
Write-Host ""

# Start Backend API Server
$backendPath = Join-Path (Get-Location) "backend\api-gateway"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; Write-Host '🚀 Starting Backend API Server...' -ForegroundColor Green; node simple-server.js"

Write-Host "⏳ Waiting for backend to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

Write-Host ""
Write-Host "🎨 Starting Frontend Development Server (Port 3000)..." -ForegroundColor Magenta
Write-Host ""

# Start Frontend Development Server
$frontendPath = Join-Path (Get-Location) "frontend\web"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$frontendPath'; Write-Host '🚀 Starting Frontend Server...' -ForegroundColor Green; npm run dev"

Write-Host "⏳ Waiting for frontend to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

Write-Host ""
Write-Host "✅ APPLICATION STARTUP COMPLETE!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Service Status:" -ForegroundColor Cyan
Write-Host "  • Backend API: http://localhost:3001" -ForegroundColor Gray
Write-Host "  • Frontend App: http://localhost:3000" -ForegroundColor Gray
Write-Host "  • Health Check: http://localhost:3001/health" -ForegroundColor Gray
Write-Host ""
Write-Host "🌟 Your Renexus application is now running!" -ForegroundColor Green
Write-Host "🌐 Open your browser and go to: http://localhost:3000" -ForegroundColor Yellow
Write-Host ""
Write-Host "📝 Note: Two PowerShell windows will open:" -ForegroundColor Cyan
Write-Host "  1. Backend API Server (Port 3001)" -ForegroundColor Gray
Write-Host "  2. Frontend Development Server (Port 3000)" -ForegroundColor Gray
Write-Host ""
Write-Host "🛑 To stop the application, close both PowerShell windows" -ForegroundColor Red
Write-Host "   or press Ctrl+C in each window." -ForegroundColor Red
Write-Host ""
Write-Host "🎯 Enjoy your Renexus project management application!" -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Cyan

# Test API connectivity
Write-Host ""
Write-Host "🔍 Testing API connectivity..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3001/health" -Method Get -TimeoutSec 5
    Write-Host "✅ Backend API is responding!" -ForegroundColor Green
    Write-Host "   Status: $($response.status)" -ForegroundColor Gray
} catch {
    Write-Host "⚠️  Backend API not yet ready (this is normal during startup)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Press any key to exit this script..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown") 