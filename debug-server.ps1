# Debug script to check server status

# Function to check if a port is in use
function Test-PortInUse {
    param (
        [int]$Port
    )
    try {
        $connection = Test-NetConnection -ComputerName localhost -Port $Port -InformationLevel Quiet
        return $connection
    } catch {
        return $false
    }
}

# Check backend server
$backendPort = 3001
Write-Host "Checking backend server on port $backendPort..." -ForegroundColor Cyan

if (Test-PortInUse -Port $backendPort) {
    Write-Host "Backend server is running on port $backendPort" -ForegroundColor Green
    
    # Test the health endpoint
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:$backendPort/health" -Method Get -ErrorAction Stop
        Write-Host "Backend health check successful:" -ForegroundColor Green
        $response | ConvertTo-Json -Depth 10 | Write-Host -ForegroundColor Green
    } catch {
        Write-Host "Failed to connect to backend health endpoint:" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
    }
} else {
    Write-Host "Backend server is not running on port $backendPort" -ForegroundColor Red
}

# Check frontend
$frontendPort = 3000
Write-Host "\nChecking frontend on port $frontendPort..." -ForegroundColor Cyan

if (Test-PortInUse -Port $frontendPort) {
    Write-Host "Frontend is running on port $frontendPort" -ForegroundColor Green
    
    # Try to open in default browser
    try {
        Start-Process "http://localhost:$frontendPort"
    } catch {
        Write-Host "Failed to open browser:" -ForegroundColor Yellow
        Write-Host $_.Exception.Message -ForegroundColor Yellow
    }
} else {
    Write-Host "Frontend is not running on port $frontendPort" -ForegroundColor Red
}

# Check for common issues
Write-Host "\nChecking for common issues..." -ForegroundColor Cyan

# Check if Node.js processes are running
$nodeProcesses = Get-Process node -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    Write-Host "Node.js processes running:" -ForegroundColor Yellow
    $nodeProcesses | Select-Object Id, ProcessName, Path | Format-Table -AutoSize
} else {
    Write-Host "No Node.js processes found" -ForegroundColor Green
}

# Check for environment variables
Write-Host "\nEnvironment variables:" -ForegroundColor Cyan
$envVars = @("NODE_ENV", "DATABASE_URL", "PORT")
foreach ($var in $envVars) {
    $value = [System.Environment]::GetEnvironmentVariable($var)
    Write-Host "$var = $value" -ForegroundColor $(if ($value) { 'Green' } else { 'Yellow' })
}

# Check for required files
Write-Host "\nChecking for required files:" -ForegroundColor Cyan
$requiredFiles = @(
    "backend\api\src\main.ts",
    "frontend\web\package.json",
    "frontend\web\next.config.js"
)

foreach ($file in $requiredFiles) {
    $fullPath = Join-Path $PSScriptRoot $file
    $exists = Test-Path $fullPath
    Write-Host "$file: $($exists ? 'Found' : 'Missing')" -ForegroundColor $(if ($exists) { 'Green' } else { 'Red' })
}

Write-Host "\nDebug check complete. Press any key to exit..." -ForegroundColor Cyan
$null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')
