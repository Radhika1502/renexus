# Complete implementation of Task 2.1.3 - Directory Restructuring
# This script executes all the necessary steps to complete the restructuring task

$ErrorActionPreference = "Stop"
$logFile = "task-2.1.3-completion-$(Get-Date -Format 'yyyyMMdd_HHmmss').log"

function Write-Log {
    param (
        [string]$Message,
        [string]$Level = "INFO"
    )
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "$timestamp [$Level] - $Message" | Out-File -FilePath $logFile -Append
    Write-Host "[$Level] $Message"
}

function Invoke-Step {
    param (
        [string]$StepName,
        [string]$ScriptPath
    )
    
    Write-Log "Starting step: $StepName"
    Write-Host "`n===== $StepName =====" -ForegroundColor Cyan
    
    try {
        & $ScriptPath
        Write-Log "Completed step: $StepName" "SUCCESS"
        Write-Host "✓ $StepName completed successfully" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Log "Error in step $StepName: $_" "ERROR"
        Write-Host "✗ Error in $StepName: $_" -ForegroundColor Red
        return $false
    }
}

Write-Host "TASK 2.1.3 - DIRECTORY RESTRUCTURING IMPLEMENTATION" -ForegroundColor Magenta
Write-Host "This script will execute all steps to complete the restructuring task." -ForegroundColor Yellow
Write-Log "Starting implementation of Task 2.1.3 - Directory Restructuring"

# Step 1: Verify application functionality
$verifySuccess = Invoke-Step -StepName "Verify Application Functionality" -ScriptPath ".\verify-app.ps1"
if (-not $verifySuccess) {
    Write-Host "Continuing despite verification issues..." -ForegroundColor Yellow
}

# Step 2: Update import paths
$importSuccess = Invoke-Step -StepName "Update Import Paths" -ScriptPath ".\update-imports-simple.ps1"
if (-not $importSuccess) {
    Write-Host "Implementation halted. Fix import path issues and run again." -ForegroundColor Red
    exit 1
}

# Step 3: Update build scripts and configurations
$buildSuccess = Invoke-Step -StepName "Update Build Configurations" -ScriptPath ".\update-build-configs.ps1"
if (-not $buildSuccess) {
    Write-Host "Implementation halted. Fix build configuration issues and run again." -ForegroundColor Red
    exit 1
}

# Step 4: Ask about removing duplicate files
$response = Read-Host "Do you want to proceed with removing duplicate files? (y/n)"
if ($response -eq "y") {
    $duplicateSuccess = Invoke-Step -StepName "Remove Duplicate Files" -ScriptPath ".\remove-duplicates-safe.ps1"
    if (-not $duplicateSuccess) {
        Write-Host "Issue with duplicate file removal. Check the logs for details." -ForegroundColor Yellow
    }
}
else {
    Write-Log "Skipping removal of duplicate files as per user request" "INFO"
    Write-Host "Skipped removal of duplicate files." -ForegroundColor Yellow
}

# Final verification
Write-Host "`nPerforming final verification..." -ForegroundColor Cyan
$finalVerifySuccess = Invoke-Step -StepName "Final Verification" -ScriptPath ".\verify-app.ps1"

if ($finalVerifySuccess) {
    Write-Host "`nTask 2.1.3 - Directory Restructuring implementation completed successfully!" -ForegroundColor Green
    Write-Host "The project now follows the recommended directory structure." -ForegroundColor Green
}
else {
    Write-Host "`nTask 2.1.3 implementation completed with some issues. Please review the logs." -ForegroundColor Yellow
}

Write-Host "Log file: $logFile" -ForegroundColor Gray
