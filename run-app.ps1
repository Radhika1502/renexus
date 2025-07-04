# Renexus Application Launcher
# This script manages the entire Renexus application stack

param(
    [Parameter(Position=0)]
    [ValidateSet("start", "stop", "restart", "status", "logs", "clean", "help")]
    [string]$Command = "help",
    
    [Parameter()]
    [switch]$Logs,
    
    [Parameter()]
    [switch]$Force
)

# Configuration
$Config = @{
    Services = @{
        Frontend = @{
            Name = "Frontend"
            Path = "frontend/web"
            Port = 3000
            Command = "npm run dev"
            HealthCheck = "http://localhost:3000"
        }
        APIGateway = @{
            Name = "API Gateway"
            Path = "backend/api-gateway"
            Port = 3001
            Command = "npm run dev"
            HealthCheck = "http://localhost:3001/health"
        }
        AuthService = @{
            Name = "Auth Service"
            Path = "backend/auth-service"
            Port = 4001
            Command = "npm run dev"
            HealthCheck = "http://localhost:4001/health"
        }
        NotificationService = @{
            Name = "Notification Service"
            Path = "backend/notification-service"
            Port = 4002
            Command = "npm run dev"
            HealthCheck = "http://localhost:4002/health"
        }
    }
    Database = @{
        PostgreSQL = @{
            Port = 5432
            Container = "renexus-postgres"
        }
        Redis = @{
            Port = 6379
            Container = "renexus-redis"
        }
    }
    LogsDir = "logs"
}

# Colors for output
$Colors = @{
    Info = "Cyan"
    Success = "Green"
    Warning = "Yellow"
    Error = "Red"
    Step = "Magenta"
}

function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White",
        [string]$Prefix = ""
    )
    $timestamp = Get-Date -Format "HH:mm:ss"
    $formattedMessage = "[$timestamp] $Prefix$Message"
    Write-Host $formattedMessage -ForegroundColor $Color
}

function Write-Info { param([string]$Message) Write-ColorOutput $Message $Colors.Info "[INFO] " }
function Write-Success { param([string]$Message) Write-ColorOutput $Message $Colors.Success "[SUCCESS] " }
function Write-Warning { param([string]$Message) Write-ColorOutput $Message $Colors.Warning "[WARNING] " }
function Write-Error { param([string]$Message) Write-ColorOutput $Message $Colors.Error "[ERROR] " }
function Write-Step { param([string]$Message) Write-ColorOutput $Message $Colors.Step "[STEP] " }

function Test-Port {
    param([int]$Port)
    try {
        $connection = New-Object System.Net.Sockets.TcpClient
        $connection.Connect("localhost", $Port)
        $connection.Close()
        return $true
    }
    catch {
        return $false
    }
}

function Stop-ProcessOnPort {
    param([int]$Port)
    try {
        $processes = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue | 
                    Where-Object { $_.State -eq "Listen" } | 
                    ForEach-Object { Get-Process -Id $_.OwningProcess -ErrorAction SilentlyContinue }
        
        foreach ($process in $processes) {
            Write-Warning "Stopping process $($process.ProcessName) (PID: $($process.Id)) on port $Port"
            Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
        }
    }
    catch {
        Write-Warning "Could not stop processes on port $Port"
    }
}

function Test-Docker {
    try {
        $null = docker --version
        return $true
    }
    catch {
        return $false
    }
}

function Start-DockerServices {
    Write-Step "Starting Docker services (PostgreSQL & Redis)..."
    
    if (-not (Test-Docker)) {
        Write-Error "Docker is not installed or not in PATH"
        return $false
    }
    
    try {
        # Start PostgreSQL and Redis using docker-compose
        $dockerComposePath = Join-Path $PSScriptRoot "docker-compose.yml"
        if (Test-Path $dockerComposePath) {
            docker-compose -f $dockerComposePath up -d
            Start-Sleep -Seconds 5
            
            # Wait for services to be ready
            $maxAttempts = 30
            $attempt = 0
            while ($attempt -lt $maxAttempts) {
                if ((Test-Port 5432) -and (Test-Port 6379)) {
                    Write-Success "Docker services started successfully"
                    return $true
                }
                Start-Sleep -Seconds 2
                $attempt++
            }
            Write-Warning "Docker services may not be fully ready"
            return $true
        } else {
            Write-Error "docker-compose.yml not found"
            return $false
        }
    }
    catch {
        Write-Error "Failed to start Docker services: $($_.Exception.Message)"
        return $false
    }
}

function Stop-DockerServices {
    Write-Step "Stopping Docker containers..."
    try {
        docker-compose -f (Join-Path $PSScriptRoot "docker-compose.yml") down
        Write-Success "Docker services stopped"
    }
    catch {
        Write-Warning "Docker Compose not available or no containers running"
    }
}

