# Script to start the reorganized Renexus application
Write-Host "Starting Reorganized Renexus Application..." -ForegroundColor Cyan
Write-Host "------------------------------------------" -ForegroundColor Cyan

# First, ensure we're in the project root
Set-Location -Path $PSScriptRoot

# Define paths
$rootPath = $PSScriptRoot
$backendApiPath = Join-Path $rootPath "backend\api"
$frontendWebPath = Join-Path $rootPath "frontend\web"

# Function to check if a directory exists
function Test-DirectoryExists {
    param (
        [string]$Path,
        [string]$Description
    )
    
    if (Test-Path -Path $Path -PathType Container) {
        Write-Host "✅ $Description directory found at: $Path" -ForegroundColor Green
        return $true
    } else {
        Write-Host "❌ $Description directory not found at: $Path" -ForegroundColor Red
        return $false
    }
}

# Check if directories exist
$backendExists = Test-DirectoryExists -Path $backendApiPath -Description "Backend API"
$frontendExists = Test-DirectoryExists -Path $frontendWebPath -Description "Frontend Web"

if (-not ($backendExists -and $frontendExists)) {
    Write-Host "❌ Cannot start application: Required directories not found" -ForegroundColor Red
    exit 1
}

# Check for package.json files
if (-not (Test-Path -Path "$backendApiPath\package.json")) {
    Write-Host "❌ Backend package.json not found" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path -Path "$frontendWebPath\package.json")) {
    Write-Host "❌ Frontend package.json not found" -ForegroundColor Red
    exit 1
}

# Start backend
Write-Host "Starting backend server..." -ForegroundColor Yellow
$backendProcess = Start-Process -FilePath "powershell" -ArgumentList "-Command", "Set-Location -Path '$backendApiPath'; npm run dev" -WindowStyle Normal -PassThru

# Wait for backend to initialize
Write-Host "Waiting for backend to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Start frontend
Write-Host "Starting frontend server..." -ForegroundColor Yellow
$frontendProcess = Start-Process -FilePath "powershell" -ArgumentList "-Command", "Set-Location -Path '$frontendWebPath'; npx.cmd next dev" -WindowStyle Normal -PassThru

Write-Host "Application started!" -ForegroundColor Green
Write-Host "- Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "- Backend: http://localhost:3001" -ForegroundColor Cyan
Write-Host "Wait a few moments, then access the application in your browser." -ForegroundColor Yellow

# Keep the script running until user presses Ctrl+C
Write-Host ""
Write-Host "Press Ctrl+C to stop the servers and exit" -ForegroundColor Yellow

try {
    while ($true) {
        # Check if processes are still running
        if ($backendProcess.HasExited) {
            Write-Host "⚠️ Backend process has exited with code: $($backendProcess.ExitCode)" -ForegroundColor Red
            break
        }
        
        if ($frontendProcess.HasExited) {
            Write-Host "⚠️ Frontend process has exited with code: $($frontendProcess.ExitCode)" -ForegroundColor Red
            break
        }
        
        Start-Sleep -Seconds 2
    }
}
finally {
    # Clean up processes when the script exits
    if (-not $backendProcess.HasExited) {
        Write-Host "Stopping backend process..." -ForegroundColor Yellow
        Stop-Process -Id $backendProcess.Id -Force -ErrorAction SilentlyContinue
    }
    
    if (-not $frontendProcess.HasExited) {
        Write-Host "Stopping frontend process..." -ForegroundColor Yellow
        Stop-Process -Id $frontendProcess.Id -Force -ErrorAction SilentlyContinue
    }
    
    Write-Host "Application stopped" -ForegroundColor Cyan
}
