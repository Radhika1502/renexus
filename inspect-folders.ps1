# Script to inspect and compare folder contents in detail
$ErrorActionPreference = "Stop"

# Define source and destination folders
$sourceRoot = "c:\Users\HP\Renexus\frontend"
$destRoot = "c:\Users\HP\Renexus\frontend\web\src"

$foldersToInspect = @(
    @{ Name = "components"; Source = "components"; Destination = "components" },
    @{ Name = "hooks"; Source = "hooks"; Destination = "hooks" },
    @{ Name = "services"; Source = "services"; Destination = "services" },
    @{ Name = "types"; Source = "types"; Destination = "types" },
    @{ Name = "utils"; Source = "utils"; Destination = "utils" }
)

foreach ($folder in $foldersToInspect) {
    $sourcePath = Join-Path $sourceRoot $folder.Source
    $destPath = Join-Path $destRoot $folder.Destination
    
    Write-Host "`nInspecting $($folder.Name)" -ForegroundColor Cyan
    Write-Host "========================================"
    
    # Check if paths exist
    if (-not (Test-Path $sourcePath)) {
        Write-Host "  Source path does not exist: $sourcePath" -ForegroundColor Red
        continue
    }
    
    if (-not (Test-Path $destPath)) {
        Write-Host "  Destination path does not exist: $destPath" -ForegroundColor Red
        continue
    }
    
    # Get all files in source and destination
    $sourceFiles = Get-ChildItem -Path $sourcePath -Recurse -File | ForEach-Object { $_.FullName }
    $destFiles = Get-ChildItem -Path $destPath -Recurse -File | ForEach-Object { $_.FullName }
    
    Write-Host "  Source files count: $($sourceFiles.Count)"
    Write-Host "  Destination files count: $($destFiles.Count)"
    
    # Compare file counts in subdirectories
    $sourceDirs = Get-ChildItem -Path $sourcePath -Directory -Recurse | 
        ForEach-Object { $_.FullName } | 
        Sort-Object
    
    $destDirs = Get-ChildItem -Path $destPath -Directory -Recurse | 
        ForEach-Object { $_.FullName } | 
        Sort-Object
    
    Write-Host "`n  Directory Structure Comparison:"
    Write-Host "  -----------------------------"
    
    # Find unique directories
    $uniqueInSource = $sourceDirs | Where-Object { $_ -notin $destDirs }
    $uniqueInDest = $destDirs | Where-Object { $_ -notin $sourceDirs }
    
    if ($uniqueInSource) {
        Write-Host "  Directories only in source:" -ForegroundColor Yellow
        $uniqueInSource | ForEach-Object { 
            $relPath = $_.Substring($sourcePath.Length)
            $fileCount = (Get-ChildItem -Path $_ -File -Recurse).Count
            Write-Host "    $relPath ($fileCount files)" 
        }
    }
    
    if ($uniqueInDest) {
        Write-Host "  Directories only in destination:" -ForegroundColor Yellow
        $uniqueInDest | ForEach-Object { 
            $relPath = $_.Substring($destPath.Length)
            $fileCount = (Get-ChildItem -Path $_ -File -Recurse).Count
            Write-Host "    $relPath ($fileCount files)" 
        }
    }
    
    # Sample some files for comparison
    Write-Host "`n  Sample file comparison:"
    Write-Host "  -----------------------"
    
    $sampleFiles = $sourceFiles | Select-Object -First 3
    foreach ($file in $sampleFiles) {
        $relPath = $file.Substring($sourcePath.Length + 1)
        $destFile = Join-Path $destPath $relPath
        
        if (Test-Path $destFile) {
            $sourceContent = [System.IO.File]::ReadAllText($file).Trim()
            $destContent = [System.IO.File]::ReadAllText($destFile).Trim()
            
            $sourceHash = [System.BitConverter]::ToString(
                [System.Security.Cryptography.SHA256]::Create().ComputeHash(
                    [System.Text.Encoding]::UTF8.GetBytes($sourceContent)
                )
            )
            
            $destHash = [System.BitConverter]::ToString(
                [System.Security.Cryptography.SHA256]::Create().ComputeHash(
                    [System.Text.Encoding]::UTF8.GetBytes($destContent)
                )
            )
            
            $status = if ($sourceHash -eq $destHash) { "SAME" } else { "DIFFERENT" }
            $color = if ($status -eq "SAME") { "Green" } else { "Red" }
            
            Write-Host "  $relPath : $status" -ForegroundColor $color
            
            if ($status -eq "DIFFERENT") {
                Write-Host "    Source length: $($sourceContent.Length) chars" -ForegroundColor Yellow
                Write-Host "    Dest length  : $($destContent.Length) chars" -ForegroundColor Yellow
                
                # Show first 5 different lines
                $sourceLines = $sourceContent -split "`r?`n"
                $destLines = $destContent -split "`r?`n"
                
                $diffLines = Compare-Object $sourceLines $destLines | 
                    Where-Object { $_.SideIndicator -eq "<=" } | 
                    Select-Object -First 5
                
                if ($diffLines) {
                    Write-Host "    First differences:" -ForegroundColor Yellow
                    $diffLines | ForEach-Object {
                        Write-Host "      > $($_.InputObject)" -ForegroundColor Yellow
                    }
                }
            }
        } else {
            Write-Host "  $relPath : MISSING in destination" -ForegroundColor Yellow
        }
    }
    
    Write-Host "`n" + ("-" * 80) + "`n"
}
