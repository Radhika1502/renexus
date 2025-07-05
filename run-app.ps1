# ===============================================
# RENEXUS APPLICATION MANAGER - PowerShell Script
# ===============================================
# Comprehensive application launcher for the Renexus project management platform
# Manages: Frontend, Backend, Database, Ports, Logs, and Cleanup

param(
    [Parameter(Position=0)]
    [ValidateSet("start", "stop", "restart", "status", "logs", "clean", "help")]
    [string]$Command = "start",
    
    [Parameter()]
    [switch]$Logs,
    
    [Parameter()]
    [switch]$Force,
    
    [Parameter()]
    [switch]$PostgreSQL,
    
    [Parameter()]
    [switch]$SkipBrowser
)

# ===============================================
# CONFIGURATION
# ===============================================

$Config = @{
    App = @{
        Name = "Renexus"
        Version = "1.0.0"
        Description = "Project Management Platform"
    }
    Services = @{
        Frontend = @{
            Name = "Frontend (Next.js)"
            Path = "frontend\web"
            Port = 3000
            StartCommand = "npm run dev"
            HealthCheck = "http://localhost:3000"
            LogFile = "frontend.log"
            ProcessPattern = "next-server"
        }
        Backend = @{
            Name = "Backend API Gateway"
            Path = "backend\api-gateway"
            Port = 3001
            StartCommand = if ($PostgreSQL) { "node postgres-server.js" } else { "npm run dev" }
            HealthCheck = "http://localhost:3001/health"
            LogFile = "backend.log"
            ProcessPattern = "node.*postgres-server|node.*main"
        }
        AuthService = @{
            Name = "Auth Service"
            Path = "backend\auth-service"
            Port = 4001
            StartCommand = "npm run dev"
            HealthCheck = "http://localhost:4001/health"
            LogFile = "auth-service.log"
            ProcessPattern = "node.*auth-service"
        }
        TaskService = @{
            Name = "Task Service"
            Path = "backend\task-service"
            Port = 4002
            StartCommand = "npm run dev"
            HealthCheck = "http://localhost:4002/health"
            LogFile = "task-service.log"
            ProcessPattern = "node.*task-service"
        }
        NotificationService = @{
            Name = "Notification Service"
            Path = "backend\notification-service"
            Port = 4003
            StartCommand = "npm run dev"
            HealthCheck = "http://localhost:4003/health"
            LogFile = "notification-service.log"
            ProcessPattern = "node.*notification-service"
        }
    }
    Database = @{
        PostgreSQL = @{
            Port = 5432
            ServiceName = "postgresql-x64-17"
            Container = "renexus-postgres"
            LogFile = "postgresql.log"
        }
        Redis = @{
            Port = 6379
            Container = "renexus-redis"
            LogFile = "redis.log"
        }
    }
    Ports = @(3000, 3001, 4001, 4002, 4003, 5432, 6379)
    LogsDir = "logs"
    TempFiles = @(
        "*.tmp",
        "*.temp",
        "*.log.old",
        "npm-debug.log*",
        "yarn-debug.log*",
        "yarn-error.log*",
        ".DS_Store",
        "Thumbs.db",
        "desktop.ini"
    )
}

# ===============================================
# UTILITY FUNCTIONS
# ===============================================

function Write-ColorMessage {
    param(
        [string]$Message,
        [string]$Color = "White",
        [string]$Prefix = ""
    )
    
    $timestamp = Get-Date -Format "HH:mm:ss"
    if ($Prefix) {
        Write-Host "[$timestamp] [$Prefix] $Message" -ForegroundColor $Color
    } else {
        Write-Host "[$timestamp] $Message" -ForegroundColor $Color
    }
}

