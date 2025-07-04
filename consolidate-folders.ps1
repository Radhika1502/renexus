# Consolidate duplicate directories in the Renexus project
$ErrorActionPreference = "Stop"
$backupDir = "backup_before_consolidation_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
$logFile = "directory_consolidation_$(Get-Date -Format 'yyyyMMdd_HHmmss').log"

# Create backup directory
Write-Host "Creating backup directory: $backupDir"
New-Item -Path $backupDir -ItemType Directory -Force | Out-Null

# Helper functions
function Write-Log {
    param (
        [string]$Message
    )
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "$timestamp - $Message" | Out-File -FilePath $logFile -Append
    Write-Host $Message
}

function Backup-Directory {
    param (
        [string]$Path
    )
    
    if (Test-Path $Path) {
        $relativePath = $Path -replace "^\.\\", ""
        $targetPath = Join-Path $backupDir $relativePath
        $targetDir = Split-Path -Path $targetPath -Parent
        
        if (-not (Test-Path $targetDir)) {
            New-Item -Path $targetDir -ItemType Directory -Force | Out-Null
        }
        
        Write-Log "Backing up: $Path -> $targetPath"
        Copy-Item -Path $Path -Destination $targetPath -Recurse -Force
    }
}

function Merge-Directory {
    param (
        [string]$Source,
        [string]$Destination,
        [string]$Label
    )
    
    if (-not (Test-Path $Source)) {
        Write-Log "Source directory does not exist: $Source"
        return
    }
    
    if (-not (Test-Path $Destination)) {
        New-Item -Path $Destination -ItemType Directory -Force | Out-Null
    }
    
    Write-Log "Merging $Label`: $Source -> $Destination"
    
    # Copy all items from source to destination
    Get-ChildItem -Path $Source -Recurse | ForEach-Object {
        $targetPath = $_.FullName -replace [regex]::Escape($Source), $Destination
        
        if ($_.PSIsContainer) {
            if (-not (Test-Path $targetPath)) {
                New-Item -Path $targetPath -ItemType Directory -Force | Out-Null
            }
        } else {
            $targetDir = Split-Path -Path $targetPath -Parent
            if (-not (Test-Path $targetDir)) {
                New-Item -Path $targetDir -ItemType Directory -Force | Out-Null
            }
            
            # If file exists in destination and is different, create backup
            if (Test-Path $targetPath) {
                $sourceContent = Get-Content -Path $_.FullName -Raw -ErrorAction SilentlyContinue
                $targetContent = Get-Content -Path $targetPath -Raw -ErrorAction SilentlyContinue
                
                if ($sourceContent -ne $targetContent) {
                    Copy-Item -Path $targetPath -Destination "$targetPath.bak" -Force
                    Write-Log "Created backup of different file: $targetPath.bak"
                }
            }
            
            Copy-Item -Path $_.FullName -Destination $targetPath -Force
        }
    }
}

# 1. Backup all directories that will be modified
Write-Log "Backing up directories before consolidation..."
Backup-Directory -Path ".\backend\api"
Backup-Directory -Path ".\backend\api-gateway"
Backup-Directory -Path ".\backend\database"
Backup-Directory -Path ".\packages\database"
Backup-Directory -Path ".\backend\packages"
Backup-Directory -Path ".\frontend\backup_duplicates"
Backup-Directory -Path ".\frontend\web"
Backup-Directory -Path ".\shared"
Backup-Directory -Path ".\packages\shared"

# 2. Consolidate backend API directories
Write-Log "Consolidating backend API directories..."
if ((Test-Path ".\backend\api") -and (Test-Path ".\backend\api-gateway")) {
    Merge-Directory -Source ".\backend\api" -Destination ".\backend\api-gateway" -Label "backend API"
    
    # Create symbolic link for backward compatibility
    if (Test-Path ".\backend\api") {
        Remove-Item -Path ".\backend\api" -Recurse -Force
    }
    cmd /c mklink /D ".\backend\api" ".\backend\api-gateway"
}

# 3. Consolidate database directories
Write-Log "Consolidating database directories..."
if ((Test-Path ".\backend\database") -and (Test-Path ".\packages\database")) {
    Merge-Directory -Source ".\backend\database" -Destination ".\packages\database" -Label "database"
    
    # Create symbolic link for backward compatibility
    if (Test-Path ".\backend\database") {
        Remove-Item -Path ".\backend\database" -Recurse -Force
    }
    cmd /c mklink /D ".\backend\database" ".\packages\database"
}

# 4. Move backend/packages to root packages
Write-Log "Moving backend packages to root packages..."
if (Test-Path ".\backend\packages") {
    Merge-Directory -Source ".\backend\packages" -Destination ".\packages" -Label "packages"
    
    if (Test-Path ".\backend\packages") {
        Remove-Item -Path ".\backend\packages" -Recurse -Force
    }
}

