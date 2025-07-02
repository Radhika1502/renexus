# Safely remove duplicate files from original locations after restructuring
$ErrorActionPreference = "Stop"
$logFile = "duplicate-removal-$(Get-Date -Format 'yyyyMMdd_HHmmss').log"
$backupDir = "backup-original-files-$(Get-Date -Format 'yyyyMMdd_HHmmss')"

function Write-Log {
    param (
        [string]$Message,
        [string]$Level = "INFO"
    )
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "$timestamp [$Level] - $Message" | Out-File -FilePath $logFile -Append
    Write-Host "[$Level] $Message"
}

# Create backup directory
if (-not (Test-Path $backupDir)) {
    New-Item -Path $backupDir -ItemType Directory | Out-Null
    Write-Log "Created backup directory: $backupDir"
}

Write-Log "Starting safe removal of duplicate files..."

# Define directories to check for duplicates
$duplicateDirs = @(
    # Original directories that should now be duplicated in the new structure
    "frontend/components",
    "frontend/hooks",
    "frontend/services",
    "frontend/utils",
    "frontend/types",
    "backend/services/task",
    "backend/api",
    "shared"
)

# Function to check if a file exists in the new structure
function Test-FileExistsInNewStructure {
    param (
        [string]$OriginalPath
    )
    
    $relativePath = $OriginalPath -replace "^\.\\", ""
    
    # Map original paths to new paths
    $newPath = $relativePath
    
    if ($relativePath -match "^frontend/components/(.*)") {
        $newPath = "frontend/web/src/components/$($matches[1])"
    }
    elseif ($relativePath -match "^frontend/hooks/(.*)") {
        $newPath = "frontend/web/src/hooks/$($matches[1])"
    }
    elseif ($relativePath -match "^frontend/services/(.*)") {
        $newPath = "frontend/web/src/services/$($matches[1])"
    }
    elseif ($relativePath -match "^frontend/utils/(.*)") {
        $newPath = "frontend/web/src/utils/$($matches[1])"
    }
    elseif ($relativePath -match "^frontend/types/(.*)") {
        $newPath = "frontend/web/src/types/$($matches[1])"
    }
    elseif ($relativePath -match "^backend/services/task/(.*)") {
        $newPath = "backend/task-service/$($matches[1])"
    }
    elseif ($relativePath -match "^backend/api/(.*)") {
        $newPath = "backend/api-gateway/$($matches[1])"
    }
    elseif ($relativePath -match "^shared/(.*)") {
        $newPath = "packages/shared/$($matches[1])"
    }
    
    return (Test-Path $newPath)
}

# Process each directory
foreach ($dir in $duplicateDirs) {
    if (Test-Path $dir) {
        Write-Log "Processing directory: $dir"
        
        # Create backup of the directory
        $backupPath = Join-Path -Path $backupDir -ChildPath $dir
        $parentDir = Split-Path -Path $backupPath -Parent
        
        if (-not (Test-Path $parentDir)) {
            New-Item -Path $parentDir -ItemType Directory -Force | Out-Null
        }
        
        Copy-Item -Path $dir -Destination $backupPath -Recurse -Force
        Write-Log "Created backup of $dir at $backupPath"
        
        # Get all files in the directory
        $files = Get-ChildItem -Path $dir -Recurse -File
        
        foreach ($file in $files) {
            $originalPath = $file.FullName
            $relativePath = $originalPath -replace [regex]::Escape((Get-Location)), "."
            
            # Check if file exists in new structure
            if (Test-FileExistsInNewStructure -OriginalPath $relativePath) {
                Write-Log "File exists in new structure: $relativePath - Safe to remove"
            }
            else {
                Write-Log "File NOT found in new structure: $relativePath - Will NOT remove" "WARNING"
                continue
            }
        }
        
        # Ask for confirmation before removing
        $confirmation = Read-Host "Do you want to remove the duplicate directory '$dir'? (y/n)"
        if ($confirmation -eq "y") {
            Remove-Item -Path $dir -Recurse -Force
            Write-Log "Removed duplicate directory: $dir" "SUCCESS"
        }
        else {
            Write-Log "Skipped removal of directory: $dir" "INFO"
        }
    }
    else {
        Write-Log "Directory not found: $dir" "INFO"
    }
}

Write-Log "Duplicate file removal process completed."
Write-Log "Backup of original files is available at: $backupDir"
Write-Host "`nDuplicate file removal completed. Backup is available at: $backupDir" -ForegroundColor Green
