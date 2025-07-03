# Simple script to remove duplicate frontend and backend folders from the apps directory

$rootDir = "."
$backupDir = "final_cleanup_$(Get-Date -Format 'yyyyMMdd_HHmmss')"

# Create a backup directory
New-Item -ItemType Directory -Path $backupDir | Out-Null
Write-Host "Created backup directory: $backupDir" -ForegroundColor Cyan

# Function to safely remove a directory
function Remove-DirectorySafely {
    param (
        [string]$path,
        [string]$type
    )
    
    if (-not (Test-Path $path)) {
        Write-Host "$type directory not found: $path" -ForegroundColor Yellow
        return $false
    }
    
    try {
        # First, try to remove the directory normally
        Remove-Item -Path $path -Recurse -Force -ErrorAction Stop
        Write-Host ("Successfully removed {0}: {1}" -f $type, $path) -ForegroundColor Green
        return $true
    } catch {
        Write-Host "Failed to remove $type: $_" -ForegroundColor Red
        return $false
    }
}

# Process backend folders
$appsBackend = Join-Path $rootDir "apps\backend"
$rootBackend = Join-Path $rootDir "backend"

if (Test-Path $appsBackend) {
    Write-Host "Found duplicate backend in apps directory" -ForegroundColor Yellow
    
    # If both exist, keep the one in root
    if (Test-Path $rootBackend) {
        Write-Host "Keeping backend in root, removing from apps..." -ForegroundColor Cyan
        Remove-DirectorySafely -path $appsBackend -type "duplicate backend"
    } else {
        # Move the backend from apps to root
        Write-Host "Moving backend from apps to root..." -ForegroundColor Cyan
        Move-Item -Path $appsBackend -Destination $rootBackend -Force -ErrorAction SilentlyContinue
        if (Test-Path $rootBackend) {
            Write-Host "Moved backend to root directory" -ForegroundColor Green
        } else {
            Write-Host "Failed to move backend to root" -ForegroundColor Red
        }
    }
}

# Process frontend folders
$appsFrontend = Join-Path $rootDir "apps\frontend"
$rootFrontend = Join-Path $rootDir "frontend"

if (Test-Path $appsFrontend) {
    Write-Host "Found duplicate frontend in apps directory" -ForegroundColor Yellow
    
    # If both exist, keep the one in root
    if (Test-Path $rootFrontend) {
        Write-Host "Keeping frontend in root, removing from apps..." -ForegroundColor Cyan
        Remove-DirectorySafely -path $appsFrontend -type "duplicate frontend"
    } else {
        # Move the frontend from apps to root
        Write-Host "Moving frontend from apps to root..." -ForegroundColor Cyan
        Move-Item -Path $appsFrontend -Destination $rootFrontend -Force -ErrorAction SilentlyContinue
        if (Test-Path $rootFrontend) {
            Write-Host "Moved frontend to root directory" -ForegroundColor Green
        } else {
            Write-Host "Failed to move frontend to root" -ForegroundColor Red
        }
    }
}

# Remove empty apps directory if it exists
$appsDir = Join-Path $rootDir "apps"
if (Test-Path $appsDir) {
    $items = Get-ChildItem -Path $appsDir -Force -ErrorAction SilentlyContinue
    if ($items -eq $null -or $items.Count -eq 0) {
        Write-Host "Removing empty apps directory..." -ForegroundColor Cyan
        Remove-Item -Path $appsDir -Force -ErrorAction SilentlyContinue
        if (-not (Test-Path $appsDir)) {
            Write-Host "Removed empty apps directory" -ForegroundColor Green
        } else {
            Write-Host "Failed to remove apps directory" -ForegroundColor Red
        }
    } else {
        Write-Host "Apps directory is not empty. Contents:" -ForegroundColor Yellow
        Get-ChildItem -Path $appsDir -Force -ErrorAction SilentlyContinue | Format-Table Name, LastWriteTime
    }
}

# Show final project structure
Write-Host "`nFinal project structure:" -ForegroundColor Cyan
Get-ChildItem -Directory | Select-Object Name, LastWriteTime | Format-Table -AutoSize

Write-Host "`nCleanup complete. Please verify the project structure and test the application." -ForegroundColor Green
