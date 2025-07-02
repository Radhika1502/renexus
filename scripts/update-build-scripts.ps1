# Update build scripts and configuration files to use the new directory paths
# This script updates package.json, tsconfig.json, and other configuration files

$ErrorActionPreference = "Stop"
$logFile = "build-scripts-update-$(Get-Date -Format 'yyyyMMdd_HHmmss').log"

function Write-Log {
    param (
        [string]$Message,
        [string]$Level = "INFO"
    )
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "$timestamp [$Level] - $Message" | Out-File -FilePath $logFile -Append
    Write-Host "[$Level] $Message"
}

Write-Log "Starting update of build scripts and configuration files..."

# Update root package.json
Write-Log "Updating root package.json..."
$rootPackageJson = Get-Content -Path "package.json" -Raw | ConvertFrom-Json
$updated = $false

# Update workspace paths if using workspaces
if ($rootPackageJson.workspaces) {
    $oldWorkspaces = $rootPackageJson.workspaces
    $newWorkspaces = @()
    
    foreach ($workspace in $oldWorkspaces) {
        $newWorkspace = $workspace
        
        # Update workspace paths
        if ($workspace -eq "frontend/*") {
            $newWorkspace = "frontend/web"
            $updated = $true
        }
        elseif ($workspace -eq "backend/*") {
            $newWorkspace = "backend/*"  # Keep as is, we're still using subdirectories
        }
        elseif ($workspace -eq "shared/*") {
            $newWorkspace = "packages/*"
            $updated = $true
        }
        
        $newWorkspaces += $newWorkspace
    }
    
    # Add new workspace paths if they don't exist
    if ($newWorkspaces -notcontains "packages/*") {
        $newWorkspaces += "packages/*"
        $updated = $true
    }
    
    $rootPackageJson.workspaces = $newWorkspaces
}

# Update scripts in root package.json
if ($rootPackageJson.scripts) {
    $scripts = $rootPackageJson.scripts.PSObject.Properties
    foreach ($script in $scripts) {
        $newValue = $script.Value
        
        # Update paths in scripts
        if ($script.Value -match "frontend/") {
            $newValue = $script.Value -replace "frontend/", "frontend/web/"
            $updated = $true
        }
        if ($script.Value -match "shared/") {
            $newValue = $script.Value -replace "shared/", "packages/"
            $updated = $true
        }
        
        $rootPackageJson.scripts.($script.Name) = $newValue
    }
}

# Write updated root package.json if changes were made
if ($updated) {
    $rootPackageJson | ConvertTo-Json -Depth 10 | Set-Content -Path "package.json" -Encoding UTF8
    Write-Log "Updated root package.json"
}

# Update tsconfig.json files
Write-Log "Updating tsconfig.json files..."
$tsconfigFiles = Get-ChildItem -Path "." -Recurse -Filter "tsconfig.json"
foreach ($file in $tsconfigFiles) {
    $content = Get-Content $file.FullName -Raw | ConvertFrom-Json
    $updated = $false
    
    # Update paths in compilerOptions
    if ($content.compilerOptions -and $content.compilerOptions.paths) {
        $paths = $content.compilerOptions.paths.PSObject.Properties
        $newPaths = @{}
        
        foreach ($path in $paths) {
            $key = $path.Name
            $values = $path.Value
            $newValues = @()
            
            foreach ($value in $values) {
                $newValue = $value
                
                # Update paths
                if ($value -match "^\.\.\/frontend\/") {
                    $newValue = $value -replace "^\.\.\/frontend\/", "../frontend/web/src/"
                    $updated = $true
                }
                elseif ($value -match "^\.\.\/shared\/") {
                    $newValue = $value -replace "^\.\.\/shared\/", "../packages/"
                    $updated = $true
                }
                elseif ($value -match "^\.\.\/backend\/services\/") {
                    $newValue = $value -replace "^\.\.\/backend\/services\/task", "../backend/task-service"
                    $updated = $true
                }
                
                $newValues += $newValue
            }
            
            $newPaths[$key] = $newValues
        }
        
        # Replace paths with updated ones
        if ($updated) {
            $content.compilerOptions.paths = [PSCustomObject]$newPaths
        }
    }
    
    # Write updated tsconfig.json if changes were made
    if ($updated) {
        $content | ConvertTo-Json -Depth 10 | Set-Content -Path $file.FullName -Encoding UTF8
        Write-Log "Updated $($file.FullName)"
    }
}

