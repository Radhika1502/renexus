#!/usr/bin/env pwsh
# Consolidate duplicate directories in the Renexus project

$ErrorActionPreference = "Stop"
$rootDir = $PSScriptRoot
$backupDir = Join-Path $rootDir "backup_before_consolidation_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
$logFile = Join-Path $rootDir "directory_consolidation_$(Get-Date -Format 'yyyyMMdd_HHmmss').log"

function Write-Log {
    param (
        [string]$Message,
        [string]$Level = "INFO"
    )
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "$timestamp [$Level] - $Message" | Out-File -FilePath $logFile -Append
    Write-Host "[$Level] $Message"
}

function Backup-Directory {
    param (
        [string]$Source,
        [string]$RelativePath
    )
    
    if (-not (Test-Path $Source)) {
        Write-Log "Source directory does not exist: $Source" "WARNING"
        return $false
    }
    
    $backupPath = Join-Path $backupDir $RelativePath
    $backupParent = Split-Path -Path $backupPath -Parent
    
    if (-not (Test-Path $backupParent)) {
        New-Item -Path $backupParent -ItemType Directory -Force | Out-Null
    }
    
    try {
        Write-Log "Backing up: $Source -> $backupPath" "INFO"
        Copy-Item -Path $Source -Destination $backupPath -Recurse -Force
        return $true
    } catch {
        Write-Log "Failed to backup directory: $_" "ERROR"
        return $false
    }
}

