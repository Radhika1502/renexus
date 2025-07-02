# Script to safely remove duplicate folders after consolidation
$ErrorActionPreference = "Stop"

function Write-Log {
    param (
        [string]$Message,
        [string]$Type = "INFO"
    )
    
    $color = switch ($Type) {
        "INFO" { "White" }
        "SUCCESS" { "Green" }
        "WARNING" { "Yellow" }
        "ERROR" { "Red" }
        default { "White" }
    }
    
    Write-Host "[$Type] $Message" -ForegroundColor $color
}

# Verify the new structure exists and has content
$requiredFolders = @(
    "c:\Users\HP\Renexus\frontend\web\src\components",
    "c:\Users\HP\Renexus\frontend\web\src\hooks",
    "c:\Users\HP\Renexus\frontend\web\src\services",
    "c:\Users\HP\Renexus\frontend\web\src\types",
    "c:\Users\HP\Renexus\frontend\web\src\utils"
)

# Check if new structure is in place
$structureValid = $true
foreach ($folder in $requiredFolders) {
    if (-not (Test-Path $folder)) {
        Write-Log "Required folder not found: $folder" "ERROR"
        $structureValid = $false
    } else {
        $itemCount = (Get-ChildItem -Path $folder -Recurse -File).Count
        Write-Log "Found $itemCount files in $folder"
    }
}

if (-not $structureValid) {
    Write-Log "New folder structure is not complete. Aborting cleanup to prevent data loss." "ERROR"
    exit 1
}

# List of duplicate folders to remove (with safety check)
$duplicateFolders = @(
    "c:\Users\HP\Renexus\frontend\components",
    "c:\Users\HP\Renexus\frontend\hooks",
    "c:\Users\HP\Renexus\frontend\services",
    "c:\Users\HP\Renexus\frontend\types",
    "c:\Users\HP\Renexus\frontend\utils"
)

# Create a backup before removing anything
$backupDir = "c:\Users\HP\Renexus\duplicates-backup-$(Get-Date -Format 'yyyyMMdd_HHmmss')"
Write-Log "Creating backup of duplicate folders to $backupDir"
New-Item -Path $backupDir -ItemType Directory -Force | Out-Null

foreach ($folder in $duplicateFolders) {
    if (Test-Path $folder) {
        $folderName = Split-Path $folder -Leaf
        $backupPath = Join-Path $backupDir $folderName
        
        Write-Log "Backing up $folder to $backupPath"
        Copy-Item -Path $folder -Destination $backupPath -Recurse -Force
    }
}

# Now remove the duplicate folders
foreach ($folder in $duplicateFolders) {
    if (Test-Path $folder) {
        try {
            Write-Log "Removing duplicate folder: $folder"
            Remove-Item -Path $folder -Recurse -Force -ErrorAction Stop
            Write-Log "Successfully removed: $folder" "SUCCESS"
        } catch {
            Write-Log "Error removing $folder : $_" "ERROR"
        }
    } else {
        Write-Log "Folder not found (may have been removed already): $folder" "WARNING"
    }
}

# Verify the cleanup
$remainingDuplicates = $false
foreach ($folder in $duplicateFolders) {
    if (Test-Path $folder) {
        Write-Log "Warning: Duplicate folder still exists: $folder" "WARNING"
        $remainingDuplicates = $true
    }
}

if (-not $remainingDuplicates) {
    Write-Log "All duplicate folders have been successfully removed." "SUCCESS"
} else {
    Write-Log "Some duplicate folders could not be removed. See warnings above." "WARNING"
}

Write-Log "Cleanup complete. A backup of all removed folders is available at: $backupDir" "SUCCESS"
Write-Log "You can verify the new structure at: c:\Users\HP\Renexus\frontend\web\src" "INFO"
