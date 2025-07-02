# Run-Renexus.ps1 - Start the Renexus application with enhanced logging
# Created for Phase 6 deployment

# Clear console and display header
Clear-Host
Write-Host "###############################################" -ForegroundColor Cyan
Write-Host "#            RENEXUS STARTUP SCRIPT           #" -ForegroundColor Cyan
Write-Host "#            Phase 6 Deployment               #" -ForegroundColor Cyan
Write-Host "###############################################" -ForegroundColor Cyan
Write-Host ""

# Function to check and kill processes on a specific port
function Stop-ProcessOnPort {
    param (
        [int]$Port
    )
    
    Write-Host "Checking for processes on port $Port..." -NoNewline
    
    try {
        $connections = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
        if ($connections) {
            $pids = $connections | Select-Object -ExpandProperty OwningProcess -Unique
            foreach ($pid in $pids) {
                $process = Get-Process -Id $pid -ErrorAction SilentlyContinue
                if ($process) {
                    Write-Host " found $($process.ProcessName) (PID: $pid)" -ForegroundColor Yellow
                    Stop-Process -Id $pid -Force
                    Start-Sleep -Seconds 1
                    Write-Host "Process terminated" -ForegroundColor Green
                }
            }
        } else {
            Write-Host " clear" -ForegroundColor Green
        }
    } catch {
        Write-Host " error: $_" -ForegroundColor Red
    }
}

# Function to create directory if it doesn't exist
function Ensure-Directory {
    param (
        [string]$Path
    )
    
    if (-not (Test-Path -Path $Path)) {
        New-Item -ItemType Directory -Path $Path | Out-Null
        Write-Host "Created directory: $Path" -ForegroundColor Green
    }
}

# Setup environment
$rootDir = $PSScriptRoot
$logDir = Join-Path $rootDir "logs"
$frontendDir = Join-Path $rootDir "frontend\web"
$backendDir = Join-Path $rootDir "backend\api"

# Ensure directories exist
Write-Host "Setting up environment..." -ForegroundColor Cyan
Ensure-Directory -Path $logDir

# Check and kill processes on relevant ports
Write-Host "Checking and freeing up ports..." -ForegroundColor Cyan
Stop-ProcessOnPort -Port 3000  # Frontend
Stop-ProcessOnPort -Port 3001  # Backend API
Stop-ProcessOnPort -Port 5432  # PostgreSQL

# Setup log files
$backendLogFile = Join-Path $logDir "backend-$(Get-Date -Format 'yyyyMMdd-HHmmss').log"
$frontendLogFile = Join-Path $logDir "frontend-$(Get-Date -Format 'yyyyMMdd-HHmmss').log"
$consoleLogFile = Join-Path $logDir "console-$(Get-Date -Format 'yyyyMMdd-HHmmss').log"

# Check for required tools
Write-Host "Checking prerequisites..." -ForegroundColor Cyan

# Create PostgreSQL check script
$pgCheckScript = @'
try {
    $conn = New-Object System.Data.Odbc.OdbcConnection
    $conn.ConnectionString = "Driver={PostgreSQL ODBC Driver(UNICODE)};Server=localhost;Port=5432;Database=postgres;UID=postgres;PWD=postgres;"
    $conn.Open()
    Write-Host "PostgreSQL is running and accessible" -ForegroundColor Green
    $conn.Close()
    exit 0
} catch {
    Write-Host "PostgreSQL is not accessible: $_" -ForegroundColor Red
    exit 1
}
'@

$pgCheckPath = Join-Path $env:TEMP "pg-check.ps1"
Set-Content -Path $pgCheckPath -Value $pgCheckScript

# Check PostgreSQL
Write-Host "Checking PostgreSQL connection..." -NoNewline
$pgResult = powershell -File $pgCheckPath
if ($LASTEXITCODE -eq 0) {
    Write-Host " OK" -ForegroundColor Green
} else {
    Write-Host " Failed. Starting PostgreSQL if installed..." -ForegroundColor Yellow
    # Try to start PostgreSQL if it's installed via typical paths
    try {
        Start-Service postgresql* -ErrorAction SilentlyContinue
        Write-Host "PostgreSQL service started" -ForegroundColor Green
    } catch {
        Write-Host "Could not start PostgreSQL service. Please start it manually." -ForegroundColor Red
        Write-Host "Instructions: https://www.postgresql.org/docs/current/server-start.html" -ForegroundColor Cyan
    }
}

# Install dependencies if needed
function Install-Dependencies {
    param (
        [string]$Directory,
        [string]$Name
    )
    
    Write-Host "Checking $Name dependencies..." -NoNewline
    
    if (Test-Path (Join-Path $Directory "node_modules")) {
        Write-Host " Found" -ForegroundColor Green
    } else {
        Write-Host " Not found. Installing..." -ForegroundColor Yellow
        Set-Location $Directory
        npm install
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Dependencies installed successfully" -ForegroundColor Green
        } else {
            Write-Host "Error installing dependencies" -ForegroundColor Red
        }
    }
}

Install-Dependencies -Directory $backendDir -Name "Backend"
Install-Dependencies -Directory $frontendDir -Name "Frontend"

# Copy environment files if needed
if (-not (Test-Path (Join-Path $backendDir ".env"))) {
    if (Test-Path (Join-Path $backendDir ".env.example")) {
        Copy-Item (Join-Path $backendDir ".env.example") -Destination (Join-Path $backendDir ".env")
        Write-Host "Created backend .env file from example" -ForegroundColor Green
    }
}

# Start services
Write-Host ""
Write-Host "Starting services..." -ForegroundColor Cyan

