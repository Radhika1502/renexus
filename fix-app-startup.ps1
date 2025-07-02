# Fix Application Startup Issues
# This script will fix issues preventing the application from starting after reorganization

Write-Host "Fixing Application Startup Issues..." -ForegroundColor Cyan
Write-Host "------------------------------------------" -ForegroundColor Cyan

# Define paths
$rootPath = "c:\Users\HP\Renexus"
$backendPath = "$rootPath\backend"
$frontendPath = "$rootPath\frontend"
$sharedPath = "$rootPath\shared"
$backendApiPath = "$backendPath\api"
$frontendWebPath = "$frontendPath\web"

# Create log file
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$logPath = "$rootPath\startup_fix_$timestamp.txt"
"Application Startup Fix Log - $(Get-Date)" | Out-File -FilePath $logPath -Force

# Function to log messages
function Write-Log {
    param (
        [string]$Message,
        [string]$Type = "INFO"
    )
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] [$Type] $Message"
    $logMessage | Out-File -FilePath $logPath -Append
    
    switch ($Type) {
        "INFO" { Write-Host $Message -ForegroundColor White }
        "SUCCESS" { Write-Host $Message -ForegroundColor Green }
        "WARNING" { Write-Host $Message -ForegroundColor Yellow }
        "ERROR" { Write-Host $Message -ForegroundColor Red }
        default { Write-Host $Message }
    }
}

# Function to copy shared directories to backend and frontend
function Copy-SharedDirectories {
    param (
        [string]$SourcePath,
        [string]$TargetPath,
        [string]$Description
    )
    
    try {
        # Create target directory if it doesn't exist
        if (-not (Test-Path $TargetPath)) {
            New-Item -Path $TargetPath -ItemType Directory -Force | Out-Null
        }
        
        # Copy shared directories
        Write-Log "Copying shared directories to $Description..." "INFO"
        
        # Copy config directory
        $configSource = Join-Path $SourcePath "config"
        $configTarget = Join-Path $TargetPath "config"
        
        if (Test-Path $configSource) {
            if (-not (Test-Path $configTarget)) {
                Copy-Item -Path $configSource -Destination $configTarget -Recurse -Force
                Write-Log "Copied config directory to $Description" "SUCCESS"
            } else {
                Write-Log "Config directory already exists in $Description" "WARNING"
            }
        } else {
            Write-Log "Config source directory not found" "ERROR"
        }
        
        # Copy types directory
        $typesSource = Join-Path $SourcePath "types"
        $typesTarget = Join-Path $TargetPath "types"
        
        if (Test-Path $typesSource) {
            if (-not (Test-Path $typesTarget)) {
                Copy-Item -Path $typesSource -Destination $typesTarget -Recurse -Force
                Write-Log "Copied types directory to $Description" "SUCCESS"
            } else {
                Write-Log "Types directory already exists in $Description" "WARNING"
            }
        } else {
            Write-Log "Types source directory not found" "ERROR"
        }
        
        # Copy utils directory
        $utilsSource = Join-Path $SourcePath "utils"
        $utilsTarget = Join-Path $TargetPath "utils"
        
        if (Test-Path $utilsSource) {
            if (-not (Test-Path $utilsTarget)) {
                Copy-Item -Path $utilsSource -Destination $utilsTarget -Recurse -Force
                Write-Log "Copied utils directory to $Description" "SUCCESS"
            } else {
                Write-Log "Utils directory already exists in $Description" "WARNING"
            }
        } else {
            Write-Log "Utils source directory not found" "ERROR"
        }
        
        return $true
    }
    catch {
        Write-Log "Error copying shared directories: $_" "ERROR"
        return $false
    }
}

