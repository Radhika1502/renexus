# Simple Renexus Application Launcher
param(
    [Parameter(Position=0)]
    [ValidateSet("start", "stop", "status", "help")]
    [string]$Command = "start"
)

# Configuration
$Services = @{
    Frontend = @{
        Name = "Frontend"
        Path = "frontend\web"
        Port = 3000
        Command = "npm run dev"
    }
    Backend = @{
        Name = "Backend API"
        Path = "backend\api-gateway"
        Port = 3001
        Command = "npm run dev"
    }
    AuthService = @{
        Name = "Auth Service"
        Path = "backend\auth-service"
        Port = 4001
        Command = "npm run dev"
    }
    TaskService = @{
        Name = "Task Service"
        Path = "backend\task-service"
        Port = 4002
        Command = "npm run dev"
    }
    NotificationService = @{
        Name = "Notification Service"
        Path = "backend\notification-service"
        Port = 4003
        Command = "npm run dev"
    }
}

function Write-Info($Message) {
    Write-Host "[INFO] $Message" -ForegroundColor Cyan
}

function Write-Success($Message) {
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Error($Message) {
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

function Test-Port($Port) {
    try {
        $connection = New-Object System.Net.Sockets.TcpClient
        $connection.Connect("localhost", $Port)
        $connection.Close()
        return $true
    } catch {
        return $false
    }
}

function Stop-ProcessOnPort($Port) {
    try {
        $processes = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue | 
                    ForEach-Object { Get-Process -Id $_.OwningProcess -ErrorAction SilentlyContinue }
        
        if ($processes) {
            foreach ($process in $processes) {
                Write-Info "Stopping process $($process.Name) on port $Port"
                Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
            }
        }
    } catch {
        Write-Info "Checking port $Port with netstat..."
        $netstat = netstat -ano | Select-String ":$Port "
        if ($netstat) {
            $processIds = $netstat | ForEach-Object { ($_ -split '\s+')[-1] } | Where-Object { $_ -match '^\d+$' }
            foreach ($processId in $processIds) {
                if ($processId -ne "0") {
                    Write-Info "Stopping process PID $processId on port $Port"
                    Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
                }
            }
        }
    }
}

function Start-Service($ServiceName, $ServicePath, $StartCommand, $Port) {
    Write-Info "Starting $ServiceName..."
    
    if (Test-Port $Port) {
        Write-Info "$ServiceName already running on port $Port"
        return $true
    }
    
    $fullPath = Join-Path $PSScriptRoot $ServicePath
    if (-not (Test-Path $fullPath)) {
        Write-Error "Service directory not found: $fullPath"
        return $false
    }
    
    # Install dependencies if needed
    if ((Test-Path (Join-Path $fullPath "package.json")) -and (-not (Test-Path (Join-Path $fullPath "node_modules")))) {
        Write-Info "Installing dependencies for $ServiceName..."
        Push-Location $fullPath
        & npm install
        Pop-Location
    }
    
    # Start the service
    Push-Location $fullPath
    Start-Process -FilePath "cmd" -ArgumentList "/c", "title Renexus-$ServiceName && $StartCommand" -WindowStyle Normal
    Pop-Location
    
    # Wait for service to start
    $maxWait = 30
    $waited = 0
    while ($waited -lt $maxWait) {
        Start-Sleep -Seconds 1
        $waited++
        if (Test-Port $Port) {
            Write-Success "$ServiceName started on port $Port"
            return $true
        }
    }
    
    Write-Error "$ServiceName failed to start"
    return $false
}

function Start-Application {
    Write-Host ""
    Write-Host "===============================================" -ForegroundColor Cyan
    Write-Host "  Starting Renexus Application" -ForegroundColor Cyan
    Write-Host "===============================================" -ForegroundColor Cyan
    Write-Host ""
    
    # Stop existing processes
    Write-Info "Cleaning up existing processes..."
    foreach ($service in $Services.Values) {
        Stop-ProcessOnPort $service.Port
    }
    
    # Start services
    $startedServices = @()
    foreach ($serviceKey in $Services.Keys) {
        $service = $Services[$serviceKey]
        if (Start-Service $service.Name $service.Path $service.Command $service.Port) {
            $startedServices += $service.Name
        }
        Start-Sleep -Seconds 2
    }
    
    Write-Host ""
    Write-Host "===============================================" -ForegroundColor Green
    Write-Host "  Application Started!" -ForegroundColor Green
    Write-Host "===============================================" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "URLs:" -ForegroundColor Cyan
    Write-Host "  Frontend:     http://localhost:3000" -ForegroundColor White
    Write-Host "  Backend API:  http://localhost:3001" -ForegroundColor White
    Write-Host "  Auth Service: http://localhost:4001" -ForegroundColor White
    Write-Host "  Task Service: http://localhost:4002" -ForegroundColor White
    Write-Host "  Notification: http://localhost:4003" -ForegroundColor White
    Write-Host ""
    
    # Open browser
    try {
        Start-Process "http://localhost:3000"
    } catch {
        Write-Info "Could not open browser automatically"
    }
}

function Stop-Application {
    Write-Host ""
    Write-Host "Stopping Renexus Application..." -ForegroundColor Yellow
    Write-Host ""
    
    foreach ($service in $Services.Values) {
        Stop-ProcessOnPort $service.Port
    }
    
    # Stop all Node.js processes
    Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    
    Write-Success "All services stopped"
}

function Show-Status {
    Write-Host ""
    Write-Host "Renexus Application Status:" -ForegroundColor Cyan
    Write-Host ""
    
    foreach ($service in $Services.Values) {
        if (Test-Port $service.Port) {
            Write-Success "$($service.Name): RUNNING (Port $($service.Port))"
        } else {
            Write-Error "$($service.Name): NOT RUNNING (Port $($service.Port))"
        }
    }
    Write-Host ""
}

function Show-Help {
    Write-Host ""
    Write-Host "Renexus Application Manager" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Usage: .\run-app-simple.ps1 [command]" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Commands:" -ForegroundColor Yellow
    Write-Host "  start   - Start all services (default)" -ForegroundColor White
    Write-Host "  stop    - Stop all services" -ForegroundColor White
    Write-Host "  status  - Show service status" -ForegroundColor White
    Write-Host "  help    - Show this help" -ForegroundColor White
    Write-Host ""
}

# Main execution
switch ($Command.ToLower()) {
    "start" { Start-Application }
    "stop" { Stop-Application }
    "status" { Show-Status }
    "help" { Show-Help }
    default { Show-Help }
} 