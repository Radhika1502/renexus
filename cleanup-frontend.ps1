# Script to safely remove duplicate frontend folders after consolidation
$ErrorActionPreference = "Stop"

# Define directories to remove
$foldersToRemove = @(
    "c:\Users\HP\Renexus\frontend\components",
    "c:\Users\HP\Renexus\frontend\pages",
    "c:\Users\HP\Renexus\frontend\services",
    "c:\Users\HP\Renexus\frontend\types",
    "c:\Users\HP\Renexus\frontend\utils",
    "c:\Users\HP\Renexus\frontend\public"
)

# Create backup directory with timestamp
$backupDir = "c:\Users\HP\Renexus\frontend-duplicates-backup-$(Get-Date -Format 'yyyyMMdd_HHmmss')"
New-Item -Path $backupDir -ItemType Directory -Force | Out-Null

Write-Host "Creating backup of folders to: $backupDir" -ForegroundColor Cyan

# Backup each folder before removal
foreach ($folder in $foldersToRemove) {
    if (Test-Path $folder) {
        $folderName = Split-Path $folder -Leaf
        $backupPath = Join-Path $backupDir $folderName
        
        Write-Host "  Backing up $folderName..." -NoNewline
        try {
            Copy-Item -Path $folder -Destination $backupPath -Recurse -Force -ErrorAction Stop
            Write-Host " ✓" -ForegroundColor Green
        } catch {
            Write-Host " ✗ Error: $_" -ForegroundColor Red
            continue
        }
    }
}

# Verify backup was successful before removing
$backupItems = Get-ChildItem -Path $backupDir -Directory
if ($backupItems.Count -gt 0) {
    Write-Host "`nBackup completed successfully. Proceeding with removal...`n" -ForegroundColor Green
    
    # Remove the original folders
    foreach ($folder in $foldersToRemove) {
        if (Test-Path $folder) {
            Write-Host "Removing $($folder)..." -NoNewline
            try {
                Remove-Item -Path $folder -Recurse -Force -ErrorAction Stop
                Write-Host " ✓ Removed" -ForegroundColor Green
            } catch {
                Write-Host " ✗ Error removing $($folder): $_" -ForegroundColor Red
            }
        } else {
            Write-Host "$($folder) does not exist, skipping..." -ForegroundColor Yellow
        }
    }
    
    Write-Host "`nCleanup completed. Original folders have been moved to: $backupDir" -ForegroundColor Green
} else {
    Write-Host "`nBackup failed. No folders were removed." -ForegroundColor Red
}