# Function to update package.json scripts
function Update-PackageJsonScripts {
    param (
        [string]$PackageJsonPath
    )
    
    try {
        if (Test-Path $PackageJsonPath) {
            Write-Log "Updating scripts in $PackageJsonPath..." "INFO"
            
            $packageJson = Get-Content -Path $PackageJsonPath -Raw | ConvertFrom-Json
            $modified = $false
            
            # Check and update scripts
            if ($packageJson.scripts) {
                foreach ($scriptName in $packageJson.scripts.PSObject.Properties.Name) {
                    $scriptValue = $packageJson.scripts.$scriptName
                    
                    # Update paths in scripts
                    if ($scriptValue -match "\.\.\/types\/") {
                        $packageJson.scripts.$scriptName = $scriptValue -replace "\.\.\/types\/", "./types/"
                        $modified = $true
                        Write-Log "Updated script $scriptName in package.json: ../types/ -> ./types/" "INFO"
                    }
                    
                    if ($scriptValue -match "\.\.\/config\/") {
                        $packageJson.scripts.$scriptName = $scriptValue -replace "\.\.\/config\/", "./config/"
                        $modified = $true
                        Write-Log "Updated script $scriptName in package.json: ../config/ -> ./config/" "INFO"
                    }
                    
                    if ($scriptValue -match "\.\.\/utils\/") {
                        $packageJson.scripts.$scriptName = $scriptValue -replace "\.\.\/utils\/", "./utils/"
                        $modified = $true
                        Write-Log "Updated script $scriptName in package.json: ../utils/ -> ./utils/" "INFO"
                    }
                }
            }
            
            # Save changes if modified
            if ($modified) {
                $packageJson | ConvertTo-Json -Depth 10 | Set-Content -Path $PackageJsonPath
                Write-Log "Updated scripts in package.json" "SUCCESS"
            } else {
                Write-Log "No script updates needed in package.json" "INFO"
            }
            
            return $true
        } else {
            Write-Log "package.json not found at $PackageJsonPath" "ERROR"
            return $false
        }
    }
    catch {
        Write-Log "Error updating package.json: $_" "ERROR"
        return $false
    }
}

# Copy shared directories to backend and frontend
Copy-SharedDirectories -SourcePath $sharedPath -TargetPath $backendPath -Description "backend"
Copy-SharedDirectories -SourcePath $sharedPath -TargetPath $frontendPath -Description "frontend"

# Update package.json scripts
Update-PackageJsonScripts -PackageJsonPath "$backendApiPath\package.json"
Update-PackageJsonScripts -PackageJsonPath "$frontendWebPath\package.json"

# Create a new start script that works with the reorganized structure
$startScriptPath = "$rootPath\start-fixed-app.ps1"
$startScriptContent = @"
# Script to start the fixed Renexus application
Write-Host "Starting Fixed Renexus Application..." -ForegroundColor Cyan
Write-Host "------------------------------------------" -ForegroundColor Cyan

# First, ensure we're in the project root
Set-Location -Path `$PSScriptRoot

# Define paths
`$rootPath = `$PSScriptRoot
`$backendApiPath = Join-Path `$rootPath "backend\api"
`$frontendWebPath = Join-Path `$rootPath "frontend\web"

# Start backend
Write-Host "Starting backend server..." -ForegroundColor Yellow
Start-Process -FilePath "powershell" -ArgumentList "-Command", "Set-Location -Path '`$backendApiPath'; npm run dev" -WindowStyle Normal

# Wait for backend to initialize
Write-Host "Waiting for backend to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Start frontend
Write-Host "Starting frontend server..." -ForegroundColor Yellow
Start-Process -FilePath "powershell" -ArgumentList "-Command", "Set-Location -Path '`$frontendWebPath'; npx.cmd next dev" -WindowStyle Normal

Write-Host "Application started!" -ForegroundColor Green
Write-Host "- Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "- Backend: http://localhost:3001" -ForegroundColor Cyan
Write-Host "Wait a few moments, then access the application in your browser." -ForegroundColor Yellow
"@

Set-Content -Path $startScriptPath -Value $startScriptContent
Write-Log "Created new start script at $startScriptPath" "SUCCESS"

Write-Host "Application startup fixes complete!" -ForegroundColor Green
Write-Host "Log file created at: $logPath" -ForegroundColor Cyan
Write-Host "" -ForegroundColor White
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Try running the application with .\start-fixed-app.ps1" -ForegroundColor Yellow
Write-Host "2. If issues persist, you may need to run 'npm install' in both the backend and frontend directories" -ForegroundColor Yellow