# Update next.config.js if it exists
$nextConfigPath = "frontend/web/next.config.js"
if (Test-Path $nextConfigPath) {
    Write-Log "Updating Next.js configuration..."
    $nextConfig = Get-Content $nextConfigPath -Raw
    $updated = $false
    
    # Update paths in Next.js config
    if ($nextConfig -match "\.\.\/shared\/") {
        $nextConfig = $nextConfig -replace "\.\.\/shared\/", "../../packages/"
        $updated = $true
    }
    
    if ($nextConfig -match "\.\.\/backend\/") {
        $nextConfig = $nextConfig -replace "\.\.\/backend\/services\/task", "../../backend/task-service"
        $updated = $true
    }
    
    # Write updated next.config.js if changes were made
    if ($updated) {
        $nextConfig | Set-Content -Path $nextConfigPath -Encoding UTF8
        Write-Log "Updated $nextConfigPath"
    }
}

# Update jest.config.js files
Write-Log "Updating Jest configuration files..."
$jestConfigFiles = Get-ChildItem -Path "." -Recurse -Filter "jest.config.js"
foreach ($file in $jestConfigFiles) {
    $content = Get-Content $file.FullName -Raw
    $updated = $false
    
    # Update paths in Jest config
    if ($content -match "\.\.\/frontend\/") {
        $content = $content -replace "\.\.\/frontend\/", "../frontend/web/src/"
        $updated = $true
    }
    
    if ($content -match "\.\.\/shared\/") {
        $content = $content -replace "\.\.\/shared\/", "../packages/"
        $updated = $true
    }
    
    if ($content -match "\.\.\/backend\/services\/") {
        $content = $content -replace "\.\.\/backend\/services\/task", "../backend/task-service"
        $updated = $true
    }
    
    # Write updated jest.config.js if changes were made
    if ($updated) {
        $content | Set-Content -Path $file.FullName -Encoding UTF8
        Write-Log "Updated $($file.FullName)"
    }
}

# Update docker-compose.yml if it exists
$dockerComposePath = "docker-compose.yml"
if (Test-Path $dockerComposePath) {
    Write-Log "Updating Docker Compose configuration..."
    $dockerCompose = Get-Content $dockerComposePath -Raw
    $updated = $false
    
    # Update paths in Docker Compose
    if ($dockerCompose -match "./frontend:") {
        $dockerCompose = $dockerCompose -replace "./frontend:", "./frontend/web:"
        $updated = $true
    }
    
    if ($dockerCompose -match "./shared:") {
        $dockerCompose = $dockerCompose -replace "./shared:", "./packages:"
        $updated = $true
    }
    
    # Write updated docker-compose.yml if changes were made
    if ($updated) {
        $dockerCompose | Set-Content -Path $dockerComposePath -Encoding UTF8
        Write-Log "Updated $dockerComposePath"
    }
}

# Update .env files to reflect new paths
Write-Log "Updating environment files..."
$envFiles = Get-ChildItem -Path "." -Recurse -Include ".env", ".env.*" -File
foreach ($file in $envFiles) {
    $content = Get-Content $file.FullName -Raw
    $updated = $false
    
    # Update paths in environment variables
    if ($content -match "PATH_TO_FRONTEND=") {
        $content = $content -replace "PATH_TO_FRONTEND=frontend", "PATH_TO_FRONTEND=frontend/web"
        $updated = $true
    }
    
    if ($content -match "PATH_TO_SHARED=") {
        $content = $content -replace "PATH_TO_SHARED=shared", "PATH_TO_SHARED=packages"
        $updated = $true
    }
    
    # Write updated .env file if changes were made
    if ($updated) {
        $content | Set-Content -Path $file.FullName -Encoding UTF8
        Write-Log "Updated $($file.FullName)"
    }
}

Write-Log "Build scripts and configuration files update completed."
