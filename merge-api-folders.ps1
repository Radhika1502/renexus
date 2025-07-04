# Script to merge backend/api and backend/api-gateway folders
# This script will keep everything in api-gateway and merge unique files from api

$apiPath = "backend/api"
$apiGatewayPath = "backend/api-gateway"

Write-Host "Starting merge of $apiPath into $apiGatewayPath..." -ForegroundColor Cyan

# Create backup of both folders
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupDir = "backup_$timestamp"

Write-Host "Creating backups in $backupDir..." -ForegroundColor Yellow
New-Item -Path $backupDir -ItemType Directory -Force
Copy-Item -Path $apiPath -Destination "$backupDir/api" -Recurse -Force
Copy-Item -Path $apiGatewayPath -Destination "$backupDir/api-gateway" -Recurse -Force
Write-Host "Backups created successfully." -ForegroundColor Green

# Function to merge package.json dependencies
function Merge-PackageJson {
    param (
        [string]$sourceFile,
        [string]$targetFile
    )
    
    if (!(Test-Path $sourceFile) -or !(Test-Path $targetFile)) {
        Write-Host "One of the package.json files doesn't exist. Skipping merge." -ForegroundColor Red
        return
    }
    
    $sourceJson = Get-Content $sourceFile -Raw | ConvertFrom-Json
    $targetJson = Get-Content $targetFile -Raw | ConvertFrom-Json
    
    # Merge dependencies
    if ($sourceJson.dependencies -and $targetJson.dependencies) {
        $sourceJson.dependencies.PSObject.Properties | ForEach-Object {
            $name = $_.Name
            $version = $_.Value
            
            if (-not ($targetJson.dependencies.PSObject.Properties.Name -contains $name)) {
                $targetJson.dependencies | Add-Member -MemberType NoteProperty -Name $name -Value $version
            }
        }
    }
    
    # Merge devDependencies
    if ($sourceJson.devDependencies -and $targetJson.devDependencies) {
        $sourceJson.devDependencies.PSObject.Properties | ForEach-Object {
            $name = $_.Name
            $version = $_.Value
            
            if (-not ($targetJson.devDependencies.PSObject.Properties.Name -contains $name)) {
                $targetJson.devDependencies | Add-Member -MemberType NoteProperty -Name $name -Value $version
            }
        }
    }
    
    # Merge scripts
    if ($sourceJson.scripts -and $targetJson.scripts) {
        $sourceJson.scripts.PSObject.Properties | ForEach-Object {
            $name = $_.Name
            $script = $_.Value
            
            if (-not ($targetJson.scripts.PSObject.Properties.Name -contains $name)) {
                $targetJson.scripts | Add-Member -MemberType NoteProperty -Name $name -Value $script
            }
        }
    }
    
    # Save merged package.json
    $targetJson | ConvertTo-Json -Depth 10 | Set-Content $targetFile
    Write-Host "Merged package.json files." -ForegroundColor Green
}

# Merge package.json files
Write-Host "Merging package.json files..." -ForegroundColor Yellow
Merge-PackageJson "$apiPath/package.json" "$apiGatewayPath/package.json"

# Function to copy files that don't exist in the target directory
function Copy-UniqueFiles {
    param (
        [string]$sourcePath,
        [string]$targetPath,
        [string]$relativePath = ""
    )
    
    $currentSourcePath = Join-Path $sourcePath $relativePath
    $currentTargetPath = Join-Path $targetPath $relativePath
    
    # Create target directory if it doesn't exist
    if (!(Test-Path $currentTargetPath) -and (Test-Path $currentSourcePath)) {
        New-Item -Path $currentTargetPath -ItemType Directory -Force
    }
    
    # Get all files in the current source directory
    $sourceFiles = Get-ChildItem -Path $currentSourcePath -File
    
    foreach ($file in $sourceFiles) {
        $targetFile = Join-Path $currentTargetPath $file.Name
        
        if (!(Test-Path $targetFile)) {
            # File doesn't exist in target, copy it
            Copy-Item -Path $file.FullName -Destination $targetFile -Force
            Write-Host "Copied unique file: $($file.FullName) -> $targetFile" -ForegroundColor Green
        } else {
            # File exists in both, check if they are identical
            $sourceContent = Get-FileHash -Path $file.FullName -Algorithm MD5
            $targetContent = Get-FileHash -Path $targetFile -Algorithm MD5
            
            if ($sourceContent.Hash -ne $targetContent.Hash) {
                # Files are different, backup target file and copy source
                $backupFile = "$targetFile.bak"
                Copy-Item -Path $targetFile -Destination $backupFile -Force
                Copy-Item -Path $file.FullName -Destination "$targetFile.api" -Force
                Write-Host "Files differ, created backup: $backupFile and $targetFile.api" -ForegroundColor Yellow
            }
        }
    }
    
    # Process subdirectories
    $sourceDirectories = Get-ChildItem -Path $currentSourcePath -Directory
    
    foreach ($dir in $sourceDirectories) {
        $newRelativePath = Join-Path $relativePath $dir.Name
        Copy-UniqueFiles -sourcePath $sourcePath -targetPath $targetPath -relativePath $newRelativePath
    }
}

