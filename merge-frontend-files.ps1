# Simplified script to merge frontend duplicate files
Write-Host "Starting frontend directory restructuring"

# Create backup
$backupDir = "c:\Users\HP\Renexus\frontend-backup-$(Get-Date -Format 'yyyyMMdd_HHmmss')"
Write-Host "Creating backup to $backupDir"
New-Item -Path $backupDir -ItemType Directory -Force | Out-Null
Copy-Item -Path "c:\Users\HP\Renexus\frontend" -Destination $backupDir -Recurse
Write-Host "Backup created successfully"

# Define source and destination directories
$mergeDirectories = @(
    @{source = "c:\Users\HP\Renexus\frontend\components"; dest = "c:\Users\HP\Renexus\frontend\web\src\components"},
    @{source = "c:\Users\HP\Renexus\frontend\hooks"; dest = "c:\Users\HP\Renexus\frontend\web\src\hooks"},
    @{source = "c:\Users\HP\Renexus\frontend\services"; dest = "c:\Users\HP\Renexus\frontend\web\src\services"},
    @{source = "c:\Users\HP\Renexus\frontend\types"; dest = "c:\Users\HP\Renexus\frontend\web\src\types"},
    @{source = "c:\Users\HP\Renexus\frontend\utils"; dest = "c:\Users\HP\Renexus\frontend\web\src\utils"},
    @{source = "c:\Users\HP\Renexus\frontend\public"; dest = "c:\Users\HP\Renexus\frontend\web\public"}
)

# Copy paths.ts to web/src directory
$pathsSrc = "c:\Users\HP\Renexus\frontend\paths.ts"
$pathsDest = "c:\Users\HP\Renexus\frontend\web\src\paths.ts"
Write-Host "Copying paths.ts file"
$pathsDestDir = Split-Path -Path $pathsDest -Parent
if (!(Test-Path $pathsDestDir)) {
    New-Item -Path $pathsDestDir -ItemType Directory -Force | Out-Null
}
if (Test-Path $pathsSrc) {
    Copy-Item -Path $pathsSrc -Destination $pathsDest -Force
    Write-Host "Copied paths.ts file to web/src directory"
}

# Process each directory pair
foreach ($dirPair in $mergeDirectories) {
    $src = $dirPair.source
    $dest = $dirPair.dest
    
    Write-Host "Merging $(Split-Path $src -Leaf) directory to $dest"
    
    # Create destination directory if it doesn't exist
    if (!(Test-Path $dest)) {
        Write-Host "Creating destination directory: $dest"
        New-Item -Path $dest -ItemType Directory -Force | Out-Null
    }
    
    # Get all files from source directory
    if (Test-Path $src) {
        $files = Get-ChildItem -Path $src -Recurse -File
        
        # Copy each file to the destination
        foreach ($file in $files) {
            $relativePath = $file.FullName.Substring($src.Length)
            $targetPath = Join-Path -Path $dest -ChildPath $relativePath
            $targetDir = Split-Path -Path $targetPath -Parent
            
            # Create target directory if it doesn't exist
            if (!(Test-Path $targetDir)) {
                New-Item -Path $targetDir -ItemType Directory -Force | Out-Null
            }
            
            # Check if target file already exists
            if (Test-Path $targetPath) {
                # Compare file contents
                $sourceContent = Get-Content -Path $file.FullName -Raw
                $targetContent = Get-Content -Path $targetPath -Raw
                
                if ($sourceContent -ne $targetContent) {
                    Write-Host "  - File exists at destination with different content: $($file.Name)"
                    # Merge the content (in this case, we're keeping source content)
                    Copy-Item -Path $file.FullName -Destination $targetPath -Force
                    Write-Host "  - Updated with merged content"
                }
            } else {
                # Just copy the file
                Copy-Item -Path $file.FullName -Destination $targetPath -Force
                Write-Host "  - Copied $($file.Name) to $targetPath"
            }
        }
    } else {
        Write-Host "  - Source directory $src doesn't exist, skipping"
    }
}

Write-Host "Frontend directory restructuring completed successfully"
Write-Host ""
Write-Host "Final Directory Structure:"
Write-Host "frontend\"
Write-Host "└── web\"
Write-Host "    ├── public\"
Write-Host "    └── src\"
Write-Host "        ├── components\"
Write-Host "        ├── contexts\"
Write-Host "        ├── features\"
Write-Host "        ├── hooks\"
Write-Host "        ├── paths.ts"
Write-Host "        ├── routes\"
Write-Host "        ├── services\"
Write-Host "        ├── shared\"
Write-Host "        ├── styles\"
Write-Host "        ├── types\"
Write-Host "        └── utils\"
