# Update All Import Paths Script
# This script will find and update import paths in the codebase after reorganization

Write-Host "Starting Import Path Update Process..." -ForegroundColor Cyan
Write-Host "------------------------------------------" -ForegroundColor Cyan

# Define paths
$rootPath = "c:\Users\HP\Renexus"
$backendPath = "$rootPath\backend"
$frontendPath = "$rootPath\frontend"
$sharedPath = "$rootPath\shared"

# Create log file
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$logPath = "$rootPath\import_updates_$timestamp.txt"
"Import Path Updates Log - $(Get-Date)" | Out-File -FilePath $logPath -Force

# Function to update imports in a file
function Update-Imports {
    param (
        [string]$FilePath,
        [hashtable]$Replacements
    )
    
    try {
        $content = Get-Content -Path $FilePath -Raw
        $originalContent = $content
        $fileModified = $false
        
        foreach ($pattern in $Replacements.Keys) {
            $replacement = $Replacements[$pattern]
            
            if ($content -match $pattern) {
                $content = $content -replace $pattern, $replacement
                $fileModified = $true
                "Updated in $FilePath : $pattern -> $replacement" | Out-File -FilePath $logPath -Append
            }
        }
        
        if ($fileModified) {
            Set-Content -Path $FilePath -Value $content
            Write-Host "Updated imports in: $FilePath" -ForegroundColor Green
            return $true
        }
        
        return $false
    }
    catch {
        Write-Host "Error updating $FilePath : $_" -ForegroundColor Red
        "Error updating $FilePath : $_" | Out-File -FilePath $logPath -Append
        return $false
    }
}

# Frontend files that need to update imports from types, config, utils (now in shared)
$frontendImportReplacements = @{
    # Update imports for shared resources (now in shared directory)
    'from\s+[''"]\.\.\/types\/([^''"]+)[''"]' = 'from "../../../shared/types/$1"'
    'from\s+[''"]\.\.\/\.\.\/types\/([^''"]+)[''"]' = 'from "../../../shared/types/$1"'
    'from\s+[''"]\.\.\/\.\.\/\.\.\/types\/([^''"]+)[''"]' = 'from "../../../shared/types/$1"'
    
    'from\s+[''"]\.\.\/config\/([^''"]+)[''"]' = 'from "../../../shared/config/$1"'
    'from\s+[''"]\.\.\/\.\.\/config\/([^''"]+)[''"]' = 'from "../../../shared/config/$1"'
    'from\s+[''"]\.\.\/\.\.\/\.\.\/config\/([^''"]+)[''"]' = 'from "../../../shared/config/$1"'
    
    'from\s+[''"]\.\.\/utils\/([^''"]+)[''"]' = 'from "../../../shared/utils/$1"'
    'from\s+[''"]\.\.\/\.\.\/utils\/([^''"]+)[''"]' = 'from "../../../shared/utils/$1"'
    'from\s+[''"]\.\.\/\.\.\/\.\.\/utils\/([^''"]+)[''"]' = 'from "../../../shared/utils/$1"'
    
    # TypeScript imports
    'import\s+\{\s*([^}]+)\s*\}\s+from\s+[''"]\.\.\/types\/([^''"]+)[''"]' = 'import { $1 } from "../../../shared/types/$2"'
    'import\s+\{\s*([^}]+)\s*\}\s+from\s+[''"]\.\.\/\.\.\/types\/([^''"]+)[''"]' = 'import { $1 } from "../../../shared/types/$2"'
    'import\s+\{\s*([^}]+)\s*\}\s+from\s+[''"]\.\.\/\.\.\/\.\.\/types\/([^''"]+)[''"]' = 'import { $1 } from "../../../shared/types/$2"'
    
    'import\s+\{\s*([^}]+)\s*\}\s+from\s+[''"]\.\.\/config\/([^''"]+)[''"]' = 'import { $1 } from "../../../shared/config/$2"'
    'import\s+\{\s*([^}]+)\s*\}\s+from\s+[''"]\.\.\/\.\.\/config\/([^''"]+)[''"]' = 'import { $1 } from "../../../shared/config/$2"'
    
    'import\s+\{\s*([^}]+)\s*\}\s+from\s+[''"]\.\.\/utils\/([^''"]+)[''"]' = 'import { $1 } from "../../../shared/utils/$2"'
    'import\s+\{\s*([^}]+)\s*\}\s+from\s+[''"]\.\.\/\.\.\/utils\/([^''"]+)[''"]' = 'import { $1 } from "../../../shared/utils/$2"'
    
    # Default imports
    'import\s+([a-zA-Z0-9_]+)\s+from\s+[''"]\.\.\/types\/([^''"]+)[''"]' = 'import $1 from "../../../shared/types/$2"'
    'import\s+([a-zA-Z0-9_]+)\s+from\s+[''"]\.\.\/\.\.\/types\/([^''"]+)[''"]' = 'import $1 from "../../../shared/types/$2"'
    
    'import\s+([a-zA-Z0-9_]+)\s+from\s+[''"]\.\.\/config\/([^''"]+)[''"]' = 'import $1 from "../../../shared/config/$2"'
    'import\s+([a-zA-Z0-9_]+)\s+from\s+[''"]\.\.\/\.\.\/config\/([^''"]+)[''"]' = 'import $1 from "../../../shared/config/$2"'
    
    'import\s+([a-zA-Z0-9_]+)\s+from\s+[''"]\.\.\/utils\/([^''"]+)[''"]' = 'import $1 from "../../../shared/utils/$2"'
    'import\s+([a-zA-Z0-9_]+)\s+from\s+[''"]\.\.\/\.\.\/utils\/([^''"]+)[''"]' = 'import $1 from "../../../shared/utils/$2"'
}

