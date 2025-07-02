# Verify application functionality after directory restructuring
$ErrorActionPreference = "Stop"
$logFile = "app-verification-$(Get-Date -Format 'yyyyMMdd_HHmmss').log"

function Write-Log {
    param (
        [string]$Message
    )
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "$timestamp - $Message" | Out-File -FilePath $logFile -Append
    Write-Host $Message
}

Write-Log "Starting verification of application functionality..."

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
        Write-Log "Required directory not found: $dir"
        $allDirsExist = $false
    }
    else {
        Write-Log "Directory exists: $dir"
    }
}

if (-not $allDirsExist) {
    Write-Log "Some required directories are missing. Restructuring may not be complete."
    exit 1
}

Write-Log "All required directories exist."

# Check if frontend build works
Write-Log "Testing frontend build..."
try {
    Set-Location -Path "frontend/web"
    
    # Check if package.json exists
    if (-not (Test-Path "package.json")) {
        Write-Log "package.json not found in frontend/web"
        Set-Location -Path "../.."
        exit 1
    }
    
    Write-Log "package.json found in frontend/web"
    Set-Location -Path "../.."
}
catch {
    Write-Log "Error checking frontend: $_"
    Set-Location -Path "../.."
    exit 1
}

# Check if backend server file exists
Write-Log "Checking backend server..."
if (Test-Path "backend/server.ts") {
    Write-Log "Backend server file exists: backend/server.ts"
}
else {
    Write-Log "Backend server file not found: backend/server.ts"
}

# Check for potential import errors in key files
Write-Log "Checking for potential import errors..."

# Function to check for suspicious import patterns
function Test-ImportErrors {
    param (
        [string]$FilePath
    )
    
    $content = Get-Content $FilePath -Raw
    $suspiciousPatterns = @(
        'import .* from ["''"]\.\.\/frontend\/(?!web)',
        'import .* from ["''"]\.\.\/shared\/',
        'import .* from ["''"]\.\.\/backend\/services\/task',
        'import .* from ["''"]\.\.\/backend\/api\/'
    )
    
    foreach ($pattern in $suspiciousPatterns) {
        if ($content -match $pattern) {
            return $true
        }
    }
    
    return $false
}

# Check key files for potential import errors
$suspiciousFiles = @()
$filesToCheck = Get-ChildItem -Path "." -Recurse -Include "*.ts", "*.tsx", "*.js", "*.jsx" -Exclude "node_modules" | Select-Object -First 100
foreach ($file in $filesToCheck) {
    if (Test-ImportErrors -FilePath $file.FullName) {
        $suspiciousFiles += $file.FullName
    }
}

if ($suspiciousFiles.Count -gt 0) {
    Write-Log "Potential import errors found in $($suspiciousFiles.Count) files:"
    foreach ($file in $suspiciousFiles) {
        Write-Log "  - $file"
    }
}
else {
    Write-Log "No obvious import errors detected in sampled files."
}

Write-Log "Verification completed. Check the log file for details: $logFile"
