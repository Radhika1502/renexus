# Script to update configuration files after directory restructuring
Write-Host "Updating configuration files..." -ForegroundColor Cyan

# Update package.json files
Write-Host "Updating package.json files..."
$packageJsonFiles = Get-ChildItem -Path "." -Recurse -Filter "package.json" -Exclude "node_modules"
$updatedPackageJsonFiles = 0

foreach ($file in $packageJsonFiles) {
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    $updated = $false
    
    # Update paths in package.json
    if ($content -match "frontend/components") {
        $content = $content -replace "frontend/components", "frontend/web/src/components"
        $updated = $true
    }
    
    if ($content -match "shared/") {
        $content = $content -replace "shared/", "packages/shared/"
        $updated = $true
    }
    
    if ($content -match "backend/services/task") {
        $content = $content -replace "backend/services/task", "backend/task-service"
        $updated = $true
    }
    
    if ($content -match "backend/api/") {
        $content = $content -replace "backend/api/", "backend/api-gateway/"
        $updated = $true
    }
    
    if ($updated) {
        $content | Set-Content -Path $file.FullName -Encoding UTF8
        $updatedPackageJsonFiles++
        Write-Host "Updated: $($file.FullName)" -ForegroundColor Green
    }
}

Write-Host "Updated $updatedPackageJsonFiles package.json files."

# Update tsconfig.json files
Write-Host "`nUpdating tsconfig.json files..."
$tsconfigFiles = Get-ChildItem -Path "." -Recurse -Filter "tsconfig.json" -Exclude "node_modules"
$updatedTsconfigFiles = 0

foreach ($file in $tsconfigFiles) {
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    $updated = $false
    
    # Update paths in tsconfig.json
    if ($content -match "frontend/components") {
        $content = $content -replace "frontend/components", "frontend/web/src/components"
        $updated = $true
    }
    
    if ($content -match "shared/") {
        $content = $content -replace "shared/", "packages/shared/"
        $updated = $true
    }
    
    if ($content -match "backend/services/task") {
        $content = $content -replace "backend/services/task", "backend/task-service"
        $updated = $true
    }
    
    if ($content -match "backend/api/") {
        $content = $content -replace "backend/api/", "backend/api-gateway/"
        $updated = $true
    }
    
    if ($updated) {
        $content | Set-Content -Path $file.FullName -Encoding UTF8
        $updatedTsconfigFiles++
        Write-Host "Updated: $($file.FullName)" -ForegroundColor Green
    }
}

Write-Host "Updated $updatedTsconfigFiles tsconfig.json files."

# Update docker-compose.yml if it exists
$dockerComposePath = "docker-compose.yml"
if (Test-Path $dockerComposePath) {
    Write-Host "`nUpdating Docker Compose configuration..."
    $content = Get-Content $dockerComposePath -Raw
    $originalContent = $content
    $updated = $false
    
    # Update paths in docker-compose.yml
    if ($content -match "frontend/components") {
        $content = $content -replace "frontend/components", "frontend/web/src/components"
        $updated = $true
    }
    
    if ($content -match "shared/") {
        $content = $content -replace "shared/", "packages/shared/"
        $updated = $true
    }
    
    if ($content -match "backend/services/task") {
        $content = $content -replace "backend/services/task", "backend/task-service"
        $updated = $true
    }
    
    if ($content -match "backend/api/") {
        $content = $content -replace "backend/api/", "backend/api-gateway/"
        $updated = $true
    }
    
    if ($updated) {
        $content | Set-Content -Path $dockerComposePath -Encoding UTF8
        Write-Host "Updated: $dockerComposePath" -ForegroundColor Green
    } else {
        Write-Host "No updates needed for: $dockerComposePath" -ForegroundColor Yellow
    }
}

Write-Host "`nConfiguration files update completed." -ForegroundColor Green
