# Simple script to update import paths after directory restructuring
$ErrorActionPreference = "Stop"
$logFile = "import-updates-$(Get-Date -Format 'yyyyMMdd_HHmmss').log"

function Write-Log {
    param (
        [string]$Message
    )
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "$timestamp - $Message" | Out-File -FilePath $logFile -Append
    Write-Host $Message
}

Write-Log "Starting import path updates for restructured directories..."

# Define path mappings (old path -> new path)
$pathMappings = @{
    # Backend paths
    "from '../backend/api/" = "from '../backend/api-gateway/"
    "from '../../backend/api/" = "from '../../backend/api-gateway/"
    "from './backend/api/" = "from './backend/api-gateway/"
    "from '../backend/services/task/" = "from '../backend/task-service/"
    "from '../../backend/services/task/" = "from '../../backend/task-service/"
    "from './backend/services/task/" = "from './backend/task-service/"
    
    # Frontend paths
    "from '../frontend/components/" = "from '../frontend/web/src/components/"
    "from '../../frontend/components/" = "from '../../frontend/web/src/components/"
    "from './frontend/components/" = "from './frontend/web/src/components/"
    "from '../frontend/hooks/" = "from '../frontend/web/src/hooks/"
    "from '../../frontend/hooks/" = "from '../../frontend/web/src/hooks/"
    "from './frontend/hooks/" = "from './frontend/web/src/hooks/"
    
    # Shared paths
    "from '../shared/" = "from '../packages/"
    "from '../../shared/" = "from '../../packages/"
    "from './shared/" = "from './packages/"
    "from '../backend/database/" = "from '../packages/database/"
    "from '../../backend/database/" = "from '../../packages/database/"
    "from './backend/database/" = "from './packages/database/"
}

# Count of files updated
$updatedFiles = 0
$filesWithUpdates = @()

# Process TypeScript/JavaScript files
Write-Log "Processing TypeScript/JavaScript files..."
$files = Get-ChildItem -Path "." -Recurse -Include "*.ts", "*.tsx", "*.js", "*.jsx" -Exclude "node_modules"

foreach ($file in $files) {
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
        $updatedFiles++
        $filesWithUpdates += $file.FullName
        Write-Log "Updated imports in $($file.FullName)"
    }
}

Write-Log "Import path updates completed. Updated $updatedFiles files."
if ($filesWithUpdates.Count -gt 0) {
    Write-Log "Files with updates:"
    foreach ($file in $filesWithUpdates) {
        Write-Log "  - $file"
    }
}
