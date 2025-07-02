# Update import paths to reflect the new directory structure
# This script scans and updates import paths in TypeScript/JavaScript files

$ErrorActionPreference = "Stop"
$logFile = "import-updates-$(Get-Date -Format 'yyyyMMdd_HHmmss').log"
$summaryFile = "import_updates_summary_$(Get-Date -Format 'yyyyMMdd_HHmmss').txt"

function Write-Log {
    param (
        [string]$Message,
        [string]$Level = "INFO"
    )
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "$timestamp [$Level] - $Message" | Out-File -FilePath $logFile -Append
    Write-Host "[$Level] $Message"
}

Write-Log "Starting import path updates for restructured directories..."

# Create a mapping of old paths to new paths
$pathMappings = @{
    # Backend paths
    "../../backend/api" = "../../backend/api-gateway"
    "../backend/api" = "../backend/api-gateway"
    "./backend/api" = "./backend/api-gateway"
    "../../backend/services/task" = "../../backend/task-service"
    "../backend/services/task" = "../backend/task-service"
    "./backend/services/task" = "./backend/task-service"
    "../../backend/utils" = "../../backend/shared"
    "../backend/utils" = "../backend/shared"
    "./backend/utils" = "./backend/shared"
    "../../backend/types" = "../../backend/shared/types"
    "../backend/types" = "../backend/shared/types"
    "./backend/types" = "./backend/shared/types"
    
    # Frontend paths
    "../../frontend/components" = "../../frontend/web/src/components"
    "../frontend/components" = "../frontend/web/src/components"
    "./frontend/components" = "./frontend/web/src/components"
    "../../frontend/hooks" = "../../frontend/web/src/hooks"
    "../frontend/hooks" = "../frontend/web/src/hooks"
    "./frontend/hooks" = "./frontend/web/src/hooks"
    "../../frontend/services" = "../../frontend/web/src/services"
    "../frontend/services" = "../frontend/web/src/services"
    "./frontend/services" = "./frontend/web/src/services"
    
    # Shared paths
    "../../shared/components" = "../../packages/ui"
    "../shared/components" = "../packages/ui"
    "./shared/components" = "./packages/ui"
    "../../shared/utils" = "../../packages/shared"
    "../shared/utils" = "../packages/shared"
    "./shared/utils" = "./packages/shared"
    "../../shared/types" = "../../packages/shared/types"
    "../shared/types" = "../packages/shared/types"
    "./shared/types" = "./packages/shared/types"
    "../../backend/database" = "../../packages/database"
    "../backend/database" = "../packages/database"
    "./backend/database" = "./packages/database"
}

# Count of files updated
$updatedFiles = 0
$totalImportsUpdated = 0
$filesWithUpdates = @()

# Function to update imports in a file
function Update-Imports {
    param (
        [string]$FilePath
    )
    
    $content = Get-Content $FilePath -Raw
    $originalContent = $content
    $importsUpdated = 0
    
    foreach ($oldPath in $pathMappings.Keys) {
        $newPath = $pathMappings[$oldPath]
        
        # Match import statements with the old path
        $pattern = "import\s+(.+?)\s+from\s+['\"]($oldPath)([^'\""]*)['\""]"
        if ($content -match $pattern) {
            $content = $content -replace $pattern, "import `$1 from '$newPath`$3'"
            $importsUpdated++
        }
        
        # Match require statements with the old path
        $requirePattern = "require\(['\"]($oldPath)([^'\""]*)['\"]\)"
        if ($content -match $requirePattern) {
            $content = $content -replace $requirePattern, "require('$newPath`$2')"
            $importsUpdated++
        }
    }
    
    # If content was changed, write it back to the file
    if ($content -ne $originalContent) {
        $content | Set-Content -Path $FilePath -Encoding UTF8
        $script:updatedFiles++
        $script:totalImportsUpdated += $importsUpdated
        $script:filesWithUpdates += $FilePath
        Write-Log "Updated $importsUpdated imports in $FilePath"
        return $importsUpdated
    }
    
    return 0
}

