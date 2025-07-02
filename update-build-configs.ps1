# Update build scripts and configuration files to use the new directory paths
$ErrorActionPreference = "Stop"
$logFile = "build-configs-update-$(Get-Date -Format 'yyyyMMdd_HHmmss').log"

function Write-Log {
    param (
        [string]$Message
    )
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "$timestamp - $Message" | Out-File -FilePath $logFile -Append
    Write-Host $Message
}

Write-Log "Starting update of build scripts and configuration files..."

# Update package.json files
Write-Log "Updating package.json files..."
$packageJsonFiles = Get-ChildItem -Path "." -Recurse -Filter "package.json" -Exclude "node_modules"
$updatedPackageJsonFiles = 0

foreach ($file in $packageJsonFiles) {
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    $updated = $false
    
    # Update paths in package.json
    if ($content -match "frontend/") {
        $content = $content -replace "frontend/(?!web)", "frontend/web/"
        $updated = $true
    }
    
    if ($content -match "shared/") {
        $content = $content -replace "shared/", "packages/"
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
        Write-Log "Updated $($file.FullName)"
    }
}

Write-Log "Updated $updatedPackageJsonFiles package.json files."

# Update tsconfig.json files
Write-Log "Updating tsconfig.json files..."
$tsconfigFiles = Get-ChildItem -Path "." -Recurse -Filter "tsconfig.json" -Exclude "node_modules"
$updatedTsconfigFiles = 0

foreach ($file in $tsconfigFiles) {
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    $updated = $false
    
    # Update paths in tsconfig.json
    if ($content -match "frontend/") {
        $content = $content -replace "frontend/(?!web)", "frontend/web/"
        $updated = $true
    }
    
    if ($content -match "shared/") {
        $content = $content -replace "shared/", "packages/"
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
        Write-Log "Updated $($file.FullName)"
    }
}

Write-Log "Updated $updatedTsconfigFiles tsconfig.json files."

# Update next.config.js files
Write-Log "Updating Next.js configuration files..."
$nextConfigFiles = Get-ChildItem -Path "." -Recurse -Filter "next.config.js" -Exclude "node_modules"
$updatedNextConfigFiles = 0

foreach ($file in $nextConfigFiles) {
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    $updated = $false
    
    # Update paths in next.config.js
    if ($content -match "frontend/") {
        $content = $content -replace "frontend/(?!web)", "frontend/web/"
        $updated = $true
    }
    
    if ($content -match "shared/") {
        $content = $content -replace "shared/", "packages/"
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
        $updatedNextConfigFiles++
        Write-Log "Updated $($file.FullName)"
    }
}

Write-Log "Updated $updatedNextConfigFiles Next.js configuration files."

# Update jest.config.js files
Write-Log "Updating Jest configuration files..."
$jestConfigFiles = Get-ChildItem -Path "." -Recurse -Filter "jest.config.js" -Exclude "node_modules"
$updatedJestConfigFiles = 0

foreach ($file in $jestConfigFiles) {
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    $updated = $false
    
    # Update paths in jest.config.js
    if ($content -match "frontend/") {
        $content = $content -replace "frontend/(?!web)", "frontend/web/"
        $updated = $true
    }
    
    if ($content -match "shared/") {
        $content = $content -replace "shared/", "packages/"
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
        $updatedJestConfigFiles++
        Write-Log "Updated $($file.FullName)"
    }
}

Write-Log "Updated $updatedJestConfigFiles Jest configuration files."

# Update docker-compose.yml if it exists
$dockerComposePath = "docker-compose.yml"
if (Test-Path $dockerComposePath) {
    Write-Log "Updating Docker Compose configuration..."
    $content = Get-Content $dockerComposePath -Raw
    $originalContent = $content
    $updated = $false
    
    # Update paths in docker-compose.yml
    if ($content -match "frontend/") {
        $content = $content -replace "frontend/(?!web)", "frontend/web/"
        $updated = $true
    }
    
    if ($content -match "shared/") {
        $content = $content -replace "shared/", "packages/"
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
        Write-Log "Updated $dockerComposePath"
    }
}

Write-Log "Build scripts and configuration files update completed."
