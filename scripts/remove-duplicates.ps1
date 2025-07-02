# Remove duplicate files after restructuring
# This script removes original files that have been copied to new locations

$ErrorActionPreference = "Stop"
$logFile = "duplicate-removal-$(Get-Date -Format 'yyyyMMdd_HHmmss').log"

function Write-Log {
    param (
        [string]$Message,
        [string]$Level = "INFO"
    )
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "$timestamp [$Level] - $Message" | Out-File -FilePath $logFile -Append
    Write-Host "[$Level] $Message"
}

Write-Log "Starting removal of duplicate files after restructuring..."

# Define directories to clean up
$directoriesToClean = @(
    # Frontend duplicates
    @{
        Original = "frontend/components"
        NewLocation = "frontend/web/src/components"
    },
    @{
        Original = "frontend/hooks"
        NewLocation = "frontend/web/src/hooks"
    },
    @{
        Original = "frontend/services"
        NewLocation = "frontend/web/src/services"
    },
    @{
        Original = "frontend/pages"
        NewLocation = "frontend/web/pages"
    },
    @{
        Original = "frontend/public"
        NewLocation = "frontend/web/public"
    },
    
    # Backend duplicates
    @{
        Original = "backend/api"
        NewLocation = "backend/api-gateway"
    },
    @{
        Original = "backend/services/task"
        NewLocation = "backend/task-service"
    },
    @{
        Original = "backend/utils"
        NewLocation = "backend/shared"
    },
    @{
        Original = "backend/types"
        NewLocation = "backend/shared/types"
    },
    
    # Shared duplicates
    @{
        Original = "shared/components"
        NewLocation = "packages/ui"
    },
    @{
        Original = "shared/utils"
        NewLocation = "packages/shared"
    },
    @{
        Original = "shared/types"
        NewLocation = "packages/shared/types"
    },
    @{
        Original = "backend/database"
        NewLocation = "packages/database"
    },
    @{
        Original = "deployment"
        NewLocation = "infrastructure"
    }
)

# Create a backup before removing anything
$backupDir = "backup_before_cleanup_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
Write-Log "Creating backup directory: $backupDir"
New-Item -Path $backupDir -ItemType Directory -Force | Out-Null

# Function to check if files in original directory exist in new location
function Test-FilesExistInNewLocation {
    param (
        [string]$OriginalDir,
        [string]$NewDir
    )
    
    if (-not (Test-Path $OriginalDir)) {
        return $true # Original directory doesn't exist, so no files to check
    }
    
    if (-not (Test-Path $NewDir)) {
        return $false # New directory doesn't exist, so files can't be there
    }
    
    $originalFiles = Get-ChildItem -Path $OriginalDir -Recurse -File
    foreach ($file in $originalFiles) {
        $relativePath = $file.FullName.Substring($OriginalDir.Length)
        $newFilePath = Join-Path -Path $NewDir -ChildPath $relativePath
        
        if (-not (Test-Path $newFilePath)) {
            Write-Log "File not found in new location: $newFilePath" "WARNING"
            return $false
        }
    }
    
    return $true
}

# Count of removed directories
$removedDirs = 0
$skippedDirs = 0

# Process each directory to clean up
foreach ($dir in $directoriesToClean) {
    $originalDir = $dir.Original
    $newDir = $dir.NewLocation
    
    Write-Log "Checking directory: $originalDir -> $newDir"
    
    if (-not (Test-Path $originalDir)) {
        Write-Log "Original directory does not exist: $originalDir" "INFO"
        continue
    }
    
    # Check if all files exist in the new location
    $allFilesExist = Test-FilesExistInNewLocation -OriginalDir $originalDir -NewDir $newDir
    
    if ($allFilesExist) {
        # Backup the directory before removing
        $backupPath = Join-Path -Path $backupDir -ChildPath $originalDir
        $backupParent = Split-Path -Path $backupPath -Parent
        
        if (-not (Test-Path $backupParent)) {
            New-Item -Path $backupParent -ItemType Directory -Force | Out-Null
        }
        
        Write-Log "Backing up directory: $originalDir -> $backupPath"
        Copy-Item -Path $originalDir -Destination $backupPath -Recurse -Force
        
        # Remove the original directory
        Write-Log "Removing duplicate directory: $originalDir"
        Remove-Item -Path $originalDir -Recurse -Force
        $removedDirs++
    } else {
        Write-Log "Skipping removal of $originalDir - not all files exist in new location" "WARNING"
        $skippedDirs++
    }
}

Write-Log "Duplicate removal completed. Removed $removedDirs directories, skipped $skippedDirs directories."
Write-Log "Backup of removed directories is available at: $backupDir"
