# Complete Directory Consolidation Script for Renexus Project
# Task 2.1 - Final consolidation of duplicate directories

$ErrorActionPreference = "Stop"
$rootDir = "."
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupDir = "backup_final_consolidation_$timestamp"
$logFile = "consolidation_log_$timestamp.txt"

function Write-Log {
    param(
        [string]$Message,
        [string]$Level = "INFO"
    )
    $logEntry = "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') [$Level] $Message"
    Write-Host $logEntry
    Add-Content -Path $logFile -Value $logEntry
}

function Backup-Directory {
    param(
        [string]$SourcePath,
        [string]$BackupName
    )
    
    if (Test-Path $SourcePath) {
        $backupPath = Join-Path $backupDir $BackupName
        Write-Log "Backing up $SourcePath to $backupPath"
        Copy-Item -Path $SourcePath -Destination $backupPath -Recurse -Force
        return $true
    }
    return $false
}

function Merge-Directories {
    param(
        [string]$SourcePath,
        [string]$TargetPath,
        [string]$Description
    )
    
    if (-not (Test-Path $SourcePath)) {
        Write-Log "Source directory does not exist: $SourcePath" "WARNING"
        return $false
    }
    
    if (-not (Test-Path $TargetPath)) {
        Write-Log "Creating target directory: $TargetPath"
        New-Item -Path $TargetPath -ItemType Directory -Force | Out-Null
    }
    
    Write-Log "Merging $Description`: $SourcePath -> $TargetPath"
    
    try {
        # Copy all items from source to target
        Get-ChildItem -Path $SourcePath -Recurse | ForEach-Object {
            $relativePath = $_.FullName.Substring($SourcePath.Length + 1)
            $targetItemPath = Join-Path $TargetPath $relativePath
            
            if ($_.PSIsContainer) {
                if (-not (Test-Path $targetItemPath)) {
                    New-Item -Path $targetItemPath -ItemType Directory -Force | Out-Null
                }
            } else {
                $targetDir = Split-Path $targetItemPath -Parent
                if (-not (Test-Path $targetDir)) {
                    New-Item -Path $targetDir -ItemType Directory -Force | Out-Null
                }
                
                # Check if file exists and is different
                if (Test-Path $targetItemPath) {
                    $sourceHash = Get-FileHash -Path $_.FullName -Algorithm MD5
                    $targetHash = Get-FileHash -Path $targetItemPath -Algorithm MD5
                    
                    if ($sourceHash.Hash -ne $targetHash.Hash) {
                        # Create backup of target file
                        Copy-Item -Path $targetItemPath -Destination "$targetItemPath.backup" -Force
                        Write-Log "Created backup of conflicting file: $targetItemPath.backup" "WARNING"
                    }
                }
                
                Copy-Item -Path $_.FullName -Destination $targetItemPath -Force
            }
        }
        
        Write-Log "Successfully merged $Description"
        return $true
    } catch {
        Write-Log "Error merging $Description`: $_" "ERROR"
        return $false
    }
}

function Remove-DirectorySafely {
    param(
        [string]$DirectoryPath,
        [string]$Description
    )
    
    if (Test-Path $DirectoryPath) {
        try {
            Write-Log "Removing $Description`: $DirectoryPath"
            Remove-Item -Path $DirectoryPath -Recurse -Force
            Write-Log "Successfully removed $Description"
            return $true
        } catch {
            Write-Log "Error removing $Description`: $_" "ERROR"
            return $false
        }
    } else {
        Write-Log "$Description does not exist: $DirectoryPath" "INFO"
        return $true
    }
}

# Create backup directory
Write-Log "Creating backup directory: $backupDir"
New-Item -Path $backupDir -ItemType Directory -Force | Out-Null

# 1. Consolidate backend/database with packages/database
Write-Log "=== Step 1: Consolidating database directories ===" "INFO"
$backendDb = "backend\database"
$packagesDb = "packages\database"

if ((Test-Path $backendDb) -and (Test-Path $packagesDb)) {
    Backup-Directory -SourcePath $backendDb -BackupName "backend_database"
    Merge-Directories -SourcePath $backendDb -TargetPath $packagesDb -Description "database directories"
    Remove-DirectorySafely -DirectoryPath $backendDb -Description "backend/database"
}

# 2. Consolidate backend/packages with root packages
Write-Log "=== Step 2: Consolidating packages directories ===" "INFO"
$backendPackages = "backend\packages"
$rootPackages = "packages"

if (Test-Path $backendPackages) {
    Backup-Directory -SourcePath $backendPackages -BackupName "backend_packages"
    Merge-Directories -SourcePath $backendPackages -TargetPath $rootPackages -Description "packages directories"
    Remove-DirectorySafely -DirectoryPath $backendPackages -Description "backend/packages"
}

# 3. Consolidate shared directories
Write-Log "=== Step 3: Consolidating shared directories ===" "INFO"
$rootShared = "shared"
$packagesShared = "packages\shared"

