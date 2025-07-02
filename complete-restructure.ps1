# Complete Frontend Restructuring Script
$ErrorActionPreference = "Stop"

function Write-Status {
    param (
        [string]$Message,
        [string]$Type = "INFO"
    )
    
    $color = switch ($Type) {
        "INFO" { "White" }
        "SUCCESS" { "Green" }
        "ERROR" { "Red" }
        default { "White" }
    }
    
    Write-Host "[$Type] $Message" -ForegroundColor $color
}

# Create backup
$backupDir = "c:\Users\HP\Renexus\frontend-backup-$(Get-Date -Format 'yyyyMMdd_HHmmss')"
Write-Status "Creating backup to $backupDir"
New-Item -Path $backupDir -ItemType Directory -Force | Out-Null
Copy-Item -Path "c:\Users\HP\Renexus\frontend" -Destination $backupDir -Recurse -Force
Write-Status "Backup created successfully" "SUCCESS"

# Make sure all destination directories exist
$destDirs = @(
    "c:\Users\HP\Renexus\frontend\web\src\components",
    "c:\Users\HP\Renexus\frontend\web\src\hooks",
    "c:\Users\HP\Renexus\frontend\web\src\services", 
    "c:\Users\HP\Renexus\frontend\web\src\types",
    "c:\Users\HP\Renexus\frontend\web\src\utils"
)

foreach ($dir in $destDirs) {
    if (!(Test-Path $dir)) {
        Write-Status "Creating directory: $dir"
        New-Item -Path $dir -ItemType Directory -Force | Out-Null
    }
}

# Copy and merge paths.ts
$pathsSource = "c:\Users\HP\Renexus\frontend\paths.ts"
$pathsDestination = "c:\Users\HP\Renexus\frontend\web\src\paths.ts"

if (Test-Path $pathsSource) {
    Write-Status "Copying paths.ts to web/src directory"
    Copy-Item -Path $pathsSource -Destination $pathsDestination -Force
    Write-Status "paths.ts copied successfully" "SUCCESS"
} else {
    Write-Status "Source paths.ts not found at $pathsSource" "ERROR"
}

# Define directory mappings for merging
$directoryMappings = @(
    @{ Source = "c:\Users\HP\Renexus\frontend\components"; Destination = "c:\Users\HP\Renexus\frontend\web\src\components" },
    @{ Source = "c:\Users\HP\Renexus\frontend\hooks"; Destination = "c:\Users\HP\Renexus\frontend\web\src\hooks" },
    @{ Source = "c:\Users\HP\Renexus\frontend\services"; Destination = "c:\Users\HP\Renexus\frontend\web\src\services" },
    @{ Source = "c:\Users\HP\Renexus\frontend\types"; Destination = "c:\Users\HP\Renexus\frontend\web\src\types" },
    @{ Source = "c:\Users\HP\Renexus\frontend\utils"; Destination = "c:\Users\HP\Renexus\frontend\web\src\utils" },
    @{ Source = "c:\Users\HP\Renexus\frontend\public"; Destination = "c:\Users\HP\Renexus\frontend\web\public" }
)

foreach ($mapping in $directoryMappings) {
    $source = $mapping.Source
    $destination = $mapping.Destination
    
    if (Test-Path $source) {
        Write-Status "Processing directory: $source"
        
        # Ensure destination directory exists
        if (!(Test-Path $destination)) {
            New-Item -Path $destination -ItemType Directory -Force | Out-Null
        }
        
        # Copy all files recursively
        $sourceFiles = Get-ChildItem -Path $source -Recurse -File
        
        foreach ($file in $sourceFiles) {
            $relativePath = $file.FullName.Substring($source.Length)
            $destinationPath = Join-Path -Path $destination -ChildPath $relativePath
            $destinationDir = Split-Path -Path $destinationPath -Parent
            
            # Create destination directory structure
            if (!(Test-Path $destinationDir)) {
                New-Item -Path $destinationDir -ItemType Directory -Force | Out-Null
            }
            
            # Copy file
            Copy-Item -Path $file.FullName -Destination $destinationPath -Force
            Write-Status "  Copied: $($file.FullName) to $destinationPath"
        }
    } else {
        Write-Status "Source directory not found: $source" "ERROR"
    }
}

Write-Status "Frontend directory restructuring complete!" "SUCCESS"
Write-Status "All duplicate files have been merged into the consolidated structure." "SUCCESS"

# List the new structure
Write-Status "Final directory structure:" "INFO"
Get-ChildItem -Path "c:\Users\HP\Renexus\frontend\web\src" | Format-Table -Property Name, @{Name="Type"; Expression={if($_.PSIsContainer){"Directory"}else{"File"}}}
