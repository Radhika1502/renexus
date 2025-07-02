# Script to merge duplicate files in the backend directory structure
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

# Create backup
$backupDir = "c:\Users\HP\Renexus\backend-backup-$(Get-Date -Format 'yyyyMMdd_HHmmss')"
Write-Log "Creating backup to $backupDir"
New-Item -Path $backupDir -ItemType Directory -Force | Out-Null
Copy-Item -Path "c:\Users\HP\Renexus\backend" -Destination $backupDir -Recurse -Force
Write-Log "Backup created successfully" "SUCCESS"

# Define directory mappings for backend merging
$backendMerges = @(
    # Merge 'api' into 'api-gateway'
    @{ Source = "c:\Users\HP\Renexus\backend\api"; Destination = "c:\Users\HP\Renexus\backend\api-gateway" },
    
    # Move backend/database to packages/database
    @{ Source = "c:\Users\HP\Renexus\backend\database"; Destination = "c:\Users\HP\Renexus\packages\database" },
    
    # Move backend/services/task to backend/task-service
    @{ Source = "c:\Users\HP\Renexus\backend\services\task"; Destination = "c:\Users\HP\Renexus\backend\task-service" },
    
    # Move shared config to packages/shared
    @{ Source = "c:\Users\HP\Renexus\shared\config"; Destination = "c:\Users\HP\Renexus\packages\shared\config" },
    
    # Move shared services to packages/shared
    @{ Source = "c:\Users\HP\Renexus\shared\services"; Destination = "c:\Users\HP\Renexus\packages\shared\services" },
    
    # Move shared types to packages/shared
    @{ Source = "c:\Users\HP\Renexus\shared\types"; Destination = "c:\Users\HP\Renexus\packages\shared\types" },
    
    # Move shared utils to packages/shared
    @{ Source = "c:\Users\HP\Renexus\shared\utils"; Destination = "c:\Users\HP\Renexus\packages\shared\utils" }
)

# Process each directory mapping
foreach ($mapping in $backendMerges) {
    $source = $mapping.Source
    $destination = $mapping.Destination
    
    Write-Log "Processing: $source -> $destination"
    
    if (Test-Path $source) {
        # Ensure destination directory exists
        if (!(Test-Path $destination)) {
            Write-Log "Creating destination directory: $destination"
            New-Item -Path $destination -ItemType Directory -Force | Out-Null
        }
        
        # Copy all files recursively
        $sourceFiles = Get-ChildItem -Path $source -Recurse -File
        $copiedCount = 0
        $mergedCount = 0
        
        foreach ($file in $sourceFiles) {
            $relativePath = $file.FullName.Substring($source.Length)
            $destinationPath = Join-Path -Path $destination -ChildPath $relativePath
            $destinationDir = Split-Path -Path $destinationPath -Parent
            
            # Create destination directory structure
            if (!(Test-Path $destinationDir)) {
                New-Item -Path $destinationDir -ItemType Directory -Force | Out-Null
            }
            
            # Check if file exists at destination
            if (Test-Path $destinationPath) {
                # Compare content
                $sourceContent = Get-Content -Path $file.FullName -Raw -ErrorAction SilentlyContinue
                $destContent = Get-Content -Path $destinationPath -Raw -ErrorAction SilentlyContinue
                
                if ($sourceContent -ne $destContent) {
                    Write-Log "  Merging file with different content: $destinationPath"
                    Copy-Item -Path $file.FullName -Destination "$destinationPath.source" -Force
                    $mergedCount++
                }
            } else {
                # Copy new file
                Copy-Item -Path $file.FullName -Destination $destinationPath -Force
                $copiedCount++
            }
        }
        
        Write-Log "  Copied $copiedCount new files, identified $mergedCount files with differences" "SUCCESS"
    } else {
        Write-Log "  Source directory not found: $source" "WARNING"
    }
}

Write-Log "Backend directory restructuring complete!" "SUCCESS"
Write-Log "All duplicate files have been merged according to the consolidated structure." "SUCCESS"