if ((Test-Path $rootShared) -and (Test-Path $packagesShared)) {
    Backup-Directory -SourcePath $rootShared -BackupName "root_shared"
    Merge-Directories -SourcePath $rootShared -TargetPath $packagesShared -Description "shared directories"
    Remove-DirectorySafely -DirectoryPath $rootShared -Description "root shared"
}

# 4. Consolidate services directories
Write-Log "=== Step 4: Consolidating services directories ===" "INFO"
$rootServices = "services"
$backendServices = "backend\services"

if ((Test-Path $rootServices) -and (Test-Path $backendServices)) {
    Backup-Directory -SourcePath $rootServices -BackupName "root_services"
    Merge-Directories -SourcePath $rootServices -TargetPath $backendServices -Description "services directories"
    Remove-DirectorySafely -DirectoryPath $rootServices -Description "root services"
}

# 5. Consolidate config directories
Write-Log "=== Step 5: Consolidating config directories ===" "INFO"
$rootConfig = "config"
$backendConfig = "backend\config"

if ((Test-Path $rootConfig) -and (Test-Path $backendConfig)) {
    Backup-Directory -SourcePath $rootConfig -BackupName "root_config"
    Merge-Directories -SourcePath $rootConfig -TargetPath $backendConfig -Description "config directories"
    Remove-DirectorySafely -DirectoryPath $rootConfig -Description "root config"
}

# 6. Fix import paths in all TypeScript and JavaScript files
Write-Log "=== Step 6: Fixing import paths ===" "INFO"

$pathMappings = @{
    "../../database/" = "../../packages/database/"
    "../database/" = "../packages/database/"
    "./database/" = "./packages/database/"
    "backend/database/" = "packages/database/"
    "shared/" = "packages/shared/"
    "./shared/" = "./packages/shared/"
    "../shared/" = "../packages/shared/"
    "../../shared/" = "../../packages/shared/"
}

# Find all TypeScript and JavaScript files
$filePatterns = @("*.ts", "*.tsx", "*.js", "*.jsx", "*.json")
$filesToUpdate = @()

foreach ($pattern in $filePatterns) {
    $files = Get-ChildItem -Path $rootDir -Recurse -Include $pattern -File | Where-Object { 
        $_.FullName -notmatch "node_modules" -and 
        $_.FullName -notmatch "backup_" -and
        $_.FullName -notmatch "\.git" -and
        $_.FullName -notmatch "dist" -and
        $_.FullName -notmatch "build"
    }
    $filesToUpdate += $files
}

Write-Log "Found $($filesToUpdate.Count) files to potentially update"

$updatedFiles = 0
foreach ($file in $filesToUpdate) {
    try {
        $content = Get-Content -Path $file.FullName -Raw -ErrorAction Continue
        $originalContent = $content
        
        # Apply all path mappings
        foreach ($oldPath in $pathMappings.Keys) {
            $newPath = $pathMappings[$oldPath]
            $content = $content -replace [regex]::Escape($oldPath), $newPath
        }
        
        # If content changed, update the file
        if ($content -ne $originalContent) {
            Set-Content -Path $file.FullName -Value $content
            Write-Log "Updated import paths in: $($file.FullName)"
            $updatedFiles++
        }
    } catch {
        Write-Log "Error updating file $($file.FullName): $_" "WARNING"
    }
}

Write-Log "Updated import paths in $updatedFiles files"

# 7. Create symbolic links for backward compatibility
Write-Log "=== Step 7: Creating symbolic links for backward compatibility ===" "INFO"

$symlinks = @(
    @{ Source = "backend\database"; Target = "..\packages\database" },
    @{ Source = "shared"; Target = "packages\shared" }
)

foreach ($link in $symlinks) {
    $sourcePath = $link.Source
    $targetPath = $link.Target
    
    if (-not (Test-Path $sourcePath) -and (Test-Path $targetPath)) {
        try {
            Write-Log "Creating symbolic link: $sourcePath -> $targetPath"
            New-Item -Path $sourcePath -ItemType SymbolicLink -Value $targetPath -Force | Out-Null
            Write-Log "Successfully created symbolic link"
        } catch {
            Write-Log "Failed to create symbolic link: $_" "WARNING"
        }
    }
}

# 8. Clean up old backup directories (keep only the 3 most recent)
Write-Log "=== Step 8: Cleaning up old backup directories ===" "INFO"
$backupDirs = Get-ChildItem -Directory | Where-Object { $_.Name -match "^backup_" } | Sort-Object LastWriteTime -Descending

if ($backupDirs.Count -gt 3) {
    $dirsToRemove = $backupDirs | Select-Object -Skip 3
    foreach ($dir in $dirsToRemove) {
        Write-Log "Removing old backup directory: $($dir.Name)"
        Remove-Item -Path $dir.FullName -Recurse -Force
    }
}

Write-Log "=== Directory consolidation completed successfully ===" "SUCCESS"
Write-Log "Backup created at: $backupDir"
Write-Log "Log file created at: $logFile"

# Display final directory structure
Write-Log "=== Final root directory structure ===" "INFO"
Get-ChildItem -Directory | Sort-Object Name | ForEach-Object {
    Write-Log "- $($_.Name)"
} 