# Start backend service
Write-Host "Starting Backend API..." -ForegroundColor Yellow
Set-Location $backendDir
Start-Process -FilePath "powershell.exe" -ArgumentList "-Command", "cd '$backendDir'; npm run dev | Tee-Object -FilePath '$backendLogFile'" -WindowStyle Normal

# Allow backend to initialize
Start-Sleep -Seconds 5

# Start frontend service
Write-Host "Starting Frontend..." -ForegroundColor Yellow
Set-Location $frontendDir
Start-Process -FilePath "powershell.exe" -ArgumentList "-Command", "cd '$frontendDir'; npm run dev | Tee-Object -FilePath '$frontendLogFile'" -WindowStyle Normal

# Wait for services to initialize
Write-Host "Waiting for services to initialize..." -ForegroundColor Cyan
Start-Sleep -Seconds 10

# Check service status
function Test-ServiceHealth {
    param (
        [string]$Name,
        [string]$Url
    )
    
    Write-Host "Checking $Name health ($Url)..." -NoNewline
    
    try {
        $response = Invoke-WebRequest -Uri $Url -Method GET -TimeoutSec 5 -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            Write-Host " OK (HTTP $($response.StatusCode))" -ForegroundColor Green
            return $true
        } else {
            Write-Host " Unexpected status: HTTP $($response.StatusCode)" -ForegroundColor Yellow
            return $false
        }
    } catch {
        Write-Host " Failed to connect" -ForegroundColor Red
        return $false
    }
}

$backendOk = Test-ServiceHealth -Name "Backend API" -Url "http://localhost:3001/api/health"
$frontendOk = Test-ServiceHealth -Name "Frontend" -Url "http://localhost:3000"

# Display service status
Write-Host ""
Write-Host "Service Status:" -ForegroundColor Cyan
Write-Host "--------------- " -ForegroundColor Cyan
$frontendStatus = if ($frontendOk) { "Running" } else { "Not responding" }
$backendStatus = if ($backendOk) { "Running" } else { "Not responding" }

# Fancy status display
Write-Host "Frontend  : " -NoNewline
if ($frontendStatus -eq "Running") {
    Write-Host "[RUNNING] " -ForegroundColor Green -NoNewline
} else {
    Write-Host "[FAILED]  " -ForegroundColor Red -NoNewline
}
Write-Host "http://localhost:3000"

Write-Host "Backend   : " -NoNewline
if ($backendStatus -eq "Running") {
    Write-Host "[RUNNING] " -ForegroundColor Green -NoNewline
} else {
    Write-Host "[FAILED]  " -ForegroundColor Red -NoNewline
}
Write-Host "http://localhost:3001/api/health"

Write-Host "Database  : " -NoNewline
if ($LASTEXITCODE -eq 0) {
    Write-Host "[RUNNING] " -ForegroundColor Green -NoNewline
} else {
    Write-Host "[UNKNOWN] " -ForegroundColor Yellow -NoNewline
}
Write-Host "PostgreSQL on port 5432"

# Open browser if frontend is running
if ($frontendOk) {
    Start-Process "http://localhost:3000"
}

# Instructions for log viewing
Write-Host ""
Write-Host "Log Files:" -ForegroundColor Cyan
Write-Host "------------ " -ForegroundColor Cyan
Write-Host "Backend : $backendLogFile"
Write-Host "Frontend: $frontendLogFile"

# Setup log monitoring function
function Show-Logs {
    param (
        [string]$LogFile,
        [int]$Lines = 20
    )
    
    if (Test-Path $LogFile) {
        Get-Content -Path $LogFile -Tail $Lines
    } else {
        Write-Host "Log file not found: $LogFile" -ForegroundColor Red
    }
}

# Keep script running and allow log viewing
Write-Host ""
Write-Host "Application is running. Select an option:" -ForegroundColor Cyan
Write-Host "1. View Backend logs"
Write-Host "2. View Frontend logs"
Write-Host "3. Open Frontend in browser"
Write-Host "4. Open Backend health check in browser"
Write-Host "Q. Quit and stop all services"
Write-Host ""

while ($true) {
    $key = $host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown").Character
    
    switch ($key) {
        '1' {
            Clear-Host
            Write-Host "Backend Logs (last 50 lines):" -ForegroundColor Cyan
            Write-Host "------------------------------" -ForegroundColor Cyan
            Show-Logs -LogFile $backendLogFile -Lines 50
            Write-Host "`nPress any key to return to menu..."
            $host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown") | Out-Null
            Clear-Host
            Write-Host "Select an option:" -ForegroundColor Cyan
            Write-Host "1. View Backend logs"
            Write-Host "2. View Frontend logs"
            Write-Host "3. Open Frontend in browser"
            Write-Host "4. Open Backend health check in browser"
            Write-Host "Q. Quit and stop all services"
        }
        '2' {
            Clear-Host
            Write-Host "Frontend Logs (last 50 lines):" -ForegroundColor Cyan
            Write-Host "-------------------------------" -ForegroundColor Cyan
            Show-Logs -LogFile $frontendLogFile -Lines 50
            Write-Host "`nPress any key to return to menu..."
            $host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown") | Out-Null
            Clear-Host
            Write-Host "Select an option:" -ForegroundColor Cyan
            Write-Host "1. View Backend logs"
            Write-Host "2. View Frontend logs"
            Write-Host "3. Open Frontend in browser"
            Write-Host "4. Open Backend health check in browser"
            Write-Host "Q. Quit and stop all services"
        }
        '3' {
            Start-Process "http://localhost:3000"
        }
        '4' {
            Start-Process "http://localhost:3001/api/health"
        }
        'q' {
            Write-Host "`nStopping services..." -ForegroundColor Yellow
            Stop-ProcessOnPort -Port 3000
            Stop-ProcessOnPort -Port 3001
            Write-Host "Services stopped" -ForegroundColor Green
            exit
        }
    }
}
