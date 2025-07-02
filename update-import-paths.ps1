# Script to update import paths to reflect the new consolidated directory structure
$ErrorActionPreference = "Stop"

function Write-Log {
    param (
        [string]$Message,
        [string]$Type = "INFO"
    )
    
    $color = switch ($Type) {
        "INFO" { "White" }
        "SUCCESS" { "Green" }
        "WARNING" { "Yellow" }
        "ERROR" { "Red" }
        default { "White" }
    }
    
    Write-Host "[$Type] $Message" -ForegroundColor $color
}

# Create backup before modifying files
$backupDir = "c:\Users\HP\Renexus\code-backup-$(Get-Date -Format 'yyyyMMdd_HHmmss')"
Write-Log "Creating backup to $backupDir"
New-Item -Path $backupDir -ItemType Directory -Force | Out-Null
Copy-Item -Path "c:\Users\HP\Renexus\frontend" -Destination "$backupDir\frontend" -Recurse -Force
Copy-Item -Path "c:\Users\HP\Renexus\backend" -Destination "$backupDir\backend" -Recurse -Force
Copy-Item -Path "c:\Users\HP\Renexus\packages" -Destination "$backupDir\packages" -Recurse -Force
Write-Log "Backup created successfully at $backupDir" "SUCCESS"

# Define directories to scan for code files
$codeDirs = @(
    "c:\Users\HP\Renexus\frontend",
    "c:\Users\HP\Renexus\backend",
    "c:\Users\HP\Renexus\packages"
)

# Define import path mappings (old pattern -> new pattern)
$importMappings = @(
    # Frontend import path updates
    @{
        OldPattern = "from\s+['\""](\.\.\/)+components\/"; 
        NewPattern = "from 'frontend/web/src/components/"
    },
    @{
        OldPattern = "from\s+['\""](\.\.\/)+hooks\/"; 
        NewPattern = "from 'frontend/web/src/hooks/"
    },
    @{
        OldPattern = "from\s+['\""](\.\.\/)+services\/"; 
        NewPattern = "from 'frontend/web/src/services/"
    },
    @{
        OldPattern = "from\s+['\""](\.\.\/)+utils\/"; 
        NewPattern = "from 'frontend/web/src/utils/"
    },
    @{
        OldPattern = "from\s+['\""](\.\.\/)+types\/"; 
        NewPattern = "from 'frontend/web/src/types/"
    },
    
    # Backend import path updates
    @{
        OldPattern = "from\s+['\""](\.\.\/)+backend\/api\/"; 
        NewPattern = "from 'backend/api-gateway/"
    },
    @{
        OldPattern = "from\s+['\""](\.\.\/)+backend\/database\/"; 
        NewPattern = "from 'packages/database/"
    },
    @{
        OldPattern = "from\s+['\""](\.\.\/)+backend\/services\/task\/"; 
        NewPattern = "from 'backend/task-service/"
    },
    
    # Shared import path updates
    @{
        OldPattern = "from\s+['\""](\.\.\/)+shared\/config\/"; 
        NewPattern = "from 'packages/shared/config/"
    },
    @{
        OldPattern = "from\s+['\""](\.\.\/)+shared\/services\/"; 
        NewPattern = "from 'packages/shared/services/"
    },
    @{
        OldPattern = "from\s+['\""](\.\.\/)+shared\/types\/"; 
        NewPattern = "from 'packages/shared/types/"
    },
    @{
        OldPattern = "from\s+['\""](\.\.\/)+shared\/utils\/"; 
        NewPattern = "from 'packages/shared/utils/"
    }
)

# Process each directory
$totalFilesProcessed = 0
$totalPathsUpdated = 0

foreach ($dir in $codeDirs) {
    Write-Log "Scanning directory: $dir"
    
    # Get all TypeScript/JavaScript files
    $files = Get-ChildItem -Path $dir -Recurse -Include "*.ts", "*.tsx", "*.js", "*.jsx" -File
    
    Write-Log "Found $($files.Count) code files to process"
    
    foreach ($file in $files) {
        # Skip node_modules
        if ($file.FullName -match "node_modules") {
            continue
        }
        
        $originalContent = Get-Content -Path $file.FullName -Raw
        $newContent = $originalContent
        $pathUpdatesInFile = 0
        
        # Apply each import path mapping
        foreach ($mapping in $importMappings) {
            $oldContent = $newContent
            $newContent = $newContent -replace $mapping.OldPattern, $mapping.NewPattern
            
            # Count updates
            if ($oldContent -ne $newContent) {
                $pathUpdatesInFile++
            }
        }
        
        # Save file if changes were made
        if ($originalContent -ne $newContent) {
            Set-Content -Path $file.FullName -Value $newContent -Force
            Write-Log "  Updated $pathUpdatesInFile import paths in: $($file.FullName)" "INFO"
            $totalPathsUpdated += $pathUpdatesInFile
        }
        
        $totalFilesProcessed++
    }
}

Write-Log "Import path update complete!" "SUCCESS"
Write-Log "Processed $totalFilesProcessed files, updated $totalPathsUpdated import paths" "SUCCESS"
Write-Log "Backup created at: $backupDir" "INFO"

Write-Log "Directory restructuring and import path updates are now complete." "SUCCESS"
Write-Log "Please run your tests to verify that everything is working correctly." "INFO"
Write-Log "If you encounter any issues, you can restore from the backup at: $backupDir" "INFO"