function Install-Dependencies {
    param([string]$ServicePath, [string]$ServiceName)
    
    if (-not (Test-Path $ServicePath)) {
        Write-Warning "$ServiceName path not found: $ServicePath"
        return $false
    }
    
    $packageJsonPath = Join-Path $ServicePath "package.json"
    if (-not (Test-Path $packageJsonPath)) {
        Write-Warning "package.json not found in $ServicePath"
        return $false
    }
    
    $nodeModulesPath = Join-Path $ServicePath "node_modules"
    if (-not (Test-Path $nodeModulesPath)) {
        Write-Step "Installing dependencies for $ServiceName..."
        try {
            Push-Location $ServicePath
            npm install
            Pop-Location
            Write-Success "Dependencies installed for $ServiceName"
        }
        catch {
            Write-Error "Failed to install dependencies for $ServiceName - $($_.Exception.Message)"
            Pop-Location
            return $false
        }
    }
    return $true
}

function Start-Service {
    param([string]$ServicePath, [string]$ServiceName, [string]$Command, [int]$Port, [string]$HealthCheck)
    
    if (-not (Install-Dependencies $ServicePath $ServiceName)) {
        return $false
    }
    
    # Check if service is already running
    if (Test-Port $Port) {
        Write-Warning "$ServiceName is already running on port $Port"
        return $true
    }
    
    Write-Step "Starting $ServiceName on port $Port..."
    
    # Create logs directory
    $logsDir = Join-Path $PSScriptRoot $Config.LogsDir
    if (-not (Test-Path $logsDir)) {
        New-Item -ItemType Directory -Path $logsDir -Force | Out-Null
    }
    
    $logFile = Join-Path $logsDir "$($ServiceName.ToLower().Replace(' ', '-')).log"
    
    try {
        Push-Location $ServicePath
        
        # Start the service in background
        $process = Start-Process -FilePath "npm" -ArgumentList "run", "dev" -PassThru -WindowStyle Hidden -RedirectStandardOutput $logFile -RedirectStandardError $logFile
        
        # Wait for service to start
        $maxAttempts = 30
        $attempt = 0
        while ($attempt -lt $maxAttempts) {
            if (Test-Port $Port) {
                Write-Success "$ServiceName started successfully on port $Port"
                Pop-Location
                return $true
            }
            Start-Sleep -Seconds 2
            $attempt++
        }
        
        Write-Error "$ServiceName failed to start on port $Port"
        Pop-Location
        return $false
    }
    catch {
        Write-Error "Failed to start $ServiceName - $($_.Exception.Message)"
        Pop-Location
        return $false
    }
}

function Stop-Service {
    param([int]$Port, [string]$ServiceName)
    
    try {
        $processes = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue | 
                    Where-Object { $_.State -eq "Listen" } | 
                    ForEach-Object { Get-Process -Id $_.OwningProcess -ErrorAction SilentlyContinue }
        
        foreach ($process in $processes) {
            Write-Step "Stopping $ServiceName (PID: $($process.Id))"
            Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
        }
        
        if ($processes) {
            Write-Success "$ServiceName stopped"
        }
    }
    catch {
        Write-Warning "Could not stop $ServiceName"
    }
}

function Test-ServiceHealth {
    param([string]$ServiceName, [string]$HealthCheck, [int]$Port)
    
    if (Test-Port $Port) {
        try {
            $response = Invoke-WebRequest -Uri $HealthCheck -TimeoutSec 5 -ErrorAction SilentlyContinue
            if ($response.StatusCode -eq 200) {
                Write-Success "$ServiceName is healthy"
                return $true
            }
        }
        catch {
            Write-Warning "$ServiceName appears to be down"
            return $false
        }
    } else {
        Write-Warning "$ServiceName appears to be down"
        return $false
    }
}

function Start-AllServices {
    Write-Info "Starting Renexus Application Platform..."
    
    # Stop existing processes
    Write-Step "Stopping all processes on configured ports..."
    foreach ($service in $Config.Services.Values) {
        Stop-ProcessOnPort $service.Port
    }
    foreach ($db in $Config.Database.Values) {
        Stop-ProcessOnPort $db.Port
    }
    
    # Stop Docker containers
    Stop-DockerServices
    
    # Start Docker services
    if (-not (Start-DockerServices)) {
        Write-Error "Failed to start Docker services"
        return $false
    }
    
    # Start backend services first
    $servicesStarted = @()
    
    foreach ($service in $Config.Services.Values) {
        $servicePath = Join-Path $PSScriptRoot $service.Path
        if (Start-Service $servicePath $service.Name $service.Command $service.Port $service.HealthCheck) {
            $servicesStarted += $service.Name
        }
    }
    
    Write-Info "Press Ctrl+C to stop all services"
    
    # Health check loop
    while ($true) {
        Start-Sleep -Seconds 10
        
        foreach ($service in $Config.Services.Values) {
            Test-ServiceHealth $service.Name $service.HealthCheck $service.Port
        }
    }
}

