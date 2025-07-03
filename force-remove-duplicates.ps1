# Force removal of duplicate frontend and backend folders

$rootDir = "."
$backupDir = "final_cleanup_backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')"

# Create a backup directory
New-Item -ItemType Directory -Path $backupDir | Out-Null
Write-Host "Created backup directory: $backupDir" -ForegroundColor Cyan

# Function to safely move items to backup
function Backup-Item {
    param (
        [string]$source,
        [string]$type
    )
    
    if (-not (Test-Path $source)) {
        return $false
    }
    
    $backupPath = Join-Path $backupDir $type
    
    try {
        Write-Host "Backing up $type from $source to $backupPath" -ForegroundColor Yellow
        
        # Create the backup directory if it doesn't exist
        if (-not (Test-Path (Split-Path $backupPath -Parent))) {
            New-Item -ItemType Directory -Path (Split-Path $backupPath -Parent) -Force | Out-Null
        }
        
        # Use robocopy to move the directory
        $robocopyLog = "$backupDir\${type}_backup_$(Get-Date -Format 'yyyyMMdd_HHmmss').log"
        $robocopyCmd = "robocopy \"$source\" \"$backupPath\" /E /MOVE /COPYALL /R:1 /W:1 /NP /LOG+:\"$robocopyCmd\""
        
        # Execute robocopy
        $robocopyResult = Start-Process -FilePath "robocopy.exe" -ArgumentList @("\"$source\"", "\"$backupPath\"", "/E", "/MOVE", "/COPYALL", "/R:1", "/W:1", "/NP", "/LOG+:$robocopyLog") -Wait -NoNewWindow -PassThru
        
        # Check if the source still exists and force remove if needed
        if (Test-Path $source) {
            Write-Host "Robocopy failed to move $type, attempting force remove..." -ForegroundColor Yellow
            Remove-Item -Path $source -Recurse -Force -ErrorAction SilentlyContinue
        }
        
        return $true
    } catch {
        Write-Host "Error backing up $type : $_" -ForegroundColor Red
        return $false
    }
}

# Process backend folders
$appsBackend = Join-Path $rootDir "apps\backend"
$rootBackend = Join-Path $rootDir "backend"

# If both exist, keep the one in root and backup the one in apps
if ((Test-Path $appsBackend) -and (Test-Path $rootBackend)) {
    Write-Host "Found duplicate backend folders" -ForegroundColor Yellow
    
    # Backup the apps backend
    if (Backup-Item -source $appsBackend -type "backend") {
        Write-Host "Successfully backed up and removed duplicate backend from apps" -ForegroundColor Green
    } else {
        Write-Host "Failed to backup and remove duplicate backend from apps" -ForegroundColor Red
    }
}

# Process frontend folders
$appsFrontend = Join-Path $rootDir "apps\frontend"
$rootFrontend = Join-Path $rootDir "frontend"

# If both exist, keep the one in root and backup the one in apps
if ((Test-Path $appsFrontend) -and (Test-Path $rootFrontend)) {
    Write-Host "Found duplicate frontend folders" -ForegroundColor Yellow
    
    # Backup the apps frontend
    if (Backup-Item -source $appsFrontend -type "frontend") {
        Write-Host "Successfully backed up and removed duplicate frontend from apps" -ForegroundColor Green
    } else {
        Write-Host "Failed to backup and remove duplicate frontend from apps" -ForegroundColor Red
    }
}

# Remove empty apps directory if it exists
$appsDir = Join-Path $rootDir "apps"
if (Test-Path $appsDir) {
    $items = Get-ChildItem -Path $appsDir -Force
    if ($items.Count -eq 0) {
        Write-Host "Removing empty apps directory..." -ForegroundColor Cyan
        Remove-Item -Path $appsDir -Force -ErrorAction SilentlyContinue
        Write-Host "Removed empty apps directory" -ForegroundColor Green
    } else {
        Write-Host "Apps directory is not empty. Contents:" -ForegroundColor Yellow
        Get-ChildItem -Path $appsDir | Format-Table Name, LastWriteTime
    }
}

# Show final project structure
Write-Host "`nFinal project structure:" -ForegroundColor Cyan
Get-ChildItem -Directory | Select-Object Name, LastWriteTime | Format-Table -AutoSize

Write-Host "`nCleanup complete. Backups are available in: $backupDir" -ForegroundColor Green
Write-Host "Please verify the project structure and test the application." -ForegroundColor Yellow
