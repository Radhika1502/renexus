# Script to merge remaining .api files
# This script will merge the remaining .api files with their originals

$apiGatewayPath = "backend/api-gateway"

Write-Host "Starting merge of remaining .api files..." -ForegroundColor Cyan

# Find all .api files
$apiFiles = Get-ChildItem -Path $apiGatewayPath -Recurse -Filter "*.api"

if ($apiFiles.Count -gt 0) {
    Write-Host "Found $($apiFiles.Count) files that need merging:" -ForegroundColor Yellow
    
    foreach ($file in $apiFiles) {
        # Get the original file path
        $originalFile = $file.FullName -replace "\.api$", ""
        $originalFileName = [System.IO.Path]::GetFileName($originalFile)
        
        Write-Host "Processing: $originalFileName" -ForegroundColor Yellow
        
        # Special handling for package.json
        if ($originalFileName -eq "package.json") {
            Write-Host "Merging package.json files..." -ForegroundColor Yellow
            
            $originalJson = Get-Content -Path $originalFile -Raw | ConvertFrom-Json
            $apiJson = Get-Content -Path $file.FullName -Raw | ConvertFrom-Json
            
            # Merge dependencies
            if ($apiJson.dependencies) {
                $apiJson.dependencies.PSObject.Properties | ForEach-Object {
                    $name = $_.Name
                    $version = $_.Value
                    
                    if (-not ($originalJson.dependencies.PSObject.Properties.Name -contains $name)) {
                        $originalJson.dependencies | Add-Member -MemberType NoteProperty -Name $name -Value $version
                        Write-Host "  Added dependency: $name $version" -ForegroundColor Green
                    }
                }
            }
            
            # Merge devDependencies
            if ($apiJson.devDependencies) {
                $apiJson.devDependencies.PSObject.Properties | ForEach-Object {
                    $name = $_.Name
                    $version = $_.Value
                    
                    if (-not ($originalJson.devDependencies.PSObject.Properties.Name -contains $name)) {
                        $originalJson.devDependencies | Add-Member -MemberType NoteProperty -Name $name -Value $version
                        Write-Host "  Added devDependency: $name $version" -ForegroundColor Green
                    }
                }
            }
            
            # Merge scripts
            if ($apiJson.scripts) {
                $apiJson.scripts.PSObject.Properties | ForEach-Object {
                    $name = $_.Name
                    $script = $_.Value
                    
                    if (-not ($originalJson.scripts.PSObject.Properties.Name -contains $name)) {
                        $originalJson.scripts | Add-Member -MemberType NoteProperty -Name $name -Value $script
                        Write-Host "  Added script: $name" -ForegroundColor Green
                    }
                }
            }
            
            # Save merged package.json
            $originalJson | ConvertTo-Json -Depth 10 | Set-Content -Path $originalFile
            Write-Host "  Merged package.json successfully" -ForegroundColor Green
            
            # Remove the .api file
            Remove-Item -Path $file.FullName -Force
            Write-Host "  Removed $($file.FullName)" -ForegroundColor Green
        }
        # Special handling for jest.config.js
        elseif ($originalFileName -eq "jest.config.js") {
            Write-Host "Merging jest.config.js files..." -ForegroundColor Yellow
            
            # Read both files
            $originalContent = Get-Content -Path $originalFile
            $apiContent = Get-Content -Path $file.FullName
            
            # Create a backup of the original file
            $backupFile = "$originalFile.bak"
            Copy-Item -Path $originalFile -Destination $backupFile -Force
            Write-Host "  Created backup: $backupFile" -ForegroundColor Yellow
            
            # Add a comment to the original file
            $mergedContent = @()
            $mergedContent += "// Merged from both api and api-gateway jest.config.js files"
            $mergedContent += $originalContent
            $mergedContent += "// Additional configuration from api/jest.config.js:"
            $mergedContent += $apiContent | Where-Object { $_ -match "moduleNameMapper" -or $_ -match "@/" }
            
            # Save the merged file
            $mergedContent | Set-Content -Path $originalFile
            Write-Host "  Merged jest.config.js successfully" -ForegroundColor Green
            
            # Remove the .api file
            Remove-Item -Path $file.FullName -Force
            Write-Host "  Removed $($file.FullName)" -ForegroundColor Green
        }
        # Special handling for schema.prisma
        elseif ($originalFileName -eq "schema.prisma") {
            Write-Host "Comparing schema.prisma files..." -ForegroundColor Yellow
            
            # Read both files
            $originalContent = Get-Content -Path $originalFile
            $apiContent = Get-Content -Path $file.FullName
            
            # Create a backup of the original file
            $backupFile = "$originalFile.bak"
            Copy-Item -Path $originalFile -Destination $backupFile -Force
            Write-Host "  Created backup: $backupFile" -ForegroundColor Yellow
            
            # Compare the models in both files
            $originalModels = @()
            $currentModel = ""
            foreach ($line in $originalContent) {
                if ($line -match "^model\s+(\w+)\s+{") {
                    $currentModel = $matches[1]
                    $originalModels += $currentModel
                }
            }
            
            $apiModels = @()
            $currentModel = ""
            foreach ($line in $apiContent) {
                if ($line -match "^model\s+(\w+)\s+{") {
                    $currentModel = $matches[1]
                    $apiModels += $currentModel
                }
            }
            
            # Find unique models in api file
            $uniqueModels = $apiModels | Where-Object { $originalModels -notcontains $_ }
            
            if ($uniqueModels.Count -gt 0) {
                Write-Host "  Found $($uniqueModels.Count) unique models in api schema.prisma:" -ForegroundColor Yellow
                foreach ($model in $uniqueModels) {
                    Write-Host "    - $model" -ForegroundColor Yellow
                }
                
                Write-Host "  Please manually merge the schema.prisma files." -ForegroundColor Red
                Write-Host "  Original file: $originalFile" -ForegroundColor Red
                Write-Host "  API file: $($file.FullName)" -ForegroundColor Red
            } else {
                Write-Host "  No unique models found in api schema.prisma. Using the api-gateway version." -ForegroundColor Green
                
                # Remove the .api file
                Remove-Item -Path $file.FullName -Force
                Write-Host "  Removed $($file.FullName)" -ForegroundColor Green
            }
        }
        # Default handling for other files
        else {
            Write-Host "Found file: $($file.FullName)" -ForegroundColor Yellow
            Write-Host "Please manually review and merge this file with $originalFile" -ForegroundColor Red
        }
    }
} else {
    Write-Host "No .api files found. All files have been merged." -ForegroundColor Green
}

Write-Host "Merge of remaining .api files complete!" -ForegroundColor Green 