function Write-Info { param([string]$Message) Write-ColorMessage $Message "Cyan" "INFO" }
function Write-Success { param([string]$Message) Write-ColorMessage $Message "Green" "SUCCESS" }
function Write-Warning { param([string]$Message) Write-ColorMessage $Message "Yellow" "WARNING" }
function Write-Error { param([string]$Message) Write-ColorMessage $Message "Red" "ERROR" }
function Write-Step { param([string]$Message) Write-ColorMessage $Message "Magenta" "STEP" }

function Test-Port {
    param([int]$Port)
    
    try {
        $connection = New-Object System.Net.Sockets.TcpClient
        $connection.Connect("localhost", $Port)
        $connection.Close()
        return $true
    } catch {
        return $false
    }
}

function Stop-ProcessOnPort {
    param([int]$Port)
    
    try {
        $processes = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue | 
                    ForEach-Object { Get-Process -Id $_.OwningProcess -ErrorAction SilentlyContinue }
        
        if ($processes) {
            foreach ($process in $processes) {
                Write-Info "Stopping process $($process.Name) (PID: $($process.Id)) on port $Port"
                Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
            }
            return $true
        }
        return $false
    } catch {
        # Fallback method using netstat
        try {
            $netstat = netstat -ano | Select-String ":$Port "
            if ($netstat) {
                $processIds = $netstat | ForEach-Object { 
                    ($_ -split '\s+')[-1] 
                } | Where-Object { $_ -match '^\d+$' } | Sort-Object -Unique
                
                foreach ($processId in $processIds) {
                    if ($processId -ne "0") {
                        Write-Info "Stopping process PID $processId on port $Port"
                        Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
                    }
                }
                return $true
            }
        } catch {
            Write-Warning "Could not stop processes on port $Port"
        }
        return $false
    }
}

function Stop-AllNodeProcesses {
    Write-Step "Stopping all Node.js processes..."
    
    try {
        $nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
        if ($nodeProcesses) {
            foreach ($process in $nodeProcesses) {
                Write-Info "Stopping Node.js process (PID: $($process.Id))"
                Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
            }
        }
        
        # Also stop npm processes
        $npmProcesses = Get-Process -Name "npm" -ErrorAction SilentlyContinue
        if ($npmProcesses) {
            foreach ($process in $npmProcesses) {
                Write-Info "Stopping npm process (PID: $($process.Id))"
                Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
            }
        }
        
        Start-Sleep -Seconds 2
        Write-Success "All Node.js processes stopped"
    } catch {
        Write-Warning "Some processes may still be running"
    }
}

function Initialize-LogsDirectory {
    $logsPath = Join-Path $PSScriptRoot $Config.LogsDir
    if (-not (Test-Path $logsPath)) {
        New-Item -ItemType Directory -Path $logsPath -Force | Out-Null
        Write-Info "Created logs directory: $logsPath"
    }
    return $logsPath
}

function Test-ServiceHealth {
    param(
        [string]$ServiceName,
        [string]$HealthCheckUrl,
        [int]$Port
    )
    
    try {
        if (Test-Port $Port) {
            try {
                $response = Invoke-WebRequest -Uri $HealthCheckUrl -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
                if ($response.StatusCode -eq 200) {
                    Write-Success "${ServiceName}: HEALTHY (Port $Port)"
                    return $true
                }
            } catch {
                Write-Warning "${ServiceName}: Port $Port is open but health check failed"
            }
        } else {
            Write-Error "${ServiceName}: NOT RUNNING (Port $Port)"
        }
        return $false
    } catch {
        Write-Error "${ServiceName}: HEALTH CHECK FAILED"
        return $false
    }
}

