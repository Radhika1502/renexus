# Script to consolidate duplicate frontend and backend folders

$rootDir = "."
$backupDir = "temp_consolidation_backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')"

# Create a backup directory
New-Item -ItemType Directory -Path $backupDir | Out-Null
Write-Host "Created backup directory: $backupDir" -ForegroundColor Cyan

# Function to safely move and merge directories
function Move-And-Merge-Directory {
    param (
        [string]$source,
        [string]$destination,
        [string]$type
    )
    
    if (-not (Test-Path $source)) {
        Write-Host "Source $type directory not found: $source" -ForegroundColor Yellow
        return
    }
    
    Write-Host "`nProcessing $type..." -ForegroundColor Cyan
    Write-Host "Source: $source"
    Write-Host "Destination: $destination"
    
    # If destination exists, back it up first
    if (Test-Path $destination) {
        $backupPath = Join-Path $backupDir (Split-Path $destination -Leaf)
        Write-Host "Backing up existing $type to: $backupPath" -ForegroundColor Yellow
        
        try {
            # Create the backup directory if it doesn't exist
            if (-not (Test-Path (Split-Path $backupPath -Parent))) {
                New-Item -ItemType Directory -Path (Split-Path $backupPath -Parent) -Force | Out-Null
            }
            
            # Copy the existing destination to backup
            robocopy $destination $backupPath /E /MOVE /COPYALL /R:1 /W:1 /NP /LOG+:"$backupDir\backup_${type}_$(Get-Date -Format 'yyyyMMdd_HHmmss').log"
            
            # Verify backup was successful
            if (Test-Path $backupPath) {
                Write-Host "Successfully backed up existing $type" -ForegroundColor Green
            } else {
                Write-Host "Warning: Backup of $type may have failed" -ForegroundColor Yellow
            }
        } catch {
            Write-Host "Error backing up $type : $_" -ForegroundColor Red
            return
        }
    }
    
    # Move the source to destination
    try {
        Write-Host "Moving $source to $destination..." -ForegroundColor Cyan
        
        # Create parent directory if it doesn't exist
        $parentDir = Split-Path $destination -Parent
        if (-not (Test-Path $parentDir)) {
            New-Item -ItemType Directory -Path $parentDir -Force | Out-Null
        }
        
        # If destination exists, remove it first
        if (Test-Path $destination) {
            Remove-Item -Path $destination -Recurse -Force -ErrorAction Stop
        }
        
        # Move the directory
        Move-Item -Path $source -Destination $destination -Force -ErrorAction Stop
        
        Write-Host "Successfully moved $type" -ForegroundColor Green
    } catch {
        Write-Host "Error moving $type : $_" -ForegroundColor Red
    }
}

# Process backend folders
$appsBackend = Join-Path $rootDir "apps\backend"
$rootBackend = Join-Path $rootDir "backend"

# Determine which backend to keep (prefer the one in the root)
if (Test-Path $rootBackend) {
    # Keep the root backend, remove the one in apps
    if (Test-Path $appsBackend) {
        Write-Host "`nRemoving duplicate backend from apps directory..." -ForegroundColor Cyan
        Remove-Item -Path $appsBackend -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "Removed duplicate backend from apps directory" -ForegroundColor Green
    }
} elseif (Test-Path $appsBackend) {
    # Move the backend from apps to root
    Move-And-Merge-Directory -source $appsBackend -destination $rootBackend -type "backend"
}

# Process frontend folders
$appsFrontend = Join-Path $rootDir "apps\frontend"
$rootFrontend = Join-Path $rootDir "frontend"

# Determine which frontend to keep (prefer the one in the root)
if (Test-Path $rootFrontend) {
    # Keep the root frontend, remove the one in apps
    if (Test-Path $appsFrontend) {
        Write-Host "`nRemoving duplicate frontend from apps directory..." -ForegroundColor Cyan
        Remove-Item -Path $appsFrontend -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "Removed duplicate frontend from apps directory" -ForegroundColor Green
    }
} elseif (Test-Path $appsFrontend) {
    # Move the frontend from apps to root
    Move-And-Merge-Directory -source $appsFrontend -destination $rootFrontend -type "frontend"
}

# Remove empty apps directory if it exists
$appsDir = Join-Path $rootDir "apps"
if (Test-Path $appsDir) {
    $items = Get-ChildItem -Path $appsDir -Force
    if ($items.Count -eq 0) {
        Write-Host "`nRemoving empty apps directory..." -ForegroundColor Cyan
        Remove-Item -Path $appsDir -Force
        Write-Host "Removed empty apps directory" -ForegroundColor Green
    } else {
        Write-Host "`nApps directory is not empty. Contents:" -ForegroundColor Yellow
        Get-ChildItem -Path $appsDir | Format-Table Name, LastWriteTime
    }
}

# Show final project structure
Write-Host "`nFinal project structure:" -ForegroundColor Cyan
Get-ChildItem -Directory | Select-Object Name, LastWriteTime | Format-Table -AutoSize

Write-Host "`nConsolidation complete. Backup is available in: $backupDir" -ForegroundColor Green
Write-Host "Please verify the project structure and test the application." -ForegroundColor Yellow
