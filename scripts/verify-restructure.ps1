# Verify functionality after directory restructuring
# This script tests if the application still works with the new directory structure

$ErrorActionPreference = "Stop"
$logFile = "restructure-verification-$(Get-Date -Format 'yyyyMMdd_HHmmss').log"

function Write-Log {
    param (
        [string]$Message,
        [string]$Level = "INFO"
    )
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "$timestamp [$Level] - $Message" | Out-File -FilePath $logFile -Append
    Write-Host "[$Level] $Message"
}

Write-Log "Starting verification of restructured application..."

# Check if key directories exist
$requiredDirs = @(
    "backend/api-gateway",
    "backend/auth-service",
    "backend/task-service",
    "backend/notification-service",
    "backend/shared",
    "frontend/web/src",
    "packages/ui",
    "packages/database",
    "packages/shared"
)

$allDirsExist = $true
foreach ($dir in $requiredDirs) {
    if (-not (Test-Path $dir)) {
        Write-Log "Required directory not found: $dir" "ERROR"
        $allDirsExist = $false
    }
}

if (-not $allDirsExist) {
    Write-Log "Some required directories are missing. Restructuring may not be complete." "ERROR"
    exit 1
}

Write-Log "All required directories exist."

# Test backend server startup
Write-Log "Testing backend server startup..."
try {
    # Start the backend server in a new process
    $backendProcess = Start-Process -FilePath "node" -ArgumentList "backend/server.ts" -PassThru -NoNewWindow
    Start-Sleep -Seconds 5
    
    # Check if the process is still running
    if (-not $backendProcess.HasExited) {
        Write-Log "Backend server started successfully."
        # Stop the server
        Stop-Process -Id $backendProcess.Id -Force
    } else {
        Write-Log "Backend server failed to start." "ERROR"
    }
} catch {
    Write-Log "Error starting backend server: $_" "ERROR"
}

# Test frontend build
Write-Log "Testing frontend build..."
try {
    Set-Location -Path "frontend/web"
    $npmInstallOutput = npm install 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Log "npm install failed in frontend/web" "ERROR"
        Write-Log $npmInstallOutput "ERROR"
    } else {
        Write-Log "npm install succeeded in frontend/web"
        
        $buildOutput = npm run build 2>&1
        if ($LASTEXITCODE -ne 0) {
            Write-Log "Frontend build failed" "ERROR"
            Write-Log $buildOutput "ERROR"
        } else {
            Write-Log "Frontend build succeeded"
        }
    }
    Set-Location -Path "../.."
} catch {
    Write-Log "Error testing frontend build: $_" "ERROR"
}

# Check for import errors in key files
Write-Log "Checking for import errors in key files..."
$importErrors = @()

# Function to check for import errors in a file
function Test-ImportErrors {
    param (
        [string]$FilePath
    )
    
    if (Test-Path $FilePath) {
        $content = Get-Content $FilePath -Raw
        if ($content -match "import .* from ['\"]\.\.\/") {
            return $true
        }
    }
    return $false
}

# Check key files for potential import errors
$filesToCheck = Get-ChildItem -Path "frontend/web/src" -Recurse -Include "*.ts", "*.tsx", "*.js", "*.jsx"
foreach ($file in $filesToCheck) {
    if (Test-ImportErrors -FilePath $file.FullName) {
        $importErrors += $file.FullName
    }
}

if ($importErrors.Count -gt 0) {
    Write-Log "Potential import errors found in $($importErrors.Count) files:" "WARNING"
    foreach ($file in $importErrors) {
        Write-Log "  - $file" "WARNING"
    }
} else {
    Write-Log "No obvious import errors detected."
}

Write-Log "Verification completed. Check the log file for details: $logFile"
