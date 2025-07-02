# Script to compare files between source and destination folders
$ErrorActionPreference = "Stop"

function Compare-FileContents {
    param (
        [string]$sourceFile,
        [string]$destinationFile
    )
    
    try {
        $sourceContent = [System.IO.File]::ReadAllText($sourceFile).Trim()
        $destContent = [System.IO.File]::ReadAllText($destinationFile).Trim()
        
        # Normalize line endings
        $sourceNormalized = $sourceContent -replace '\r\n?|\n', "`r`n"
        $destNormalized = $destContent -replace '\r\n?|\n', "`r`n"
        
        return $sourceNormalized -eq $destNormalized
    }
    catch {
        Write-Host "Error comparing $sourceFile and $destinationFile : $_" -ForegroundColor Red
        return $false
    }
}

# Define source and destination folders
$sourceRoot = "c:\Users\HP\Renexus\frontend"
$destRoot = "c:\Users\HP\Renexus\frontend\web\src"

$foldersToCompare = @(
    @{ Source = "components"; Destination = "components" },
    @{ Source = "hooks"; Destination = "hooks" },
    @{ Source = "services"; Destination = "services" },
    @{ Source = "types"; Destination = "types" },
    @{ Source = "utils"; Destination = "utils" }
)

$differencesFound = $false

foreach ($folder in $foldersToCompare) {
    $sourcePath = Join-Path $sourceRoot $folder.Source
    $destPath = Join-Path $destRoot $folder.Destination
    
    Write-Host "`nComparing $sourcePath with $destPath" -ForegroundColor Cyan
    Write-Host "========================================"
    
    if (-not (Test-Path $sourcePath) -or -not (Test-Path $destPath)) {
        Write-Host "  One of the paths doesn't exist. Skipping..." -ForegroundColor Yellow
        continue
    }
    
    $sourceFiles = Get-ChildItem -Path $sourcePath -Recurse -File
    $diffCount = 0
    
    foreach ($file in $sourceFiles) {
        $relativePath = $file.FullName.Substring($sourcePath.Length + 1)
        $destFile = Join-Path $destPath $relativePath
        
        if (Test-Path $destFile) {
            $areSame = Compare-FileContents -sourceFile $file.FullName -destinationFile $destFile
            
            if (-not $areSame) {
                $diffCount++
                $differencesFound = $true
                Write-Host "  DIFFERENT: $relativePath" -ForegroundColor Red
                
                # Show a sample of the differences
                $sourceContent = [System.IO.File]::ReadAllText($file.FullName).Split("`n")[0..4] -join "`n"
                $destContent = [System.IO.File]::ReadAllText($destFile).Split("`n")[0..4] -join "`n"
                
                Write-Host "  Source start:"
                Write-Host $sourceContent -ForegroundColor Yellow
                Write-Host "  Destination start:"
                Write-Host $destContent -ForegroundColor Yellow
                Write-Host "  ---"
            }
        } else {
            Write-Host "  MISSING in destination: $relativePath" -ForegroundColor Yellow
            $differencesFound = $true
        }
    }
    
    if ($diffCount -gt 0) {
        Write-Host "  Found $diffCount files with differences in $($folder.Source)" -ForegroundColor Red
    } else {
        Write-Host "  No differences found in $($folder.Source)" -ForegroundColor Green
    }
}

if (-not $differencesFound) {
    Write-Host "`nNo differences found between source and destination folders." -ForegroundColor Green
} else {
    Write-Host "`nDifferences were found between source and destination folders." -ForegroundColor Red
}