function Stop-AllServices {
    Write-Info "Stopping Renexus Application Platform..."
    
    foreach ($service in $Config.Services.Values) {
        Stop-Service $service.Port $service.Name
    }
    
    Stop-DockerServices
    Write-Success "All services stopped"
}

function Show-Status {
    Write-Info "Renexus Application Status:"
    Write-Host ""
    
    foreach ($service in $Config.Services.Values) {
        $status = if (Test-Port $service.Port) { "Running" } else { "Stopped" }
        $color = if ($status -eq "Running") { $Colors.Success } else { $Colors.Error }
        Write-Host "  $($service.Name): " -NoNewline
        Write-Host $status -ForegroundColor $color
    }
    
    Write-Host ""
    Write-Host "  Database Services:" -ForegroundColor $Colors.Info
    foreach ($db in $Config.Database.Values) {
        $status = if (Test-Port $db.Port) { "Running" } else { "Stopped" }
        $color = if ($status -eq "Running") { $Colors.Success } else { $Colors.Error }
        Write-Host "    $($db.Container): " -NoNewline
        Write-Host $status -ForegroundColor $color
    }
}

function Show-Logs {
    $logsDir = Join-Path $PSScriptRoot $Config.LogsDir
    
    if (-not (Test-Path $logsDir)) {
        Write-Error "Logs directory not found"
        return
    }
    
    Write-Info "Showing live logs from all services..."
    Write-Host "Press Ctrl+C to stop viewing logs"
    Write-Host ""
    
    $logFiles = Get-ChildItem -Path $logsDir -Filter "*.log" -ErrorAction SilentlyContinue
    
    if ($logFiles.Count -eq 0) {
        Write-Warning "No log files found"
        return
    }
    
    foreach ($logFile in $logFiles) {
        $serviceName = $logFile.BaseName -replace '-', ' '
        Write-Host "=== $serviceName ===" -ForegroundColor $Colors.Info
        Get-Content -Path $logFile.FullName -Wait -Tail 10
    }
}

function Clean-Environment {
    Write-Info "Cleaning Renexus environment..."
    
    # Stop all services
    Stop-AllServices
    
    # Clean node_modules (optional)
    if ($Force) {
        Write-Step "Removing node_modules directories..."
        foreach ($service in $Config.Services.Values) {
            $nodeModulesPath = Join-Path $PSScriptRoot (Join-Path $service.Path "node_modules")
            if (Test-Path $nodeModulesPath) {
                Remove-Item -Path $nodeModulesPath -Recurse -Force -ErrorAction SilentlyContinue
                Write-Success "Cleaned $($service.Name) dependencies"
            }
        }
    }
    
    # Clean logs
    $logsDir = Join-Path $PSScriptRoot $Config.LogsDir
    if (Test-Path $logsDir) {
        Remove-Item -Path $logsDir -Recurse -Force -ErrorAction SilentlyContinue
        Write-Success "Cleaned log files"
    }
    
    Write-Success "Environment cleaned"
}

function Show-Help {
    Write-Host @"
Renexus Application Launcher
============================

Usage: .\run-app.ps1 [Command] [Options]

Commands:
  start     Start all services (frontend, backend, database)
  stop      Stop all services
  restart   Restart all services
  status    Show status of all services
  logs      Show live logs from all services
  clean     Clean environment (use -Force to remove node_modules)
  help      Show this help message

Options:
  -Logs     Start with logs visible (only with start command)
  -Force    Force clean (removes node_modules)

Examples:
  .\run-app.ps1 start
  .\run-app.ps1 start -Logs
  .\run-app.ps1 status
  .\run-app.ps1 logs
  .\run-app.ps1 clean -Force

Services Managed:
  - Frontend (Next.js) - Port 3000
  - API Gateway (NestJS) - Port 3001
  - Auth Service (Express) - Port 4001
  - Notification Service (Express) - Port 4002
  - PostgreSQL Database - Port 5432
  - Redis Cache - Port 6379

Requirements:
  - Node.js and npm
  - Docker and Docker Compose
  - PowerShell 5.0 or higher
"@ -ForegroundColor $Colors.Info
}

# Main execution
try {
    switch ($Command.ToLower()) {
        "start" {
            if ($Logs) {
                Start-AllServices
                Show-Logs
            } else {
                Start-AllServices
            }
        }
        "stop" { Stop-AllServices }
        "restart" { 
            Stop-AllServices
            Start-Sleep -Seconds 2
            Start-AllServices
        }
        "status" { Show-Status }
        "logs" { Show-Logs }
        "clean" { Clean-Environment }
        "help" { Show-Help }
        default { Show-Help }
    }
}
catch {
    Write-Error "An error occurred: $($_.Exception.Message)"
    exit 1
}
