# Run-App.ps1 - Script to start the Renexus application

# Stop any running processes on required ports
function Stop-Port {
    param (
        [int]$Port
    )
    
    $processIds = (Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue).OwningProcess | Select-Object -Unique
    
    if ($processIds) {
        Write-Host "Stopping processes on port $Port..." -ForegroundColor Yellow
        foreach ($processId in $processIds) {
            $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
            if ($process) {
                Write-Host "  - Stopping process $($process.ProcessName) (PID: $processId)" -ForegroundColor Yellow
                Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
            }
        }
    } else {
        Write-Host "No processes found running on port $Port" -ForegroundColor Green
    }
}

# Function to start a service and capture its output
function Start-ServiceWithLogging {
    param (
        [string]$Name,
        [string]$Command,
        [string]$WorkingDir,
        [string]$LogFile
    )
    
    Write-Host "`nStarting $Name..." -ForegroundColor Cyan
    Write-Host "  Command: $Command" -ForegroundColor DarkGray
    Write-Host "  Working Directory: $WorkingDir" -ForegroundColor DarkGray
    Write-Host "  Log File: $LogFile" -ForegroundColor DarkGray
    
    $process = Start-Process -FilePath "powershell" -ArgumentList "-NoExit", "-Command", "cd '$WorkingDir'; $Command 2>&1 | Tee-Object -FilePath '$LogFile'" -PassThru -WindowStyle Normal
    
    # Wait a moment for the process to start
    Start-Sleep -Seconds 2
    
    if (!$process.HasExited) {
        Write-Host "$Name started successfully (PID: $($process.Id))" -ForegroundColor Green
        return $process
    } else {
        Write-Host "Failed to start $Name" -ForegroundColor Red
        Get-Content -Path $LogFile -ErrorAction SilentlyContinue | ForEach-Object {
            Write-Host "  $_" -ForegroundColor Red
        }
        return $null
    }
}

# Main script execution
Clear-Host
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "  Renexus Application Startup Script" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

# Set paths
$rootDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendDir = Join-Path $rootDir "backend\api"
$frontendDir = Join-Path $rootDir "frontend\web"
$logsDir = Join-Path $rootDir "logs"

# Create logs directory if it doesn't exist
if (-not (Test-Path $logsDir)) {
    New-Item -ItemType Directory -Path $logsDir | Out-Null
}

# Define services to manage
$services = @(
    @{
        Name = "Backend API"
        Port = 3001
        Command = "npm run dev"
        WorkingDir = $backendDir
        LogFile = Join-Path $logsDir "backend.log"
    },
    @{
        Name = "Frontend"
        Port = 3000
        Command = "npm run dev"
        WorkingDir = $frontendDir
        LogFile = Join-Path $logsDir "frontend.log"
    }
)

# Stop any running services on required ports
Write-Host "`nStopping any running services..." -ForegroundColor Yellow
foreach ($service in $services) {
    Stop-Port -Port $service.Port
}

# Start services
$processes = @()
foreach ($service in $services) {
    $process = Start-ServiceWithLogging -Name $service.Name -Command $service.Command -WorkingDir $service.WorkingDir -LogFile $service.LogFile
    if ($process) {
        $process | Add-Member -MemberType NoteProperty -Name 'ServiceName' -Value $service.Name
        $processes += $process
    }
}

# Show service status
Write-Host "`nService Status:" -ForegroundColor Cyan
Write-Host ("-" * 50) -ForegroundColor Cyan

foreach ($service in $services) {
    $process = $processes | Where-Object { $_.ServiceName -eq $service.Name }
    $status = if ($process -and !$process.HasExited) { "Running" } else { "Stopped" }
    $color = if ($status -eq "Running") { "Green" } else { "Red" }
    
    Write-Host ("{0,-15} {1,-10} {2,-10} {3}" -f $service.Name, "Port $($service.Port)", "[$status]", $service.LogFile) -ForegroundColor $color
}

# Show log files
Write-Host "`nLog Files:" -ForegroundColor Cyan
Write-Host ("-" * 50) -ForegroundColor Cyan
foreach ($service in $services) {
    Write-Host "$(Split-Path $service.LogFile -Leaf): " -NoNewline
    Write-Host $service.LogFile -ForegroundColor Yellow
}

# Open browser to frontend
$frontendUrl = "http://localhost:3000"
Write-Host "`nOpening $frontendUrl in default browser..." -ForegroundColor Cyan
Start-Process $frontendUrl

# Function to clean up on script exit
function Cleanup {
    Write-Host "`nCleaning up..." -ForegroundColor Yellow
    foreach ($process in $processes) {
        if ($process -and !$process.HasExited) {
            Write-Host "Stopping $($process.ServiceName) (PID: $($process.Id))..." -ForegroundColor Yellow
            Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
        }
    }
    Write-Host "Cleanup complete." -ForegroundColor Green
}

# Set up cleanup on script exit
trap { Cleanup; exit }

# Keep the script running and show logs if requested
Write-Host "`nPress 'L' to view logs, 'Q' to quit, or any other key to refresh status..." -ForegroundColor Cyan

while ($true) {
    if ($Host.UI.RawUI.KeyAvailable) {
        $key = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
        
        if ($key.Character -eq 'q') {
            Cleanup
            exit
        }
        elseif ($key.Character -eq 'l') {
            $logFile = Read-Host "`nEnter log file to view (backend/frontend/all)"
            if ($logFile -eq "backend" -or $logFile -eq "all") {
                Write-Host "`nBackend Logs:" -ForegroundColor Cyan
                Write-Host ("-" * 50) -ForegroundColor Cyan
                Get-Content -Path $services[0].LogFile -Tail 20 -ErrorAction SilentlyContinue
            }
            if ($logFile -eq "frontend" -or $logFile -eq "all") {
                Write-Host "`nFrontend Logs:" -ForegroundColor Cyan
                Write-Host ("-" * 50) -ForegroundColor Cyan
                Get-Content -Path $services[1].LogFile -Tail 20 -ErrorAction SilentlyContinue
            }
            Write-Host "`nPress any key to continue..."
            $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
        }
    }
    
    # Refresh status
    Clear-Host
    Write-Host "=============================================" -ForegroundColor Cyan
    Write-Host "  Renexus Application Status" -ForegroundColor Cyan
    Write-Host "=============================================" -ForegroundColor Cyan
    
    Write-Host "`nService Status:" -ForegroundColor Cyan
    Write-Host ("-" * 50) -ForegroundColor Cyan
    
    foreach ($service in $services) {
        $process = $processes | Where-Object { $_.ServiceName -eq $service.Name }
        $status = if ($process -and !$process.HasExited) { 
            $statusText = "Running (PID: $($process.Id))"
            $color = "Green"
            $statusText
        } else { 
            $statusText = "Stopped"
            $color = "Red"
            $statusText
        }
        
        Write-Host ("{0,-15} {1,-10} {2,-25} {3}" -f $service.Name, "Port $($service.Port)", "[$status]", $service.LogFile) -ForegroundColor $color
    }
    
    Write-Host "`nPress 'L' to view logs, 'Q' to quit, or any other key to refresh status..." -ForegroundColor Cyan
    Start-Sleep -Seconds 2
}
