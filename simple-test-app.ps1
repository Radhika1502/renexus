# Simple Test for Reorganized Application
# This script will test if the application still works correctly after reorganization

Write-Host "Starting Renexus Application Test..." -ForegroundColor Cyan
Write-Host "------------------------------------------" -ForegroundColor Cyan

# Define paths
$rootPath = "c:\Users\HP\Renexus"
$backendPath = "$rootPath\backend"
$frontendPath = "$rootPath\frontend"
$sharedPath = "$rootPath\shared"
$logPath = "$rootPath\reorganization_test_$(Get-Date -Format 'yyyyMMdd_HHmmss').txt"

# Create log file
"Renexus Reorganization Test Log - $(Get-Date)" | Out-File -FilePath $logPath -Force

# Function to log messages
function Write-Log {
    param (
        [string]$Message,
        [string]$Type = "INFO"
    )
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] [$Type] $Message"
    $logMessage | Out-File -FilePath $logPath -Append
    
    switch ($Type) {
        "INFO" { Write-Host $Message -ForegroundColor White }
        "SUCCESS" { Write-Host $Message -ForegroundColor Green }
        "WARNING" { Write-Host $Message -ForegroundColor Yellow }
        "ERROR" { Write-Host $Message -ForegroundColor Red }
        default { Write-Host $Message }
    }
}

# Test directory structure
Write-Log "Testing directory structure..." "INFO"

$structureOk = $true

if (Test-Path -Path $backendPath -PathType Container) {
    Write-Log "Backend directory exists at: $backendPath" "SUCCESS"
} else {
    Write-Log "Backend directory not found at: $backendPath" "ERROR"
    $structureOk = $false
}

if (Test-Path -Path $frontendPath -PathType Container) {
    Write-Log "Frontend directory exists at: $frontendPath" "SUCCESS"
} else {
    Write-Log "Frontend directory not found at: $frontendPath" "ERROR"
    $structureOk = $false
}

if (Test-Path -Path $sharedPath -PathType Container) {
    Write-Log "Shared directory exists at: $sharedPath" "SUCCESS"
} else {
    Write-Log "Shared directory not found at: $sharedPath" "ERROR"
    $structureOk = $false
}

# Check for key files
Write-Log "Checking for key files..." "INFO"

$keyFilesOk = $true

$keyFiles = @(
    "$backendPath\server.ts",
    "$backendPath\simple-server.js",
    "$frontendPath\components",
    "$sharedPath\types",
    "$sharedPath\config"
)

foreach ($file in $keyFiles) {
    if (Test-Path -Path $file) {
        Write-Log "Found key file/directory: $file" "SUCCESS"
    } else {
        Write-Log "Missing key file/directory: $file" "ERROR"
        $keyFilesOk = $false
    }
}

# Check for import issues in a sample file
Write-Log "Checking sample file imports..." "INFO"

$sampleImportsOk = $true

$sampleFile = "$frontendPath\components\ai\SuggestionPanel.tsx"
if (Test-Path -Path $sampleFile) {
    $content = Get-Content -Path $sampleFile -Raw
    if ($content -match "from '../../../shared/types/ai'") {
        Write-Log "Sample file has correct import path to shared directory" "SUCCESS"
    } else {
        Write-Log "Sample file may have incorrect import path to shared directory" "WARNING"
        $sampleImportsOk = $false
    }
} else {
    Write-Log "Sample file not found: $sampleFile" "ERROR"
    $sampleImportsOk = $false
}

# Try to run npm commands to check package integrity
Write-Log "Testing npm package integrity..." "INFO"

try {
    $npmOutput = npm list --depth=0 2>&1
    Write-Log "npm packages list executed successfully" "SUCCESS"
    $npmOk = $true
} catch {
    Write-Log "Error running npm list: $_" "WARNING"
    $npmOk = $false
}

# Summary
Write-Host ""
Write-Host "Test Summary:" -ForegroundColor Cyan
Write-Host "------------------------------------------" -ForegroundColor Cyan
Write-Host "Directory Structure: $(if ($structureOk) { 'PASSED' } else { 'FAILED' })" -ForegroundColor $(if ($structureOk) { 'Green' } else { 'Red' })
Write-Host "Key Files: $(if ($keyFilesOk) { 'PASSED' } else { 'FAILED' })" -ForegroundColor $(if ($keyFilesOk) { 'Green' } else { 'Red' })
Write-Host "Sample Imports: $(if ($sampleImportsOk) { 'PASSED' } else { 'WARNING' })" -ForegroundColor $(if ($sampleImportsOk) { 'Green' } else { 'Yellow' })
Write-Host "npm Packages: $(if ($npmOk) { 'PASSED' } else { 'WARNING' })" -ForegroundColor $(if ($npmOk) { 'Green' } else { 'Yellow' })
Write-Host ""

# Final result
if ($structureOk -and $keyFilesOk -and $sampleImportsOk -and $npmOk) {
    Write-Host "Overall Test Result: PASSED" -ForegroundColor Green
    Write-Log "All tests passed. The reorganized application appears to be working correctly." "SUCCESS"
} else {
    Write-Host "Overall Test Result: NEEDS ATTENTION" -ForegroundColor Yellow
    Write-Log "Some tests need attention. Manual review and fixes may be required." "WARNING"
    
    # Provide recommendations
    Write-Host ""
    Write-Host "Recommendations:" -ForegroundColor Yellow
    
    if (-not $structureOk) {
        Write-Host "- Check that all directories were created correctly" -ForegroundColor Yellow
    }
    
    if (-not $keyFilesOk) {
        Write-Host "- Verify that key files were moved to the correct locations" -ForegroundColor Yellow
    }
    
    if (-not $sampleImportsOk) {
        Write-Host "- Review import paths in the codebase and update them manually" -ForegroundColor Yellow
        Write-Host "  Example: Change 'import { X } from \"../../types/y\"' to 'import { X } from \"../../../shared/types/y\"'" -ForegroundColor Yellow
    }
    
    if (-not $npmOk) {
        Write-Host "- Run 'npm install' to reinstall dependencies" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "1. Update any remaining import paths that reference moved files" -ForegroundColor White
Write-Host "2. Test running the application with 'npm start' or your usual start command" -ForegroundColor White
Write-Host "3. Check for any runtime errors related to file paths" -ForegroundColor White
Write-Host ""
Write-Host "Log file created at: $logPath" -ForegroundColor Cyan