function Start-Service {
    param(
        [string]$ServiceName,
        [string]$ServicePath,
        [string]$StartCommand,
        [int]$Port,
        [string]$LogFile
    )
    
    Write-Step "Starting $ServiceName..."
    
    # Check if service is already running
    if (Test-Port $Port) {
        Write-Warning "$ServiceName is already running on port $Port"
        return $true
    }
    
    # Ensure service directory exists
    $fullPath = Join-Path $PSScriptRoot $ServicePath
    if (-not (Test-Path $fullPath)) {
        Write-Error "Service directory not found: $fullPath"
        return $false
    }
    
    # Install dependencies if needed
    $packageJsonPath = Join-Path $fullPath "package.json"
    $nodeModulesPath = Join-Path $fullPath "node_modules"
    
    if ((Test-Path $packageJsonPath) -and (-not (Test-Path $nodeModulesPath))) {
        Write-Info "Installing dependencies for $ServiceName..."
        try {
            Push-Location $fullPath
            & npm install --silent
            if ($LASTEXITCODE -ne 0) {
                throw "npm install failed"
            }
            Pop-Location
        } catch {
            Pop-Location
            Write-Error "Failed to install dependencies for $ServiceName"
            return $false
        }
    }
    
    # Setup logging
    $logsPath = Initialize-LogsDirectory
    $logFilePath = Join-Path $logsPath $LogFile
    
    # Start the service
    try {
        Push-Location $fullPath
        
        # Parse the start command
        $commandParts = $StartCommand -split ' ', 2
        $executable = $commandParts[0]
        $arguments = if ($commandParts.Length -gt 1) { $commandParts[1] } else { "" }
        
        # Create a unique window title
        $windowTitle = "Renexus - $ServiceName"
        
        # Start the process in a new window
        $processArgs = @(
            '/c'
            "title $windowTitle && echo Starting $ServiceName... && $StartCommand 2>&1 | tee `"$logFilePath`""
        )
        
        Start-Process -FilePath "cmd" -ArgumentList $processArgs -WindowStyle Normal
        
        Pop-Location
        
        # Wait for service to start
        $maxWaitTime = 30
        $waitTime = 0
        
        while ($waitTime -lt $maxWaitTime) {
            Start-Sleep -Seconds 1
            $waitTime++
            
            if (Test-Port $Port) {
                Write-Success "$ServiceName started successfully on port $Port"
                return $true
            }
            
            if ($waitTime % 5 -eq 0) {
                Write-Info "Waiting for $ServiceName to start... ($waitTime/$maxWaitTime seconds)"
            }
        }
        
        Write-Error "$ServiceName failed to start within $maxWaitTime seconds"
        return $false
        
    } catch {
        Pop-Location
        Write-Error "Failed to start ${ServiceName}: $_"
        return $false
    }
}

function Test-DatabaseConnection {
    Write-Step "Checking database connections..."
    
    # Check PostgreSQL
    if (Test-Port 5432) {
        Write-Success "PostgreSQL: RUNNING (Port 5432)"
    } else {
        Write-Warning "PostgreSQL: NOT RUNNING (Port 5432)"
        
        # Try to start PostgreSQL service
        try {
            $service = Get-Service -Name $Config.Database.PostgreSQL.ServiceName -ErrorAction SilentlyContinue
            if ($service) {
                if ($service.Status -eq "Stopped") {
                    Write-Info "Starting PostgreSQL service..."
                    Start-Service -Name $Config.Database.PostgreSQL.ServiceName
                    Start-Sleep -Seconds 5
                    
                    if (Test-Port 5432) {
                        Write-Success "PostgreSQL service started successfully"
                    }
                }
            } else {
                Write-Warning "PostgreSQL service not found. Install PostgreSQL or use Docker."
            }
        } catch {
            Write-Warning "Could not start PostgreSQL service"
        }
    }
    
    # Check Redis
    if (Test-Port 6379) {
        Write-Success "Redis: RUNNING (Port 6379)"
    } else {
        Write-Warning "Redis: NOT RUNNING (Port 6379)"
    }
}

function Clean-TempFiles {
    Write-Step "Cleaning temporary and unwanted files..."
    
    $cleanedFiles = 0
    $cleanedSize = 0
    
    foreach ($pattern in $Config.TempFiles) {
        try {
            $files = Get-ChildItem -Path $PSScriptRoot -Recurse -Force -Name $pattern -ErrorAction SilentlyContinue
            foreach ($file in $files) {
                try {
                    $fullPath = Join-Path $PSScriptRoot $file
                    $size = (Get-Item $fullPath).Length
                    Remove-Item $fullPath -Force -ErrorAction SilentlyContinue
                    $cleanedFiles++
                    $cleanedSize += $size
                } catch {
                    # Ignore errors for individual files
                }
            }
        } catch {
            # Ignore errors for patterns
        }
    }
    
    if ($cleanedFiles -gt 0) {
        $sizeKB = [math]::Round($cleanedSize / 1024, 2)
        Write-Success "Cleaned $cleanedFiles temporary files ($sizeKB KB)"
    } else {
        Write-Info "No temporary files to clean"
    }
}

function Clean-NodeModules {
    Write-Step "Cleaning node_modules directories..."
    
    $nodeModulesPaths = Get-ChildItem -Path $PSScriptRoot -Recurse -Directory -Name "node_modules" -ErrorAction SilentlyContinue
    $cleanedDirs = 0
    
    foreach ($path in $nodeModulesPaths) {
        try {
            $fullPath = Join-Path $PSScriptRoot $path
            Write-Info "Removing: $fullPath"
            Remove-Item $fullPath -Recurse -Force -ErrorAction SilentlyContinue
            $cleanedDirs++
        } catch {
            Write-Warning "Could not remove: $fullPath"
        }
    }
    
    if ($cleanedDirs -gt 0) {
        Write-Success "Cleaned $cleanedDirs node_modules directories"
    } else {
        Write-Info "No node_modules directories to clean"
    }
}

function Open-Browser {
    param([string]$Url = "http://localhost:3000")
    
    if (-not $SkipBrowser) {
        Write-Info "Opening browser: $Url"
        try {
            Start-Process $Url
        } catch {
            Write-Warning "Could not open browser automatically"
        }
    }
}

# ===============================================
# MAIN FUNCTIONS
# ===============================================

function Start-Application {
    Write-Host ""
    Write-Host "===============================================" -ForegroundColor Cyan
    Write-Host "  🚀 STARTING RENEXUS APPLICATION PLATFORM  " -ForegroundColor Cyan
    Write-Host "===============================================" -ForegroundColor Cyan
    Write-Host ""
    
    # Step 1: Clean up existing processes
    Write-Step "Step 1: Cleaning up existing processes..."
    Stop-AllNodeProcesses
    
    foreach ($port in $Config.Ports) {
        Stop-ProcessOnPort $port
    }
    
    # Step 2: Clean temporary files
    Clean-TempFiles
    
    # Step 3: Check database connections
    Test-DatabaseConnection
    
    # Step 4: Install root dependencies
    Write-Step "Step 4: Installing root dependencies..."
    if (Test-Path "package.json") {
        try {
            & npm install --silent
            if ($LASTEXITCODE -eq 0) {
                Write-Success "Root dependencies installed"
            }
        } catch {
            Write-Warning "Failed to install root dependencies"
        }
    }
    
    # Step 5: Start services
    Write-Step "Step 5: Starting services..."
    $startedServices = @()
    
    foreach ($serviceKey in $Config.Services.Keys) {
        $service = $Config.Services[$serviceKey]
        
        if (Start-Service -ServiceName $service.Name -ServicePath $service.Path -StartCommand $service.StartCommand -Port $service.Port -LogFile $service.LogFile) {
            $startedServices += $service.Name
        } else {
            Write-Error "Failed to start $($service.Name)"
        }
        
        # Small delay between services
        Start-Sleep -Seconds 2
    }
    
    # Step 6: Final health checks
    Write-Step "Step 6: Performing health checks..."
    Start-Sleep -Seconds 5
    
    $healthyServices = @()
    foreach ($serviceKey in $Config.Services.Keys) {
        $service = $Config.Services[$serviceKey]
        if (Test-ServiceHealth -ServiceName $service.Name -HealthCheckUrl $service.HealthCheck -Port $service.Port) {
            $healthyServices += $service.Name
        }
    }
    
    # Step 7: Display results
    Write-Host ""
    Write-Host "===============================================" -ForegroundColor Green
    Write-Host "  ✅ APPLICATION STARTUP COMPLETE!           " -ForegroundColor Green
    Write-Host "===============================================" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "🌐 Application URLs:" -ForegroundColor Cyan
    Write-Host "  • Frontend:              http://localhost:3000" -ForegroundColor White
    Write-Host "  • Backend API:           http://localhost:3001" -ForegroundColor White
    Write-Host "  • API Health Check:      http://localhost:3001/health" -ForegroundColor White
    Write-Host "  • Dashboard:             http://localhost:3000/dashboard" -ForegroundColor White
    
    if ($Config.Services.AuthService -and (Test-Port 4001)) {
        Write-Host "  • Auth Service:          http://localhost:4001" -ForegroundColor White
    }
    if ($Config.Services.TaskService -and (Test-Port 4002)) {
        Write-Host "  • Task Service:          http://localhost:4002" -ForegroundColor White
    }
    if ($Config.Services.NotificationService -and (Test-Port 4003)) {
        Write-Host "  • Notification Service:  http://localhost:4003" -ForegroundColor White
    }
    
    Write-Host ""
    Write-Host "📊 Service Status:" -ForegroundColor Cyan
    Write-Host "  • Started: $($startedServices.Count) services" -ForegroundColor Green
    Write-Host "  • Healthy: $($healthyServices.Count) services" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "📝 Logs Directory: $($Config.LogsDir)" -ForegroundColor Cyan
    Write-Host "💡 Use 'run-app.ps1 logs' to view live logs" -ForegroundColor Yellow
    Write-Host "🛑 Use 'run-app.ps1 stop' to stop all services" -ForegroundColor Yellow
    Write-Host ""
    
    # Open browser
    Open-Browser
    
    if ($Logs) {
        Write-Host "Starting log viewer..." -ForegroundColor Yellow
        Start-Sleep -Seconds 2
        Show-Logs
    }
}

function Stop-Application {
    Write-Host ""
    Write-Host "===============================================" -ForegroundColor Yellow
    Write-Host "  🛑 STOPPING RENEXUS APPLICATION PLATFORM  " -ForegroundColor Yellow
    Write-Host "===============================================" -ForegroundColor Yellow
    Write-Host ""
    
    # Stop all processes on configured ports
    foreach ($port in $Config.Ports) {
        Stop-ProcessOnPort $port
    }
    
    # Stop all Node.js processes
    Stop-AllNodeProcesses
    
    Write-Success "All services stopped"
    Write-Host ""
}

function Restart-Application {
    Write-Host ""
    Write-Host "===============================================" -ForegroundColor Magenta
    Write-Host "  🔄 RESTARTING RENEXUS APPLICATION         " -ForegroundColor Magenta
    Write-Host "===============================================" -ForegroundColor Magenta
    Write-Host ""
    
    Stop-Application
    Start-Sleep -Seconds 3
    Start-Application
}

function Show-Status {
    Write-Host ""
    Write-Host "===============================================" -ForegroundColor Cyan
    Write-Host "  📊 RENEXUS APPLICATION STATUS             " -ForegroundColor Cyan
    Write-Host "===============================================" -ForegroundColor Cyan
    Write-Host ""
    
    Write-Host "🌐 Frontend Services:" -ForegroundColor Cyan
    foreach ($serviceKey in @("Frontend")) {
        if ($Config.Services.ContainsKey($serviceKey)) {
            $service = $Config.Services[$serviceKey]
            Test-ServiceHealth -ServiceName $service.Name -HealthCheckUrl $service.HealthCheck -Port $service.Port | Out-Null
        }
    }
    
    Write-Host ""
    Write-Host "🔧 Backend Services:" -ForegroundColor Cyan
    foreach ($serviceKey in @("Backend", "AuthService", "TaskService", "NotificationService")) {
        if ($Config.Services.ContainsKey($serviceKey)) {
            $service = $Config.Services[$serviceKey]
            Test-ServiceHealth -ServiceName $service.Name -HealthCheckUrl $service.HealthCheck -Port $service.Port | Out-Null
        }
    }
    
    Write-Host ""
    Write-Host "🗄️ Database Services:" -ForegroundColor Cyan
    if (Test-Port 5432) {
        Write-Success "PostgreSQL: RUNNING (Port 5432)"
    } else {
        Write-Error "PostgreSQL: NOT RUNNING (Port 5432)"
    }
    
    if (Test-Port 6379) {
        Write-Success "Redis: RUNNING (Port 6379)"
    } else {
        Write-Error "Redis: NOT RUNNING (Port 6379)"
    }
    
    Write-Host ""
}

function Show-Logs {
    Write-Host ""
    Write-Host "===============================================" -ForegroundColor Cyan
    Write-Host "  📋 RENEXUS APPLICATION LOGS               " -ForegroundColor Cyan
    Write-Host "===============================================" -ForegroundColor Cyan
    Write-Host ""
    
    $logsPath = Join-Path $PSScriptRoot $Config.LogsDir
    
    if (-not (Test-Path $logsPath)) {
        Write-Warning "Logs directory not found: $logsPath"
        return
    }
    
    $logFiles = Get-ChildItem -Path $logsPath -Filter "*.log" -ErrorAction SilentlyContinue
    
    if ($logFiles.Count -eq 0) {
        Write-Warning "No log files found in $logsPath"
        return
    }
    
    Write-Info "Showing live logs from all services..."
    Write-Host "Press Ctrl+C to stop viewing logs" -ForegroundColor Yellow
    Write-Host ""
    
    # Show last 10 lines of each log file
    foreach ($logFile in $logFiles) {
        $serviceName = $logFile.BaseName -replace '-', ' '
        Write-Host "=== $serviceName ===" -ForegroundColor Magenta
        
        try {
            $content = Get-Content -Path $logFile.FullName -Tail 10 -ErrorAction SilentlyContinue
            if ($content) {
                $content | ForEach-Object { Write-Host $_ -ForegroundColor Gray }
            } else {
                Write-Host "No recent logs" -ForegroundColor DarkGray
            }
        } catch {
            Write-Host "Could not read log file" -ForegroundColor Red
        }
        
        Write-Host ""
    }
}

function Clean-Environment {
    Write-Host ""
    Write-Host "===============================================" -ForegroundColor Yellow
    Write-Host "  🧹 CLEANING RENEXUS ENVIRONMENT           " -ForegroundColor Yellow
    Write-Host "===============================================" -ForegroundColor Yellow
    Write-Host ""
    
    # Stop all services first
    Stop-Application
    
    # Clean temporary files
    Clean-TempFiles
    
    # Clean node_modules if Force is specified
    if ($Force) {
        Clean-NodeModules
    }
    
    # Clean logs
    $logsPath = Join-Path $PSScriptRoot $Config.LogsDir
    if (Test-Path $logsPath) {
        try {
            Remove-Item -Path $logsPath -Recurse -Force -ErrorAction SilentlyContinue
            Write-Success "Cleaned log files"
        } catch {
            Write-Warning "Could not clean all log files"
        }
    }
    
    Write-Success "Environment cleaned successfully"
    Write-Host ""
}

function Show-Help {
    Write-Host ""
    Write-Host "===============================================" -ForegroundColor Cyan
    Write-Host "  📖 RENEXUS APPLICATION MANAGER HELP       " -ForegroundColor Cyan
    Write-Host "===============================================" -ForegroundColor Cyan
    Write-Host ""
    
    Write-Host "USAGE:" -ForegroundColor Yellow
    Write-Host "  .\run-app.ps1 [Command] [Options]" -ForegroundColor White
    Write-Host ""
    
    Write-Host "COMMANDS:" -ForegroundColor Yellow
    Write-Host "  start     Start all services (default)" -ForegroundColor White
    Write-Host "  stop      Stop all services" -ForegroundColor White
    Write-Host "  restart   Restart all services" -ForegroundColor White
    Write-Host "  status    Show status of all services" -ForegroundColor White
    Write-Host "  logs      Show live logs from all services" -ForegroundColor White
    Write-Host "  clean     Clean environment and temporary files" -ForegroundColor White
    Write-Host "  help      Show this help message" -ForegroundColor White
    Write-Host ""
    
    Write-Host "OPTIONS:" -ForegroundColor Yellow
    Write-Host "  -Logs         Start with logs visible" -ForegroundColor White
    Write-Host "  -Force        Force clean (removes node_modules)" -ForegroundColor White
    Write-Host "  -PostgreSQL   Use PostgreSQL server mode" -ForegroundColor White
    Write-Host "  -SkipBrowser  Do not open browser automatically" -ForegroundColor White
    Write-Host ""
    
    Write-Host "EXAMPLES:" -ForegroundColor Yellow
    Write-Host "  .\run-app.ps1" -ForegroundColor White
    Write-Host "  .\run-app.ps1 start -Logs" -ForegroundColor White
    Write-Host "  .\run-app.ps1 start -PostgreSQL" -ForegroundColor White
    Write-Host "  .\run-app.ps1 status" -ForegroundColor White
    Write-Host "  .\run-app.ps1 logs" -ForegroundColor White
    Write-Host "  .\run-app.ps1 clean -Force" -ForegroundColor White
    Write-Host ""
    
    Write-Host "SERVICES MANAGED:" -ForegroundColor Yellow
    Write-Host "  • Frontend (Next.js)        - Port 3000" -ForegroundColor White
    Write-Host "  • Backend API Gateway       - Port 3001" -ForegroundColor White
    Write-Host "  • Auth Service              - Port 4001" -ForegroundColor White
    Write-Host "  • Task Service              - Port 4002" -ForegroundColor White
    Write-Host "  • Notification Service      - Port 4003" -ForegroundColor White
    Write-Host "  • PostgreSQL Database       - Port 5432" -ForegroundColor White
    Write-Host "  • Redis Cache               - Port 6379" -ForegroundColor White
    Write-Host ""
    
    Write-Host "FEATURES:" -ForegroundColor Yellow
    Write-Host "  ✅ Automatic port cleanup" -ForegroundColor Green
    Write-Host "  ✅ Dependency installation" -ForegroundColor Green
    Write-Host "  ✅ Health checks" -ForegroundColor Green
    Write-Host "  ✅ Centralized logging" -ForegroundColor Green
    Write-Host "  ✅ Temporary file cleanup" -ForegroundColor Green
    Write-Host "  ✅ Graceful shutdown" -ForegroundColor Green
    Write-Host "  ✅ Browser auto-launch" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "For more information, visit: https://github.com/renexus/renexus" -ForegroundColor Cyan
    Write-Host ""
}

# ===============================================
# MAIN EXECUTION
# ===============================================

# Set error handling
$ErrorActionPreference = "SilentlyContinue"

# Check if running as administrator for some operations
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")

if (-not $isAdmin -and ($Command -eq "clean" -and $Force)) {
    Write-Warning "Running with elevated privileges is recommended for full cleanup"
}

# Execute the requested command
switch ($Command.ToLower()) {
    "start" { Start-Application }
    "stop" { Stop-Application }
    "restart" { Restart-Application }
    "status" { Show-Status }
    "logs" { Show-Logs }
    "clean" { Clean-Environment }
    "help" { Show-Help }
    default { Show-Help }
}

# Final message
Write-Host "Script execution completed." -ForegroundColor DarkGray
Write-Host ""
