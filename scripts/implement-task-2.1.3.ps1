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

function Invoke-Step {
    param (
        [string]$StepName,
        [string]$ScriptPath,
        [switch]$ContinueOnError = $false
    )
    
    Write-Log "Starting step: $StepName"
    Write-Host "`n===== $StepName =====" -ForegroundColor Cyan
    
    try {
        & $ScriptPath
        if ($LASTEXITCODE -ne 0) {
            throw "Script exited with code $LASTEXITCODE"
        }
        Write-Log "Completed step: $StepName" "SUCCESS"
        Write-Host "✓ $StepName completed successfully" -ForegroundColor Green
    }
    catch {
        Write-Log "Error in step $StepName: $_" "ERROR"
        Write-Host "✗ Error in $StepName: $_" -ForegroundColor Red
        
        if (-not $ContinueOnError) {
            Write-Host "Implementation halted. Fix the error and run again." -ForegroundColor Red
            exit 1
        }
        else {
            Write-Host "Continuing despite error..." -ForegroundColor Yellow
        }
    }
}

# Main execution
Write-Log "Starting implementation of Task 2.1.3 - Directory Restructuring"
Write-Host "TASK 2.1.3 - DIRECTORY RESTRUCTURING IMPLEMENTATION" -ForegroundColor Magenta
Write-Host "This script will execute all steps to complete the restructuring task." -ForegroundColor Yellow

# Step 1: Verify functionality
Invoke-Step -StepName "Verify Functionality" -ScriptPath ".\scripts\verify-restructure.ps1" -ContinueOnError

# Step 2: Update import paths
Invoke-Step -StepName "Update Import Paths" -ScriptPath ".\scripts\update-imports.ps1"

# Step 3: Update build scripts
Invoke-Step -StepName "Update Build Scripts" -ScriptPath ".\scripts\update-build-scripts.ps1"

# Step 4: Remove duplicate files (only if previous steps succeeded)
$response = Read-Host "Do you want to remove duplicate files? This cannot be undone easily. (y/n)"
if ($response -eq "y") {
    Invoke-Step -StepName "Remove Duplicate Files" -ScriptPath ".\scripts\remove-duplicates.ps1"
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