function Merge-Directories {
    param (
        [string]$Source,
        [string]$Destination,
        [string]$Description
    )
    
    if (-not (Test-Path $Source)) {
        Write-Log "Source directory does not exist: $Source" "WARNING"
        return $false
    }
    
    # Create destination directory if it doesn't exist
    if (-not (Test-Path $Destination)) {
        try {
            Write-Log "Creating destination directory: $Destination" "INFO"
            New-Item -Path $Destination -ItemType Directory -Force | Out-Null
        } catch {
            Write-Log "Failed to create destination directory: $_" "ERROR"
            return $false
        }
    }
    
    # Get relative path for backup
    $relativePath = $Source -replace [regex]::Escape($rootDir), ""
    $relativePath = $relativePath.TrimStart("\", "/")
    
    # Backup the source directory
    if (-not (Backup-Directory -Source $Source -RelativePath $relativePath)) {
        Write-Log "Failed to backup source directory, skipping merge" "ERROR"
        return $false
    }
    
    # Copy all files and directories from source to destination
    try {
        Write-Log "Merging $Description: $Source -> $Destination" "INFO"
        
        # Get all items in the source directory
        $items = Get-ChildItem -Path $Source -Recurse
        
        foreach ($item in $items) {
            # Calculate the relative path from the source root
            $relativePath = $item.FullName.Substring($Source.Length)
            $targetPath = Join-Path -Path $Destination -ChildPath $relativePath
            
            if ($item.PSIsContainer) {
                # Create directory if it doesn't exist
                if (-not (Test-Path $targetPath)) {
                    New-Item -Path $targetPath -ItemType Directory -Force | Out-Null
                }
            } else {
                # Create parent directory if it doesn't exist
                $targetParent = Split-Path -Path $targetPath -Parent
                if (-not (Test-Path $targetParent)) {
                    New-Item -Path $targetParent -ItemType Directory -Force | Out-Null
                }
                
                # Check if file exists in destination
                if (Test-Path $targetPath) {
                    # Compare file contents
                    $sourceContent = Get-Content -Path $item.FullName -Raw -ErrorAction SilentlyContinue
                    $targetContent = Get-Content -Path $targetPath -Raw -ErrorAction SilentlyContinue
                    
                    if ($sourceContent -ne $targetContent) {
                        # Files are different, create a backup with .bak extension
                        Copy-Item -Path $targetPath -Destination "$targetPath.bak" -Force
                        Write-Log "Created backup of different file: $targetPath.bak" "INFO"
                    }
                }
                
                # Copy the file
                Copy-Item -Path $item.FullName -Destination $targetPath -Force
            }
        }
        
        Write-Log "Successfully merged $Description" "SUCCESS"
        return $true
    } catch {
        Write-Log "Failed to merge directories: $_" "ERROR"
        return $false
    }
}

function Remove-DirectorySafely {
    param (
        [string]$Path,
        [string]$Description
    )
    
    if (-not (Test-Path $Path)) {
        Write-Log "$Description directory does not exist: $Path" "WARNING"
        return $true
    }
    
    try {
        Write-Log "Removing $Description directory: $Path" "INFO"
        Remove-Item -Path $Path -Recurse -Force
        Write-Log "Successfully removed $Description directory" "SUCCESS"
        return $true
    } catch {
        Write-Log "Failed to remove directory: $_" "ERROR"
        return $false
    }
}

# Create backup directory
Write-Log "Creating backup directory: $backupDir" "INFO"
New-Item -Path $backupDir -ItemType Directory -Force | Out-Null

# 1. Consolidate backend API directories
$backendApiPath = Join-Path $rootDir "backend/api"
$backendApiGatewayPath = Join-Path $rootDir "backend/api-gateway"

if ((Test-Path $backendApiPath) -and (Test-Path $backendApiGatewayPath)) {
    Write-Log "Found duplicate API directories in backend" "INFO"
    Merge-Directories -Source $backendApiPath -Destination $backendApiGatewayPath -Description "backend API"
    Remove-DirectorySafely -Path $backendApiPath -Description "backend/api"
}

# 2. Consolidate database directories
$backendDbPath = Join-Path $rootDir "backend/database"
$packagesDbPath = Join-Path $rootDir "packages/database"

if ((Test-Path $backendDbPath) -and (Test-Path $packagesDbPath)) {
    Write-Log "Found duplicate database directories" "INFO"
    Merge-Directories -Source $backendDbPath -Destination $packagesDbPath -Description "database"
    Remove-DirectorySafely -Path $backendDbPath -Description "backend/database"
}

# 3. Move backend/packages to root packages if needed
$backendPackagesPath = Join-Path $rootDir "backend/packages"
$rootPackagesPath = Join-Path $rootDir "packages"

if (Test-Path $backendPackagesPath) {
    Write-Log "Found packages directory in backend" "INFO"
    Merge-Directories -Source $backendPackagesPath -Destination $rootPackagesPath -Description "packages"
    Remove-DirectorySafely -Path $backendPackagesPath -Description "backend/packages"
}

# 4. Consolidate frontend duplicates
$frontendBackupDuplicatesPath = Join-Path $rootDir "frontend/backup_duplicates"
$frontendWebPath = Join-Path $rootDir "frontend/web"

if (Test-Path $frontendBackupDuplicatesPath) {
    # Components
    $duplicateComponentsPath = Join-Path $frontendBackupDuplicatesPath "components"
    $webComponentsPath = Join-Path $frontendWebPath "src/components"
    
    if (Test-Path $duplicateComponentsPath) {
        Write-Log "Found duplicate components in frontend" "INFO"
        Merge-Directories -Source $duplicateComponentsPath -Destination $webComponentsPath -Description "frontend components"
    }
    
    # Pages
    $duplicatePagesPath = Join-Path $frontendBackupDuplicatesPath "pages"
    $webPagesPath = Join-Path $frontendWebPath "pages"
    
    if (Test-Path $duplicatePagesPath) {
        Write-Log "Found duplicate pages in frontend" "INFO"
        Merge-Directories -Source $duplicatePagesPath -Destination $webPagesPath -Description "frontend pages"
    }
    
    # Services
    $duplicateServicesPath = Join-Path $frontendBackupDuplicatesPath "services"
    $webServicesPath = Join-Path $frontendWebPath "src/services"
    
    if (Test-Path $duplicateServicesPath) {
        Write-Log "Found duplicate services in frontend" "INFO"
        Merge-Directories -Source $duplicateServicesPath -Destination $webServicesPath -Description "frontend services"
    }
    
    # Types
    $duplicateTypesPath = Join-Path $frontendBackupDuplicatesPath "types"
    $webTypesPath = Join-Path $frontendWebPath "src/types"
    
    if (Test-Path $duplicateTypesPath) {
        Write-Log "Found duplicate types in frontend" "INFO"
        Merge-Directories -Source $duplicateTypesPath -Destination $webTypesPath -Description "frontend types"
    }
    
    # Public
    $duplicatePublicPath = Join-Path $frontendBackupDuplicatesPath "public"
    $webPublicPath = Join-Path $frontendWebPath "public"
    
    if (Test-Path $duplicatePublicPath) {
        Write-Log "Found duplicate public files in frontend" "INFO"
        Merge-Directories -Source $duplicatePublicPath -Destination $webPublicPath -Description "frontend public files"
    }
    
    # Remove the backup_duplicates directory after merging all subdirectories
    Remove-DirectorySafely -Path $frontendBackupDuplicatesPath -Description "frontend/backup_duplicates"
}

# 5. Consolidate shared directories
$sharedPath = Join-Path $rootDir "shared"
$packagesSharedPath = Join-Path $rootDir "packages/shared"

if ((Test-Path $sharedPath) -and (Test-Path $packagesSharedPath)) {
    Write-Log "Found duplicate shared directories" "INFO"
    
    # Config
    $sharedConfigPath = Join-Path $sharedPath "config"
    $packagesSharedConfigPath = Join-Path $packagesSharedPath "config"
    
    if (Test-Path $sharedConfigPath) {
        Write-Log "Merging shared config" "INFO"
        Merge-Directories -Source $sharedConfigPath -Destination $packagesSharedConfigPath -Description "shared config"
    }
    
    # Services
    $sharedServicesPath = Join-Path $sharedPath "services"
    $packagesSharedServicesPath = Join-Path $packagesSharedPath "services"
    
    if (Test-Path $sharedServicesPath) {
        Write-Log "Merging shared services" "INFO"
        Merge-Directories -Source $sharedServicesPath -Destination $packagesSharedServicesPath -Description "shared services"
    }
    
    # Types
    $sharedTypesPath = Join-Path $sharedPath "types"
    $packagesSharedTypesPath = Join-Path $packagesSharedPath "types"
    
    if (Test-Path $sharedTypesPath) {
        Write-Log "Merging shared types" "INFO"
        Merge-Directories -Source $sharedTypesPath -Destination $packagesSharedTypesPath -Description "shared types"
    }
    
    # Utils
    $sharedUtilsPath = Join-Path $sharedPath "utils"
    $packagesSharedUtilsPath = Join-Path $packagesSharedPath "utils"
    
    if (Test-Path $sharedUtilsPath) {
        Write-Log "Merging shared utils" "INFO"
        Merge-Directories -Source $sharedUtilsPath -Destination $packagesSharedUtilsPath -Description "shared utils"
    }
    
    # Remove the shared directory after merging all subdirectories
    Remove-DirectorySafely -Path $sharedPath -Description "shared"
}

# 6. Fix import paths in test files
Write-Log "Updating import paths in test files" "INFO"

# Create a function to update import paths in files
function Update-ImportPaths {
    param (
        [string]$Directory,
        [hashtable]$PathMappings
    )
    
    if (-not (Test-Path $Directory)) {
        Write-Log "Directory does not exist: $Directory" "WARNING"
        return
    }
    
    $files = Get-ChildItem -Path $Directory -Recurse -File -Include "*.ts", "*.tsx", "*.js", "*.jsx"
    
    foreach ($file in $files) {
        $content = Get-Content -Path $file.FullName -Raw
        $originalContent = $content
        $modified = $false
        
        foreach ($oldPath in $PathMappings.Keys) {
            $newPath = $PathMappings[$oldPath]
            
            # Replace import statements
            $pattern = "(?m)^(import\s+(?:[\w\s{},*]+\s+from\s+['\`"])$oldPath)(['\`"])"
            $replacement = "`$1$newPath`$2"
            $content = $content -replace $pattern, $replacement
            
            # Replace require statements
            $pattern = "(?m)(require\(['\`"])$oldPath(['\`"])\)"
            $replacement = "`$1$newPath`$2)"
            $content = $content -replace $pattern, $replacement
            
            # Replace jest.mock statements
            $pattern = "(?m)(jest\.mock\(['\`"])$oldPath(['\`"])"
            $replacement = "`$1$newPath`$2"
            $content = $content -replace $pattern, $replacement
        }
        
        if ($content -ne $originalContent) {
            Write-Log "Updating import paths in: $($file.FullName)" "INFO"
            Set-Content -Path $file.FullName -Value $content
            $modified = $true
        }
    }
}