# Backend files that need to update imports from types, config, utils (now in shared)
$backendImportReplacements = @{
    # Update imports for shared resources (now in shared directory)
    'from\s+[''"]\.\.\/types\/([^''"]+)[''"]' = 'from "../../shared/types/$1"'
    'from\s+[''"]\.\.\/\.\.\/types\/([^''"]+)[''"]' = 'from "../../shared/types/$1"'
    'from\s+[''"]\.\.\/\.\.\/\.\.\/types\/([^''"]+)[''"]' = 'from "../../../shared/types/$1"'
    
    'from\s+[''"]\.\.\/config\/([^''"]+)[''"]' = 'from "../../shared/config/$1"'
    'from\s+[''"]\.\.\/\.\.\/config\/([^''"]+)[''"]' = 'from "../../shared/config/$1"'
    'from\s+[''"]\.\.\/\.\.\/\.\.\/config\/([^''"]+)[''"]' = 'from "../../../shared/config/$1"'
    
    'from\s+[''"]\.\.\/utils\/([^''"]+)[''"]' = 'from "../../shared/utils/$1"'
    'from\s+[''"]\.\.\/\.\.\/utils\/([^''"]+)[''"]' = 'from "../../shared/utils/$1"'
    'from\s+[''"]\.\.\/\.\.\/\.\.\/utils\/([^''"]+)[''"]' = 'from "../../../shared/utils/$1"'
    
    # TypeScript imports
    'import\s+\{\s*([^}]+)\s*\}\s+from\s+[''"]\.\.\/types\/([^''"]+)[''"]' = 'import { $1 } from "../../shared/types/$2"'
    'import\s+\{\s*([^}]+)\s*\}\s+from\s+[''"]\.\.\/\.\.\/types\/([^''"]+)[''"]' = 'import { $1 } from "../../shared/types/$2"'
    
    'import\s+\{\s*([^}]+)\s*\}\s+from\s+[''"]\.\.\/config\/([^''"]+)[''"]' = 'import { $1 } from "../../shared/config/$2"'
    'import\s+\{\s*([^}]+)\s*\}\s+from\s+[''"]\.\.\/\.\.\/config\/([^''"]+)[''"]' = 'import { $1 } from "../../shared/config/$2"'
    
    'import\s+\{\s*([^}]+)\s*\}\s+from\s+[''"]\.\.\/utils\/([^''"]+)[''"]' = 'import { $1 } from "../../shared/utils/$2"'
    'import\s+\{\s*([^}]+)\s*\}\s+from\s+[''"]\.\.\/\.\.\/utils\/([^''"]+)[''"]' = 'import { $1 } from "../../shared/utils/$2"'
    
    # Default imports
    'import\s+([a-zA-Z0-9_]+)\s+from\s+[''"]\.\.\/types\/([^''"]+)[''"]' = 'import $1 from "../../shared/types/$2"'
    'import\s+([a-zA-Z0-9_]+)\s+from\s+[''"]\.\.\/\.\.\/types\/([^''"]+)[''"]' = 'import $1 from "../../shared/types/$2"'
    
    'import\s+([a-zA-Z0-9_]+)\s+from\s+[''"]\.\.\/config\/([^''"]+)[''"]' = 'import $1 from "../../shared/config/$2"'
    'import\s+([a-zA-Z0-9_]+)\s+from\s+[''"]\.\.\/\.\.\/config\/([^''"]+)[''"]' = 'import $1 from "../../shared/config/$2"'
    
    'import\s+([a-zA-Z0-9_]+)\s+from\s+[''"]\.\.\/utils\/([^''"]+)[''"]' = 'import $1 from "../../shared/utils/$2"'
    'import\s+([a-zA-Z0-9_]+)\s+from\s+[''"]\.\.\/\.\.\/utils\/([^''"]+)[''"]' = 'import $1 from "../../shared/utils/$2"'
}