# Process TypeScript/JavaScript files in backend
Write-Log "Processing backend files..."
$backendFiles = Get-ChildItem -Path "backend" -Recurse -Include "*.ts", "*.tsx", "*.js", "*.jsx"
foreach ($file in $backendFiles) {
    Update-Imports -FilePath $file.FullName
}

# Process TypeScript/JavaScript files in frontend
Write-Log "Processing frontend files..."
$frontendFiles = Get-ChildItem -Path "frontend" -Recurse -Include "*.ts", "*.tsx", "*.js", "*.jsx"
foreach ($file in $frontendFiles) {
    Update-Imports -FilePath $file.FullName
}

# Process TypeScript/JavaScript files in packages
Write-Log "Processing packages files..."
if (Test-Path "packages") {
    $packagesFiles = Get-ChildItem -Path "packages" -Recurse -Include "*.ts", "*.tsx", "*.js", "*.jsx"
    foreach ($file in $packagesFiles) {
        Update-Imports -FilePath $file.FullName
    }
}

# Update package.json files to reflect new paths
Write-Log "Updating package.json files..."
$packageJsonFiles = Get-ChildItem -Path "." -Recurse -Filter "package.json"
foreach ($file in $packageJsonFiles) {
    $content = Get-Content $file.FullName -Raw | ConvertFrom-Json
    $updated = $false
    
    # Update dependencies paths if they reference local paths
    if ($content.dependencies) {
        $dependencies = $content.dependencies.PSObject.Properties | Where-Object { $_.Value -match "file:" }
        foreach ($dep in $dependencies) {
            $path = $dep.Value -replace "file:", ""
            foreach ($oldPath in $pathMappings.Keys) {
                if ($path -match [regex]::Escape($oldPath)) {
                    $newPath = $path -replace [regex]::Escape($oldPath), $pathMappings[$oldPath]
                    $content.dependencies.($dep.Name) = "file:$newPath"
                    $updated = $true
                    Write-Log "Updated dependency path in $($file.FullName): $($dep.Name) -> file:$newPath"
                }
            }
        }
    }
    
    # Update any scripts that reference paths
    if ($content.scripts) {
        $scripts = $content.scripts.PSObject.Properties
        foreach ($script in $scripts) {
            foreach ($oldPath in $pathMappings.Keys) {
                if ($script.Value -match [regex]::Escape($oldPath)) {
                    $newValue = $script.Value -replace [regex]::Escape($oldPath), $pathMappings[$oldPath]
                    $content.scripts.($script.Name) = $newValue
                    $updated = $true
                    Write-Log "Updated script in $($file.FullName): $($script.Name) -> $newValue"
                }
            }
        }
    }
    
    # Write updated package.json if changes were made
    if ($updated) {
        $content | ConvertTo-Json -Depth 10 | Set-Content -Path $file.FullName -Encoding UTF8
        $script:updatedFiles++
        $script:filesWithUpdates += $file.FullName
    }
}

# Create a summary report
"Import Path Updates Summary" | Out-File -FilePath $summaryFile
"Generated on: $(Get-Date)" | Out-File -FilePath $summaryFile -Append
"" | Out-File -FilePath $summaryFile -Append
"Total files updated: $updatedFiles" | Out-File -FilePath $summaryFile -Append
"Total imports updated: $totalImportsUpdated" | Out-File -FilePath $summaryFile -Append
"" | Out-File -FilePath $summaryFile -Append

if ($filesWithUpdates.Count -gt 0) {
    "Files with updates:" | Out-File -FilePath $summaryFile -Append
    foreach ($file in $filesWithUpdates) {
        "  - $file" | Out-File -FilePath $summaryFile -Append
    }
}

Write-Log "Import path updates completed. Updated $updatedFiles files with $totalImportsUpdated import changes."
Write-Log "Summary report saved to $summaryFile"
