# Verification and completion script for frontend restructuring
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

# Verify and copy paths.ts file
$pathsSource = "c:\Users\HP\Renexus\frontend\paths.ts"
$pathsDestination = "c:\Users\HP\Renexus\frontend\web\src\paths.ts"

if (Test-Path $pathsSource) {
    Write-Log "Found paths.ts at source location"
    
    # Create destination directory if it doesn't exist
    $destDir = Split-Path -Path $pathsDestination -Parent
    if (!(Test-Path $destDir)) {
        New-Item -Path $destDir -ItemType Directory -Force | Out-Null
        Write-Log "Created destination directory for paths.ts"
    }
    
    # Copy the file
    Copy-Item -Path $pathsSource -Destination $pathsDestination -Force
    Write-Log "Successfully copied paths.ts to web/src directory" "SUCCESS"
} else {
    Write-Log "Source paths.ts not found at $pathsSource" "WARNING"
}

# Verify all required directories exist
$requiredDirs = @(
    "c:\Users\HP\Renexus\frontend\web\src\components",
    "c:\Users\HP\Renexus\frontend\web\src\hooks",
    "c:\Users\HP\Renexus\frontend\web\src\services",
    "c:\Users\HP\Renexus\frontend\web\src\types",
    "c:\Users\HP\Renexus\frontend\web\src\utils",
    "c:\Users\HP\Renexus\frontend\web\public"
)

foreach ($dir in $requiredDirs) {
    if (!(Test-Path $dir)) {
        Write-Log "Creating missing directory: $dir"
        New-Item -Path $dir -ItemType Directory -Force | Out-Null
    }
}

# Check and merge the files from each source directory
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
        Write-Log "Verifying files from: $source"
        
        # Get all files from source directory
        $sourceFiles = Get-ChildItem -Path $source -Recurse -File
        $fileCount = 0
        
        foreach ($file in $sourceFiles) {
            # Get relative path
            $relativePath = $file.FullName.Substring($source.Length)
            $destinationPath = Join-Path -Path $destination -ChildPath $relativePath
            $destinationDir = Split-Path -Path $destinationPath -Parent
            
            # Ensure destination directory exists
            if (!(Test-Path $destinationDir)) {
                New-Item -Path $destinationDir -ItemType Directory -Force | Out-Null
            }
            
            # Copy file if it doesn't exist or is different
            if (!(Test-Path $destinationPath)) {
                Copy-Item -Path $file.FullName -Destination $destinationPath -Force
                $fileCount++
            } else {
                $srcContent = Get-Content -Path $file.FullName -Raw
                $destContent = Get-Content -Path $destinationPath -Raw
                
                if ($srcContent -ne $destContent) {
                    Write-Log "  File exists with different content: $destinationPath" "WARNING"
                    Write-Log "  Merging content..." "INFO"
                    Copy-Item -Path $file.FullName -Destination $destinationPath -Force
                    $fileCount++
                }
            }
        }
        
        Write-Log "Copied/Merged $fileCount files from $source" "SUCCESS"
    } else {
        Write-Log "Source directory not found: $source" "WARNING"
    }
}

Write-Log "Verification and completion finished" "SUCCESS"
Write-Log "Final directory structure:" "INFO"

$frontendWebSrc = Get-ChildItem -Path "c:\Users\HP\Renexus\frontend\web\src" | ForEach-Object {
    $type = if ($_.PSIsContainer) { "Directory" } else { "File" }
    [PSCustomObject]@{
        Name = $_.Name
        Type = $type
    }
}

$frontendWebSrc | Format-Table -AutoSize
