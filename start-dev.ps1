# Start-Dev.ps1 - Simple development script for Renexus

# Set error action preference
$ErrorActionPreference = "Stop"

# Clear the console
Clear-Host

# Display header
Write-Host "=== Renexus Development Environment ===" -ForegroundColor Cyan
Write-Host "Starting development servers..." -ForegroundColor Cyan
Write-Host ""

# Function to start a service
function Start-DevServer {
    param (
        [string]$Name,
        [string]$Command,
        [string]$WorkingDir,
        [int]$Port
    )
    
    Write-Host "Starting $Name..." -ForegroundColor Yellow
    Write-Host "  Directory: $WorkingDir" -ForegroundColor DarkGray
    Write-Host "  Command: $Command" -ForegroundColor DarkGray
    
    try {
        # Check if port is in use
        $portInUse = Test-NetConnection -ComputerName localhost -Port $Port -WarningAction SilentlyContinue -ErrorAction SilentlyContinue
        if ($portInUse.TcpTestSucceeded) {
            Write-Host "  Port $Port is already in use. Attempting to free it..." -ForegroundColor Yellow
            $process = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue | 
                      Select-Object -ExpandProperty OwningProcess -First 1
            if ($process) {
                Stop-Process -Id $process -Force -ErrorAction SilentlyContinue
                Start-Sleep -Seconds 1
            }
        }
        
        # Start the process
        $process = Start-Process -FilePath "powershell" -ArgumentList "-NoExit", "-Command", "cd '$WorkingDir'; $Command" -PassThru -WindowStyle Normal
        
        # Wait a bit for the server to start
        Start-Sleep -Seconds 3
        
        # Verify the service is running
        $portCheck = Test-NetConnection -ComputerName localhost -Port $Port -WarningAction SilentlyContinue -ErrorAction SilentlyContinue
        
        if ($portCheck.TcpTestSucceeded) {
            Write-Host "  $Name is running on port $Port" -ForegroundColor Green
            return $process
        } else {
            Write-Host "  Failed to verify $Name on port $Port" -ForegroundColor Red
            return $null
        }
    } catch {
        Write-Host "  Error starting $Name : $_" -ForegroundColor Red
        return $null
    }
}

# Set working directories
$rootDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendDir = Join-Path $rootDir "backend\api"
$frontendDir = Join-Path $rootDir "frontend\web"

# Start Backend API
$backendProcess = Start-DevServer -Name "Backend API" -Command "npm run dev" -WorkingDir $backendDir -Port 3001

# Start Frontend
$frontendProcess = Start-DevServer -Name "Frontend" -Command "npm run dev" -WorkingDir $frontendDir -Port 3000

# Show status
Write-Host ""
Write-Host "=== Development Environment Status ===" -ForegroundColor Cyan
Write-Host ""

if ($backendProcess) {
    Write-Host "✅ Backend API" -ForegroundColor Green -NoNewline
    Write-Host " is running at http://localhost:3001"
    Write-Host "   - Health check: " -NoNewline
    Write-Host "http://localhost:3001/api/health" -ForegroundColor Blue
} else {
    Write-Host "❌ Backend API failed to start" -ForegroundColor Red
}

if ($frontendProcess) {
    Write-Host "✅ Frontend" -ForegroundColor Green -NoNewline
    Write-Host " is running at http://localhost:3000"
    Write-Host "   - Opening in default browser..."
    Start-Process "http://localhost:3000"
} else {
    Write-Host "❌ Frontend failed to start" -ForegroundColor Red
}

# Show help
Write-Host ""
Write-Host "=== Development Commands ===" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop all servers"
Write-Host ""
Write-Host "Backend API:"
Write-Host "  http://localhost:3001"
Write-Host "  cd $backendDir"
Write-Host "  npm run dev"
Write-Host ""
Write-Host "Frontend:"
Write-Host "  http://localhost:3000"
Write-Host "  cd $frontendDir"
Write-Host "  npm run dev"

# Keep the script running
Write-Host ""
Write-Host "Press any key to stop all servers and exit..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')

# Cleanup
Write-Host ""
Write-Host "Stopping all servers..." -ForegroundColor Yellow
if ($backendProcess) { Stop-Process -Id $backendProcess.Id -Force -ErrorAction SilentlyContinue }
if ($frontendProcess) { Stop-Process -Id $frontendProcess.Id -Force -ErrorAction SilentlyContinue }

Write-Host ""
Write-Host "Development environment stopped." -ForegroundColor Green