# Process frontend files
Write-Host "Updating imports in frontend files..." -ForegroundColor Cyan
$frontendFiles = Get-ChildItem -Path $frontendPath -Recurse -Include "*.ts", "*.js", "*.tsx", "*.jsx"
$frontendUpdateCount = 0

foreach ($file in $frontendFiles) {
    if (Update-Imports -FilePath $file.FullName -Replacements $frontendImportReplacements) {
        $frontendUpdateCount++
    }
}

Write-Host "Updated imports in $frontendUpdateCount frontend files" -ForegroundColor Green

# Process backend files
Write-Host "Updating imports in backend files..." -ForegroundColor Cyan
$backendFiles = Get-ChildItem -Path $backendPath -Recurse -Include "*.ts", "*.js", "*.tsx", "*.jsx"
$backendUpdateCount = 0

foreach ($file in $backendFiles) {
    if (Update-Imports -FilePath $file.FullName -Replacements $backendImportReplacements) {
        $backendUpdateCount++
    }
}

Write-Host "Updated imports in $backendUpdateCount backend files" -ForegroundColor Green

# Update package.json if needed
Write-Host "Checking package.json for path updates..." -ForegroundColor Cyan
$packageJsonPath = "$rootPath\package.json"

if (Test-Path $packageJsonPath) {
    try {
        $packageJson = Get-Content -Path $packageJsonPath -Raw | ConvertFrom-Json
        $modified = $false
        
        # Check and update scripts
        if ($packageJson.scripts) {
            foreach ($scriptName in $packageJson.scripts.PSObject.Properties.Name) {
                $scriptValue = $packageJson.scripts.$scriptName
                
                # Update paths in scripts
                if ($scriptValue -match "\.\/server\.ts") {
                    $packageJson.scripts.$scriptName = $scriptValue -replace "\.\/server\.ts", "./backend/server.ts"
                    $modified = $true
                    "Updated script $scriptName in package.json: ./server.ts -> ./backend/server.ts" | Out-File -FilePath $logPath -Append
                }
            }
        }
        
        # Save changes if modified
        if ($modified) {
            $packageJson | ConvertTo-Json -Depth 10 | Set-Content -Path $packageJsonPath
            Write-Host "Updated paths in package.json" -ForegroundColor Green
        } else {
            Write-Host "No updates needed in package.json" -ForegroundColor Yellow
        }
    }
    catch {
        Write-Host "Error updating package.json: $_" -ForegroundColor Red
        "Error updating package.json: $_" | Out-File -FilePath $logPath -Append
    }
}

Write-Host "Import path update process complete!" -ForegroundColor Green
Write-Host "Log file created at: $logPath" -ForegroundColor Cyan
Write-Host "" -ForegroundColor White
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Review the log file to verify updates" -ForegroundColor Yellow
Write-Host "2. Test the application to ensure it works correctly" -ForegroundColor Yellow
Write-Host "3. Run 'npm install' if there are any dependency issues" -ForegroundColor Yellow
