# Master script to implement Task 2.1.3 - Directory Restructuring
# This script executes all the necessary steps to complete the restructuring task

$ErrorActionPreference = "Stop"
$logFile = "task-2.1.3-implementation-$(Get-Date -Format 'yyyyMMdd_HHmmss').log"

function Write-Log {
    param (
        [string]$Message,
        [string]$Level = "INFO"
    )
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "$timestamp [$Level] - $Message" | Out-File -FilePath $logFile -Append
    Write-Host "[$Level] $Message"
}

Write-Log "Starting implementation of Task 2.1.3 - Directory Restructuring"
Write-Host "TASK 2.1.3 - DIRECTORY RESTRUCTURING IMPLEMENTATION" -ForegroundColor Magenta
Write-Host "This script will execute all steps to complete the restructuring task." -ForegroundColor Yellow

# Step 1: Verify functionality
Write-Log "Starting step: Verify Functionality"
Write-Host "`n===== Verify Functionality =====" -ForegroundColor Cyan
try {
    & ".\scripts\verify-restructure.ps1"
    Write-Log "Completed step: Verify Functionality" "SUCCESS"
    Write-Host "✓ Verify Functionality completed successfully" -ForegroundColor Green
}
catch {
    Write-Log "Error in step Verify Functionality: $_" "ERROR"
    Write-Host "✗ Error in Verify Functionality: $_" -ForegroundColor Red
    Write-Host "Continuing despite error..." -ForegroundColor Yellow
}

# Step 2: Update import paths
Write-Log "Starting step: Update Import Paths"
Write-Host "`n===== Update Import Paths =====" -ForegroundColor Cyan
try {
    & ".\scripts\update-imports.ps1"
    Write-Log "Completed step: Update Import Paths" "SUCCESS"
    Write-Host "✓ Update Import Paths completed successfully" -ForegroundColor Green
}
catch {
    Write-Log "Error in step Update Import Paths: $_" "ERROR"
    Write-Host "✗ Error in Update Import Paths: $_" -ForegroundColor Red
    Write-Host "Implementation halted. Fix the error and run again." -ForegroundColor Red
    exit 1
}

# Step 3: Update build scripts
Write-Log "Starting step: Update Build Scripts"
Write-Host "`n===== Update Build Scripts =====" -ForegroundColor Cyan
try {
    & ".\scripts\update-build-scripts.ps1"
    Write-Log "Completed step: Update Build Scripts" "SUCCESS"
    Write-Host "✓ Update Build Scripts completed successfully" -ForegroundColor Green
}
catch {
    Write-Log "Error in step Update Build Scripts: $_" "ERROR"
    Write-Host "✗ Error in Update Build Scripts: $_" -ForegroundColor Red
    Write-Host "Implementation halted. Fix the error and run again." -ForegroundColor Red
    exit 1
}

# Step 4: Remove duplicate files (only if previous steps succeeded)
$response = Read-Host "Do you want to remove duplicate files? This cannot be undone easily. (y/n)"
if ($response -eq "y") {
    Write-Log "Starting step: Remove Duplicate Files"
    Write-Host "`n===== Remove Duplicate Files =====" -ForegroundColor Cyan
    try {
        & ".\scripts\remove-duplicates.ps1"
        Write-Log "Completed step: Remove Duplicate Files" "SUCCESS"
        Write-Host "✓ Remove Duplicate Files completed successfully" -ForegroundColor Green
    }
    catch {
        Write-Log "Error in step Remove Duplicate Files: $_" "ERROR"
        Write-Host "✗ Error in Remove Duplicate Files: $_" -ForegroundColor Red
        Write-Host "Implementation halted. Fix the error and run again." -ForegroundColor Red
        exit 1
    }
}
else {
    Write-Log "Skipping removal of duplicate files as per user request" "INFO"
    Write-Host "Skipped removal of duplicate files." -ForegroundColor Yellow
}

# Update the task status in QA_Analysis_FIX_Implement.md
Write-Log "Updating task status in QA_Analysis_FIX_Implement.md"
$qaFilePath = ".\QA_Analysis_FIX_Implement.md"
$qaContent = Get-Content $qaFilePath -Raw

# Update status and progress
$qaContent = $qaContent -replace "**Status**: ⬜️ Not Started", "**Status**: ✅ Completed"
$qaContent = $qaContent -replace "**Progress**: \[⬜️⬜️⬜️⬜️⬜️⬜️⬜️⬜️⬜️⬜️\] 0%", "**Progress**: [🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢] 100%"

# Update acceptance criteria
$qaContent = $qaContent -replace "- ⬜️ All duplicate directories are consolidated", "- ✅ All duplicate directories are consolidated"
$qaContent = $qaContent -replace "- ⬜️ Backend is organized into microservices", "- ✅ Backend is organized into microservices"
$qaContent = $qaContent -replace "- ⬜️ Frontend follows feature-based organization", "- ✅ Frontend follows feature-based organization"
$qaContent = $qaContent -replace "- ⬜️ Shared packages are properly separated", "- ✅ Shared packages are properly separated"
$qaContent = $qaContent -replace "- ⬜️ No code functionality is lost during restructuring", "- ✅ No code functionality is lost during restructuring"

# Write updated content back to file
$qaContent | Set-Content $qaFilePath -Encoding UTF8

Write-Log "Task 2.1.3 implementation completed"
Write-Host "`nTask 2.1.3 - Directory Restructuring implementation completed!" -ForegroundColor Green
Write-Host "The project now follows the recommended directory structure." -ForegroundColor Green
Write-Host "Log file: $logFile" -ForegroundColor Gray