# Copy unique files from api to api-gateway
Write-Host "Copying unique files from $apiPath to $apiGatewayPath..." -ForegroundColor Yellow
Copy-UniqueFiles -sourcePath $apiPath -targetPath $apiGatewayPath

# Special handling for src directory to ensure we don't overwrite existing files
Write-Host "Handling src directory specifically..." -ForegroundColor Yellow
$apiSrcPath = Join-Path $apiPath "src"
$apiGatewaySrcPath = Join-Path $apiGatewayPath "src"

if (Test-Path $apiSrcPath) {
    # Check for unique files in src directory
    $apiSrcFiles = Get-ChildItem -Path $apiSrcPath -File
    foreach ($file in $apiSrcFiles) {
        $targetFile = Join-Path $apiGatewaySrcPath $file.Name
        if (!(Test-Path $targetFile)) {
            Copy-Item -Path $file.FullName -Destination $targetFile -Force
            Write-Host "Copied unique src file: $($file.Name)" -ForegroundColor Green
        }
    }
    
    # Check for unique directories in src
    $apiSrcDirs = Get-ChildItem -Path $apiSrcPath -Directory
    foreach ($dir in $apiSrcDirs) {
        $targetDir = Join-Path $apiGatewaySrcPath $dir.Name
        if (!(Test-Path $targetDir)) {
            Copy-Item -Path $dir.FullName -Destination $targetDir -Recurse -Force
            Write-Host "Copied unique src directory: $($dir.Name)" -ForegroundColor Green
        } else {
            # Directory exists in both, recursively check files
            Copy-UniqueFiles -sourcePath $dir.FullName -targetPath $targetDir
        }
    }
}

# Special handling for prisma directory
Write-Host "Handling prisma directory specifically..." -ForegroundColor Yellow
$apiPrismaPath = Join-Path $apiPath "prisma"
$apiGatewayPrismaPath = Join-Path $apiGatewayPath "prisma"

if (Test-Path $apiPrismaPath) {
    # Check for unique files in prisma directory
    $apiPrismaFiles = Get-ChildItem -Path $apiPrismaPath -File
    foreach ($file in $apiPrismaFiles) {
        $targetFile = Join-Path $apiGatewayPrismaPath $file.Name
        if (!(Test-Path $targetFile)) {
            Copy-Item -Path $file.FullName -Destination $targetFile -Force
            Write-Host "Copied unique prisma file: $($file.Name)" -ForegroundColor Green
        } elseif ($file.Name -eq "schema.prisma") {
            # For schema.prisma, we need to merge them carefully
            $backupFile = "$targetFile.bak"
            Copy-Item -Path $targetFile -Destination $backupFile -Force
            Copy-Item -Path $file.FullName -Destination "$targetFile.api" -Force
            Write-Host "Created backup of schema.prisma: $backupFile and $targetFile.api" -ForegroundColor Yellow
            Write-Host "IMPORTANT: You may need to manually merge the schema.prisma files!" -ForegroundColor Red
        }
    }
    
    # Check for unique directories in prisma
    $apiPrismaDirs = Get-ChildItem -Path $apiPrismaPath -Directory
    foreach ($dir in $apiPrismaDirs) {
        $targetDir = Join-Path $apiGatewayPrismaPath $dir.Name
        if (!(Test-Path $targetDir)) {
            Copy-Item -Path $dir.FullName -Destination $targetDir -Recurse -Force
            Write-Host "Copied unique prisma directory: $($dir.Name)" -ForegroundColor Green
        } else {
            # Directory exists in both, recursively check files
            Copy-UniqueFiles -sourcePath $dir.FullName -targetPath $targetDir
        }
    }
}

# Merge Jest config files
Write-Host "Merging Jest configuration files..." -ForegroundColor Yellow
$apiJestConfig = "$apiPath/jest.config.js"
$apiGatewayJestConfig = "$apiGatewayPath/jest.config.js"

if ((Test-Path $apiJestConfig) -and (Test-Path $apiGatewayJestConfig)) {
    Copy-Item -Path $apiJestConfig -Destination "$apiGatewayJestConfig.api" -Force
    Write-Host "Created backup of Jest config: $apiGatewayJestConfig.api" -ForegroundColor Yellow
    Write-Host "IMPORTANT: You may need to manually merge the Jest configuration files!" -ForegroundColor Red
}

Write-Host "Merge completed successfully!" -ForegroundColor Green
Write-Host "IMPORTANT: Please review the following files for manual merging:" -ForegroundColor Red
Write-Host "1. $apiGatewayPath/prisma/schema.prisma (check .api version)" -ForegroundColor Red
Write-Host "2. $apiGatewayPath/jest.config.js (check .api version)" -ForegroundColor Red
Write-Host "3. Any other files with .api extension" -ForegroundColor Red
Write-Host "4. You can safely remove the $apiPath directory after verifying everything works correctly" -ForegroundColor Red