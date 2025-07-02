# Script to merge duplicate folders into their respective locations under frontend/web/src/
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

# Define source and destination folder mappings
$folderMappings = @(
    @{
        Source = "c:\Users\HP\Renexus\frontend\components"
        Destination = "c:\Users\HP\Renexus\frontend\web\src\components"
    },
    @{
        Source = "c:\Users\HP\Renexus\frontend\hooks"
        Destination = "c:\Users\HP\Renexus\frontend\web\src\hooks"
    },
    @{
        Source = "c:\Users\HP\Renexus\frontend\services"
        Destination = "c:\Users\HP\Renexus\frontend\web\src\services"
    },
    @{
        Source = "c:\Users\HP\Renexus\frontend\types"
        Destination = "c:\Users\HP\Renexus\frontend\web\src\types"
    },
    @{
        Source = "c:\Users\HP\Renexus\frontend\utils"
        Destination = "c:\Users\HP\Renexus\frontend\web\src\utils"
    },
    @{
        Source = "c:\Users\HP\Renexus\frontend\public"
        Destination = "c:\Users\HP\Renexus\frontend\web\public"
    }
)

# Process each mapping
foreach ($mapping in $folderMappings) {
    $source = $mapping.Source
    $destination = $mapping.Destination
    
    Write-Log "Processing: $source -> $destination"
    
    # Check if source exists
    if (-not (Test-Path $source)) {
        Write-Log "  Source folder does not exist: $source" "WARNING"
        continue
    }
    
    # Create destination if it doesn't exist
    if (-not (Test-Path $destination)) {
        Write-Log "  Creating destination folder: $destination"
        New-Item -Path $destination -ItemType Directory -Force | Out-Null
    }
    
    # Get all files from source
    $files = Get-ChildItem -Path $source -Recurse -File
    $copiedCount = 0
    $skippedCount = 0
    $mergedCount = 0
    
    foreach ($file in $files) {
        $relativePath = $file.FullName.Substring($source.Length + 1)  # +1 to remove leading backslash
        $destinationPath = Join-Path -Path $destination -ChildPath $relativePath
        $destinationDir = Split-Path -Path $destinationPath -Parent
        
        # Create subdirectories if they don't exist
        if (-not (Test-Path $destinationDir)) {
            New-Item -Path $destinationDir -ItemType Directory -Force | Out-Null
        }
        
        # Check if file already exists at destination
        if (Test-Path $destinationPath) {
            $sourceContent = [System.IO.File]::ReadAllText($file.FullName).Trim()
            $destContent = [System.IO.File]::ReadAllText($destinationPath).Trim()
            
            # Normalize line endings for comparison
            $sourceNormalized = $sourceContent -replace '\r\n?|\n', "`r`n"
            $destNormalized = $destContent -replace '\r\n?|\n', "`r`n"
            
            if ($sourceNormalized -ne $destNormalized) {
                # Files are different, create a merged version with both contents
                $timestamp = Get-Date -Format "yyyyMMddHHmmss"
                $newFileName = [System.IO.Path]::GetFileNameWithoutExtension($file.Name) + ".merged-$timestamp" + [System.IO.Path]::GetExtension($file.Name)
                $newDestinationPath = Join-Path (Split-Path $destinationPath -Parent) $newFileName
                
                $mergedContent = @"
// ==================================================
// MERGED FILE - Original: $($file.FullName)
// ==================================================
$sourceContent

// ==================================================
// EXISTING FILE: $destinationPath
// ==================================================
$destContent
"@
                
                Set-Content -Path $newDestinationPath -Value $mergedContent -Force
                Write-Log "  Created merged file: $newFileName" "WARNING"
                $mergedCount++
            } else {
                $skippedCount++
            }
        } else {
            # File doesn't exist at destination, copy it
            Copy-Item -Path $file.FullName -Destination $destinationPath -Force
            $copiedCount++
        }
    }
    
    Write-Log "  Copied: $copiedCount files" "SUCCESS"
    Write-Log "  Skipped: $skippedCount files (already exist with same content)" "INFO"
    Write-Log "  Merged: $mergedCount files (created .merged versions)" "WARNING"
}

Write-Log "Merge operation completed!" "SUCCESS"
Write-Log "All files have been merged into their respective locations under frontend/web/" "SUCCESS"
Write-Log "Merged files with conflicts have been saved with .merged. extension" "WARNING"

# Show the new structure
Write-Log "`nFinal directory structure:" "INFO"
$frontendStructure = Get-ChildItem -Path "c:\Users\HP\Renexus\frontend" -Recurse -Directory | 
    Where-Object { $_.FullName -match 'web/src' -or $_.FullName -match 'web/public' } |
    Sort-Object FullName

$currentPath = ""
foreach ($dir in $frontendStructure) {
    $relativePath = $dir.FullName.Replace("c:\\Users\\HP\\Renexus\\frontend\\", "")
    $indent = "  " * ($relativePath.Split('\').Length - 1)
    Write-Host "$indent$($dir.Name)/"
}

Write-Log "`nYou can find all your files in the frontend/web/ directory structure." "SUCCESS"