# 5. Consolidate frontend duplicates
Write-Log "Consolidating frontend duplicates..."
if (Test-Path ".\frontend\backup_duplicates") {
    # Components
    if (Test-Path ".\frontend\backup_duplicates\components") {
        Merge-Directory -Source ".\frontend\backup_duplicates\components" -Destination ".\frontend\web\src\components" -Label "frontend components"
    }
    
    # Pages
    if (Test-Path ".\frontend\backup_duplicates\pages") {
        Merge-Directory -Source ".\frontend\backup_duplicates\pages" -Destination ".\frontend\web\pages" -Label "frontend pages"
    }
    
    # Services
    if (Test-Path ".\frontend\backup_duplicates\services") {
        Merge-Directory -Source ".\frontend\backup_duplicates\services" -Destination ".\frontend\web\src\services" -Label "frontend services"
    }
    
    # Types
    if (Test-Path ".\frontend\backup_duplicates\types") {
        Merge-Directory -Source ".\frontend\backup_duplicates\types" -Destination ".\frontend\web\src\types" -Label "frontend types"
    }
    
    # Public
    if (Test-Path ".\frontend\backup_duplicates\public") {
        Merge-Directory -Source ".\frontend\backup_duplicates\public" -Destination ".\frontend\web\public" -Label "frontend public"
    }
    
    # Remove backup_duplicates directory
    if (Test-Path ".\frontend\backup_duplicates") {
        Remove-Item -Path ".\frontend\backup_duplicates" -Recurse -Force
    }
}

# 6. Consolidate shared directories
Write-Log "Consolidating shared directories..."
if ((Test-Path ".\shared") -and (Test-Path ".\packages\shared")) {
    # Config
    if (Test-Path ".\shared\config") {
        Merge-Directory -Source ".\shared\config" -Destination ".\packages\shared\config" -Label "shared config"
    }
    
    # Services
    if (Test-Path ".\shared\services") {
        Merge-Directory -Source ".\shared\services" -Destination ".\packages\shared\services" -Label "shared services"
    }
    
    # Types
    if (Test-Path ".\shared\types") {
        Merge-Directory -Source ".\shared\types" -Destination ".\packages\shared\types" -Label "shared types"
    }
    
    # Utils
    if (Test-Path ".\shared\utils") {
        Merge-Directory -Source ".\shared\utils" -Destination ".\packages\shared\utils" -Label "shared utils"
    }
    
    # Create symbolic link for backward compatibility
    if (Test-Path ".\shared") {
        Remove-Item -Path ".\shared" -Recurse -Force
    }
    cmd /c mklink /D ".\shared" ".\packages\shared"
}

# 7. Fix import paths in test files
Write-Log "Fixing import paths in test files..."
$testFiles = Get-ChildItem -Path ".\tests" -Recurse -Include "*.ts", "*.tsx", "*.js", "*.jsx"

foreach ($file in $testFiles) {
    $content = Get-Content -Path $file.FullName -Raw
    $modified = $false
    
    # Update database imports
    if ($content -match "../../database/db" -or $content -match "../database/db") {
        $content = $content -replace "../../database/db", "../../packages/database/db"
        $content = $content -replace "../database/db", "../packages/database/db"
        $modified = $true
    }
    
    # Update schema imports
    if ($content -match "../../database/schema" -or $content -match "../database/schema") {
        $content = $content -replace "../../database/schema", "../../packages/database/schema"
        $content = $content -replace "../database/schema", "../packages/database/schema"
        $modified = $true
    }
    
    # Update API gateway imports
    if ($content -match "../../api/gateway") {
        $content = $content -replace "../../api/gateway", "../../backend/api-gateway/gateway"
        $modified = $true
    }
    
    # Update auth guard imports
    if ($content -match "../../apps/api/src/auth/auth.guard") {
        $content = $content -replace "../../apps/api/src/auth/auth.guard", "../../backend/api-gateway/src/auth/auth.guard"
        $modified = $true
    }
    
    # Update middleware imports
    if ($content -match "../../middleware/auth") {
        $content = $content -replace "../../middleware/auth", "../../backend/middleware/auth"
        $modified = $true
    }
    
    # Update project routes imports
    if ($content -match "../../services/projects/project.routes") {
        $content = $content -replace "../../services/projects/project.routes", "../../backend/services/projects/project.routes"
        $modified = $true
    }
    
    if ($modified) {
        Write-Log "Updated import paths in: $($file.FullName)"
        Set-Content -Path $file.FullName -Value $content
    }
}

Write-Log "Directory consolidation completed successfully!"
Write-Log "Backup of original directories is available at: $backupDir"
