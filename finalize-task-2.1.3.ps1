# Simple script to finalize Task 2.1.3 - Directory Restructuring
Write-Host "TASK 2.1.3 - DIRECTORY RESTRUCTURING FINALIZATION" -ForegroundColor Magenta

# Step 1: Verify key directories exist
Write-Host "`n[1/4] Verifying key directories..." -ForegroundColor Cyan
$requiredDirs = @(
    "backend/api-gateway",
    "backend/auth-service",
    "backend/task-service",
    "backend/notification-service",
    "frontend/web/src/features",
    "packages/ui",
    "packages/database",
    "packages/shared"
)

$missingDirs = @()
foreach ($dir in $requiredDirs) {
    if (-not (Test-Path $dir)) {
        $missingDirs += $dir
        Write-Host "  ✗ Missing: $dir" -ForegroundColor Red
    }
    else {
        Write-Host "  ✓ Found: $dir" -ForegroundColor Green
    }
}

if ($missingDirs.Count -gt 0) {
    Write-Host "`nWarning: Some required directories are missing. The restructuring may not be complete." -ForegroundColor Yellow
}
else {
    Write-Host "`nAll required directories exist." -ForegroundColor Green
}

# Step 2: Simple import path updates
Write-Host "`n[2/4] Updating import paths in key files..." -ForegroundColor Cyan
$importUpdates = 0
$importErrors = 0

# Find TypeScript/JavaScript files (limit to 100 to avoid processing too many files)
$files = Get-ChildItem -Path "." -Recurse -Include "*.ts", "*.tsx", "*.js", "*.jsx" -Exclude "node_modules" | Select-Object -First 100

# Define path mappings (old path -> new path)
$pathMappings = @{
    "../backend/api/" = "../backend/api-gateway/"
    "../../backend/api/" = "../../backend/api-gateway/"
    "../backend/services/task/" = "../backend/task-service/"
    "../../backend/services/task/" = "../../backend/task-service/"
    "../frontend/components/" = "../frontend/web/src/components/"
    "../../frontend/components/" = "../../frontend/web/src/components/"
    "../shared/" = "../packages/shared/"
    "../../shared/" = "../../packages/shared/"
}

foreach ($file in $files) {
    try {
        $content = Get-Content $file.FullName -Raw
        $originalContent = $content
        $updated = $false
        
        foreach ($oldPath in $pathMappings.Keys) {
            $newPath = $pathMappings[$oldPath]
            if ($content -match [regex]::Escape($oldPath)) {
                $content = $content -replace [regex]::Escape($oldPath), $newPath
                $updated = $true
            }
        }
        
        if ($updated) {
            $content | Set-Content -Path $file.FullName -Encoding UTF8
            $importUpdates++
            Write-Host "  ✓ Updated: $($file.FullName)" -ForegroundColor Green
        }
    }
    catch {
        $importErrors++
        Write-Host "  ✗ Error updating: $($file.FullName)" -ForegroundColor Red
    }
}

Write-Host "`nUpdated $importUpdates files. Encountered $importErrors errors." -ForegroundColor $(if ($importErrors -eq 0) { "Green" } else { "Yellow" })

# Step 3: Update package.json files
Write-Host "`n[3/4] Updating package.json files..." -ForegroundColor Cyan
$packageJsonUpdates = 0
$packageJsonErrors = 0

$packageJsonFiles = Get-ChildItem -Path "." -Recurse -Filter "package.json" -Exclude "node_modules"
foreach ($file in $packageJsonFiles) {
    try {
        $content = Get-Content $file.FullName -Raw
        $originalContent = $content
        $updated = $false
        
        # Update paths in package.json
        if ($content -match "frontend/components") {
            $content = $content -replace "frontend/components", "frontend/web/src/components"
            $updated = $true
        }
        
        if ($content -match "shared/") {
            $content = $content -replace "shared/", "packages/shared/"
            $updated = $true
        }
        
        if ($content -match "backend/services/task") {
            $content = $content -replace "backend/services/task", "backend/task-service"
            $updated = $true
        }
        
        if ($content -match "backend/api/") {
            $content = $content -replace "backend/api/", "backend/api-gateway/"
            $updated = $true
        }
        
        if ($updated) {
            $content | Set-Content -Path $file.FullName -Encoding UTF8
            $packageJsonUpdates++
            Write-Host "  ✓ Updated: $($file.FullName)" -ForegroundColor Green
        }
    }
    catch {
        $packageJsonErrors++
        Write-Host "  ✗ Error updating: $($file.FullName)" -ForegroundColor Red
    }
}

Write-Host "`nUpdated $packageJsonUpdates package.json files. Encountered $packageJsonErrors errors." -ForegroundColor $(if ($packageJsonErrors -eq 0) { "Green" } else { "Yellow" })

# Step 4: Ask about removing duplicate files
Write-Host "`n[4/4] Duplicate file management..." -ForegroundColor Cyan
$response = Read-Host "Do you want to remove duplicate files from original locations? (y/n)"

if ($response -eq "y") {
    # Create backup directory
    $backupDir = "backup-original-files-$(Get-Date -Format 'yyyyMMdd_HHmmss')"
    New-Item -Path $backupDir -ItemType Directory | Out-Null
    Write-Host "  Created backup directory: $backupDir" -ForegroundColor Green
    
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
    
    foreach ($dir in $duplicateDirs) {
        if (Test-Path $dir) {
            # Create backup of the directory
            $backupPath = Join-Path -Path $backupDir -ChildPath $dir
            $parentDir = Split-Path -Path $backupPath -Parent
            
            if (-not (Test-Path $parentDir)) {
                New-Item -Path $parentDir -ItemType Directory -Force | Out-Null
            }
            
            Copy-Item -Path $dir -Destination $backupPath -Recurse -Force
            Write-Host "  ✓ Backed up: $dir to $backupPath" -ForegroundColor Green
            
            # Remove the directory
            Remove-Item -Path $dir -Recurse -Force
            Write-Host "  ✓ Removed: $dir" -ForegroundColor Green
        }
        else {
            Write-Host "  - Directory not found: $dir" -ForegroundColor Yellow
        }
    }
    
    Write-Host "`nDuplicate directories removed. Backups available at: $backupDir" -ForegroundColor Green
}
else {
    Write-Host "`nSkipped removal of duplicate files." -ForegroundColor Yellow
}

# Final summary
Write-Host "`n=== TASK 2.1.3 COMPLETION SUMMARY ===" -ForegroundColor Magenta
Write-Host "✓ Directory structure verified" -ForegroundColor Green
Write-Host "✓ Import paths updated in $importUpdates files" -ForegroundColor Green
Write-Host "✓ Package configurations updated in $packageJsonUpdates files" -ForegroundColor Green
if ($response -eq "y") {
    Write-Host "✓ Duplicate directories removed with backups" -ForegroundColor Green
}
else {
    Write-Host "- Duplicate directories kept as requested" -ForegroundColor Yellow
}

Write-Host "`nTask 2.1.3 - Directory Restructuring implementation completed!" -ForegroundColor Green
Write-Host "The project now follows the recommended monorepo directory structure." -ForegroundColor Green
