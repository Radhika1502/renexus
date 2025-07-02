# Update Import Paths Script
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
$logPath = "$rootPath\import_updates_summary_$timestamp.txt"
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
        Write-Host "Error updating $FilePath" -ForegroundColor Red
        "Error updating $FilePath : $_" | Out-File -FilePath $logPath -Append
        return $false
    }
}

# Define replacement patterns for backend files
$backendReplacements = @{
    # Update imports for files that were moved to backend
    "from ['`"]\.\/api\/([^'`"]+)['`"]" = "from './api/`$1'"
    "from ['`"]\.\.\/api\/([^'`"]+)['`"]" = "from '../api/`$1'"
    "import apiRoutes from ['`"]\.\/api\/routes['`"]" = "import apiRoutes from './api/routes'"
    
    # Update imports for database
    "from ['`"]\.\/database\/([^'`"]+)['`"]" = "from './database/`$1'"
    "from ['`"]\.\.\/database\/([^'`"]+)['`"]" = "from '../database/`$1'"
    "import \{ pool \} from ['`"]\.\/database\/db['`"]" = "import { pool } from './database/db'"
    
    # Update imports for middleware
    "from ['`"]\.\/middleware\/([^'`"]+)['`"]" = "from './middleware/`$1'"
    "from ['`"]\.\.\/middleware\/([^'`"]+)['`"]" = "from '../middleware/`$1'"
    
    # Update imports for services
    "from ['`"]\.\/services\/([^'`"]+)['`"]" = "from './services/`$1'"
    "from ['`"]\.\.\/services\/([^'`"]+)['`"]" = "from '../services/`$1'"
    
    # Update imports for shared resources (now in shared directory)
    "from ['`"]\.\.\/types\/([^'`"]+)['`"]" = "from '../../shared/types/`$1'"
    "from ['`"]\.\.\/\.\.\/types\/([^'`"]+)['`"]" = "from '../../../shared/types/`$1'"
    "from ['`"]\.\.\/config\/([^'`"]+)['`"]" = "from '../../shared/config/`$1'"
    "from ['`"]\.\.\/\.\.\/config\/([^'`"]+)['`"]" = "from '../../../shared/config/`$1'"
    "from ['`"]\.\.\/utils\/([^'`"]+)['`"]" = "from '../../shared/utils/`$1'"
    "from ['`"]\.\.\/\.\.\/utils\/([^'`"]+)['`"]" = "from '../../../shared/utils/`$1'"
}

# Define replacement patterns for frontend files
$frontendReplacements = @{
    # Update imports for components
    "from ['`"]\.\.\/components\/([^'`"]+)['`"]" = "from '../components/`$1'"
    "from ['`"]\.\.\/\.\.\/components\/([^'`"]+)['`"]" = "from '../../components/`$1'"
    
    # Update imports for hooks
    "from ['`"]\.\.\/hooks\/([^'`"]+)['`"]" = "from '../hooks/`$1'"
    "from ['`"]\.\.\/\.\.\/hooks\/([^'`"]+)['`"]" = "from '../../hooks/`$1'"
    
    # Update imports for shared resources (now in shared directory)
    "from ['`"]\.\.\/types\/([^'`"]+)['`"]" = "from '../../shared/types/`$1'"
    "from ['`"]\.\.\/\.\.\/types\/([^'`"]+)['`"]" = "from '../../../shared/types/`$1'"
    "import \{ ([^\}]+) \} from ['`"]\.\.\/\.\.\/types\/([^'`"]+)['`"]" = "import { `$1 } from '../../../shared/types/`$2'"
    "from ['`"]\.\.\/config\/([^'`"]+)['`"]" = "from '../../shared/config/`$1'"
    "from ['`"]\.\.\/\.\.\/config\/([^'`"]+)['`"]" = "from '../../../shared/config/`$1'"
    "from ['`"]\.\.\/utils\/([^'`"]+)['`"]" = "from '../../shared/utils/`$1'"
    "from ['`"]\.\.\/\.\.\/utils\/([^'`"]+)['`"]" = "from '../../../shared/utils/`$1'"
    
    # Update imports for services
    "from ['`"]\.\.\/services\/([^'`"]+)['`"]" = "from '../services/`$1'"
    "from ['`"]\.\.\/\.\.\/services\/([^'`"]+)['`"]" = "from '../../services/`$1'"
}

# Process backend files
Write-Host "Updating imports in backend files..." -ForegroundColor Cyan
$backendFiles = Get-ChildItem -Path $backendPath -Recurse -Include "*.ts", "*.js", "*.tsx", "*.jsx"
$backendUpdateCount = 0

foreach ($file in $backendFiles) {
    if (Update-Imports -FilePath $file.FullName -Replacements $backendReplacements) {
        $backendUpdateCount++
    }
}

Write-Host "Updated imports in $backendUpdateCount backend files" -ForegroundColor Green

# Process frontend files
Write-Host "Updating imports in frontend files..." -ForegroundColor Cyan
$frontendFiles = Get-ChildItem -Path $frontendPath -Recurse -Include "*.ts", "*.js", "*.tsx", "*.jsx"
$frontendUpdateCount = 0

foreach ($file in $frontendFiles) {
    if (Update-Imports -FilePath $file.FullName -Replacements $frontendReplacements) {
        $frontendUpdateCount++
    }
}

Write-Host "Updated imports in $frontendUpdateCount frontend files" -ForegroundColor Green

# Update package.json if needed
Write-Host "Checking package.json for path updates..." -ForegroundColor Cyan
$packageJsonPath = "$rootPath\package.json"

if (Test-Path $packageJsonPath) {
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

Write-Host "Import path update process complete!" -ForegroundColor Green
Write-Host "Log file created at: $logPath" -ForegroundColor Cyan
Write-Host "" -ForegroundColor White
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Review the log file to verify updates" -ForegroundColor Yellow
Write-Host "2. Test the application to ensure it works correctly" -ForegroundColor Yellow