# Define path mappings (old path -> new path)
$pathMappings = @{
    "../../database/db" = "../../packages/database/db"
    "../../services/projects/project.routes" = "../../backend/services/projects/project.routes"
    "../../apps/api/src/auth/auth.guard" = "../../backend/api-gateway/src/auth/auth.guard"
    "../../api/gateway" = "../../backend/api-gateway/gateway"
    "../database/db" = "../packages/database/db"
    "../database/schema" = "../packages/database/schema"
    "../../middleware/auth" = "../../backend/middleware/auth"
}

# Update paths in test files
Update-ImportPaths -Directory (Join-Path $rootDir "tests") -PathMappings $pathMappings

# Create symbolic links for backward compatibility
Write-Log "Creating symbolic links for backward compatibility" "INFO"

# Function to create a symbolic link
function Create-SymbolicLink {
    param (
        [string]$Source,
        [string]$Target
    )
    
    if (Test-Path $Source) {
        Write-Log "Source already exists, skipping symbolic link: $Source" "WARNING"
        return
    }
    
    if (-not (Test-Path $Target)) {
        Write-Log "Target does not exist, skipping symbolic link: $Target" "WARNING"
        return
    }
    
    try {
        $sourceParent = Split-Path -Path $Source -Parent
        if (-not (Test-Path $sourceParent)) {
            New-Item -Path $sourceParent -ItemType Directory -Force | Out-Null
        }
        
        Write-Log "Creating symbolic link: $Source -> $Target" "INFO"
        New-Item -Path $Source -ItemType SymbolicLink -Value $Target -Force | Out-Null
        Write-Log "Successfully created symbolic link" "SUCCESS"
    } catch {
        Write-Log "Failed to create symbolic link: $_" "ERROR"
    }
}

# Create symbolic links for backward compatibility
Create-SymbolicLink -Source (Join-Path $rootDir "backend/database") -Target (Join-Path $rootDir "packages/database")
Create-SymbolicLink -Source (Join-Path $rootDir "backend/api") -Target (Join-Path $rootDir "backend/api-gateway")
Create-SymbolicLink -Source (Join-Path $rootDir "shared") -Target (Join-Path $rootDir "packages/shared")

Write-Log "Directory consolidation completed" "SUCCESS"
Write-Log "Backup of original directories is available at: $backupDir" "INFO"

# Display final directory structure
Write-Log "Final directory structure:" "INFO"
Get-ChildItem -Path $rootDir -Directory | ForEach-Object {
    Write-Log "- $_" "INFO"
} 