# Script to remove duplicate files from original locations
Write-Host "Preparing to remove duplicate files..." -ForegroundColor Cyan

# Create backup directory
$backupDir = "backup-original-files-$(Get-Date -Format 'yyyyMMdd_HHmmss')"
New-Item -Path $backupDir -ItemType Directory | Out-Null
Write-Host "Created backup directory: $backupDir" -ForegroundColor Green

# Define directories to check for duplicates
$duplicateDirs = @(
    "frontend/components",
    "frontend/hooks",
    "frontend/services",
    "frontend/utils",
    "frontend/types",
    "backend/services/task",
    "backend/api",
    "shared"
)

# Process each directory
foreach ($dir in $duplicateDirs) {
    if (Test-Path $dir) {
        Write-Host "Processing directory: $dir" -ForegroundColor Yellow
        
        # Create backup of the directory
        $backupPath = Join-Path -Path $backupDir -ChildPath $dir
        $parentDir = Split-Path -Path $backupPath -Parent
        
        if (-not (Test-Path $parentDir)) {
            New-Item -Path $parentDir -ItemType Directory -Force | Out-Null
        }
        
        Copy-Item -Path $dir -Destination $backupPath -Recurse -Force
        Write-Host "  Backed up: $dir to $backupPath" -ForegroundColor Green
        
        # Ask for confirmation before removing
        $confirmation = Read-Host "Do you want to remove the duplicate directory '$dir'? (y/n)"
        if ($confirmation -eq "y") {
            Remove-Item -Path $dir -Recurse -Force
            Write-Host "  Removed: $dir" -ForegroundColor Green
        } else {
            Write-Host "  Skipped removal of: $dir" -ForegroundColor Yellow
        }
    } else {
        Write-Host "Directory not found: $dir" -ForegroundColor Yellow
    }
}

Write-Host "`nDuplicate file removal process completed." -ForegroundColor Green
Write-Host "Backup of original files is available at: $backupDir" -ForegroundColor Green
