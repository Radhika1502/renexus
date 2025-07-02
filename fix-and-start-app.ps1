# Comprehensive Fix and Start Script for Renexus Application
# This script will fix issues after reorganization and start the application

Write-Host "Renexus Application Fix and Start" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan

# Define paths
$rootPath = $PSScriptRoot
$backendPath = Join-Path $rootPath "backend"
$frontendPath = Join-Path $rootPath "frontend"
$sharedPath = Join-Path $rootPath "shared"
$backendApiPath = Join-Path $backendPath "api"
$frontendWebPath = Join-Path $frontendPath "web"

# Create log file
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$logPath = Join-Path $rootPath "fix_and_start_$timestamp.log"
"Renexus Fix and Start Log - $(Get-Date)" | Out-File -FilePath $logPath -Force

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
        "SUCCESS" { Write-Host "✅ $Message" -ForegroundColor Green }
        "WARNING" { Write-Host "⚠️ $Message" -ForegroundColor Yellow }
        "ERROR" { Write-Host "❌ $Message" -ForegroundColor Red }
        default { Write-Host $Message }
    }
}

# Step 1: Verify directory structure
Write-Log "Step 1: Verifying directory structure..." "INFO"

$requiredDirs = @(
    @{Path = $backendPath; Name = "Backend directory"},
    @{Path = $frontendPath; Name = "Frontend directory"},
    @{Path = $sharedPath; Name = "Shared directory"},
    @{Path = $backendApiPath; Name = "Backend API directory"},
    @{Path = $frontendWebPath; Name = "Frontend Web directory"}
)

$allDirsExist = $true
foreach ($dir in $requiredDirs) {
    if (Test-Path -Path $dir.Path -PathType Container) {
        Write-Log "$($dir.Name) exists at: $($dir.Path)" "SUCCESS"
    } else {
        Write-Log "$($dir.Name) not found at: $($dir.Path)" "ERROR"
        $allDirsExist = $false
    }
}

if (-not $allDirsExist) {
    Write-Log "Critical directories are missing. Cannot proceed." "ERROR"
    exit 1
}

# Step 2: Ensure shared files are accessible to both backend and frontend
Write-Log "Step 2: Ensuring shared files are accessible..." "INFO"

# Function to copy shared directories if they don't exist
function Ensure-SharedDirectories {
    param (
        [string]$TargetPath,
        [string]$Description
    )
    
    $sharedDirs = @("config", "types", "utils")
    
    foreach ($dir in $sharedDirs) {
        $sourceDir = Join-Path $sharedPath $dir
        $targetDir = Join-Path $TargetPath $dir
        
        if (Test-Path -Path $sourceDir -PathType Container) {
            if (-not (Test-Path -Path $targetDir -PathType Container)) {
                Copy-Item -Path $sourceDir -Destination $targetDir -Recurse -Force
                Write-Log "Copied $dir directory to $Description" "SUCCESS"
            } else {
                Write-Log "$dir directory already exists in $Description" "INFO"
            }
        } else {
            Write-Log "$dir source directory not found in shared path" "WARNING"
        }
    }
}

Ensure-SharedDirectories -TargetPath $backendPath -Description "backend"
Ensure-SharedDirectories -TargetPath $frontendPath -Description "frontend"

# Step 3: Fix import paths in critical files
Write-Log "Step 3: Fixing import paths in critical files..." "INFO"

# Function to update import paths in TypeScript/JavaScript files
function Update-ImportPaths {
    param (
        [string]$FilePath
    )
    
    if (Test-Path -Path $FilePath) {
        $content = Get-Content -Path $FilePath -Raw
        $modified = $false
        
        # Update shared imports
        if ($content -match "from\s+['\"]\.\.\/\.\.\/types\/") {
            $content = $content -replace "from\s+['\"]\.\.\/\.\.\/types\/", "from '../types/"
            $modified = $true
            Write-Log "Updated import paths for types in $FilePath" "INFO"
        }
        
        if ($content -match "from\s+['\"]\.\.\/\.\.\/config\/") {
            $content = $content -replace "from\s+['\"]\.\.\/\.\.\/config\/", "from '../config/"
            $modified = $true
            Write-Log "Updated import paths for config in $FilePath" "INFO"
        }
        
        if ($content -match "from\s+['\"]\.\.\/\.\.\/utils\/") {
            $content = $content -replace "from\s+['\"]\.\.\/\.\.\/utils\/", "from '../utils/"
            $modified = $true
            Write-Log "Updated import paths for utils in $FilePath" "INFO"
        }
        
        # Update shared imports with deeper nesting
        if ($content -match "from\s+['\"]\.\.\/\.\.\/\.\.\/shared\/types\/") {
            $content = $content -replace "from\s+['\"]\.\.\/\.\.\/\.\.\/shared\/types\/", "from '../types/"
            $modified = $true
            Write-Log "Updated deep import paths for types in $FilePath" "INFO"
        }
        
        if ($content -match "from\s+['\"]\.\.\/\.\.\/\.\.\/shared\/config\/") {
            $content = $content -replace "from\s+['\"]\.\.\/\.\.\/\.\.\/shared\/config\/", "from '../config/"
            $modified = $true
            Write-Log "Updated deep import paths for config in $FilePath" "INFO"
        }
        
        if ($content -match "from\s+['\"]\.\.\/\.\.\/\.\.\/shared\/utils\/") {
            $content = $content -replace "from\s+['\"]\.\.\/\.\.\/\.\.\/shared\/utils\/", "from '../utils/"
            $modified = $true
            Write-Log "Updated deep import paths for utils in $FilePath" "INFO"
        }
        
        # Save changes if modified
        if ($modified) {
            Set-Content -Path $FilePath -Value $content
            Write-Log "Updated import paths in $FilePath" "SUCCESS"
            return $true
        } else {
            Write-Log "No import path updates needed in $FilePath" "INFO"
            return $false
        }
    } else {
        Write-Log "File not found: $FilePath" "ERROR"
        return $false
    }
}

# Update import paths in critical backend files
$backendMainFile = Join-Path $backendApiPath "src\main.ts"
Update-ImportPaths -FilePath $backendMainFile

# Find and update critical frontend files
$frontendFiles = @(
    (Join-Path $frontendWebPath "pages\_app.tsx"),
    (Join-Path $frontendWebPath "src\components\App.tsx"),
    (Join-Path $frontendPath "components\ai\SuggestionPanel.tsx")
)

foreach ($file in $frontendFiles) {
    if (Test-Path $file) {
        Update-ImportPaths -FilePath $file
    }
}

# Step 4: Update tsconfig.json files
Write-Log "Step 4: Updating tsconfig.json files..." "INFO"

function Update-TsConfig {
    param (
        [string]$TsConfigPath
    )
    
    if (Test-Path $TsConfigPath) {
        try {
            $tsConfig = Get-Content -Path $TsConfigPath -Raw | ConvertFrom-Json
            
            # Ensure baseUrl is set
            if (-not $tsConfig.compilerOptions.baseUrl) {
                $tsConfig.compilerOptions | Add-Member -MemberType NoteProperty -Name "baseUrl" -Value "."
                Write-Log "Added baseUrl to tsconfig.json" "INFO"
            }
            
            # Add paths if they don't exist
            if (-not $tsConfig.compilerOptions.paths) {
                $tsConfig.compilerOptions | Add-Member -MemberType NoteProperty -Name "paths" -Value @{}
            }
            
            # Set up path mappings
            $tsConfig.compilerOptions.paths = @{
                "@/*" = @("./src/*")
                "@shared/*" = @("../shared/*")
                "@config/*" = @("../config/*", "./config/*")
                "@types/*" = @("../types/*", "./types/*")
                "@utils/*" = @("../utils/*", "./utils/*")
            }
            
            # Save the updated tsconfig
            $tsConfig | ConvertTo-Json -Depth 10 | Set-Content -Path $TsConfigPath
            Write-Log "Updated tsconfig.json at $TsConfigPath" "SUCCESS"
            
            return $true
        }
        catch {
            Write-Log "Error updating tsconfig.json: $_" "ERROR"
            return $false
        }
    } else {
        Write-Log "tsconfig.json not found at $TsConfigPath" "ERROR"
        return $false
    }
}

# Update tsconfig.json files
$rootTsConfig = Join-Path $rootPath "tsconfig.json"
$backendTsConfig = Join-Path $backendPath "tsconfig.json"
$frontendTsConfig = Join-Path $frontendPath "tsconfig.json"
$backendApiTsConfig = Join-Path $backendApiPath "tsconfig.json"
$frontendWebTsConfig = Join-Path $frontendWebPath "tsconfig.json"

Update-TsConfig -TsConfigPath $rootTsConfig
if (Test-Path $backendTsConfig) { Update-TsConfig -TsConfigPath $backendTsConfig }
if (Test-Path $frontendTsConfig) { Update-TsConfig -TsConfigPath $frontendTsConfig }
if (Test-Path $backendApiTsConfig) { Update-TsConfig -TsConfigPath $backendApiTsConfig }
if (Test-Path $frontendWebTsConfig) { Update-TsConfig -TsConfigPath $frontendWebTsConfig }

# Step 5: Start the application
Write-Log "Step 5: Starting the application..." "INFO"

# Function to check if a port is in use
function Test-PortInUse {
    param (
        [int]$Port
    )
    
    $connections = Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Where-Object { $_.LocalPort -eq $Port }
    return ($null -ne $connections)
}

# Kill any processes using the required ports
$backendPort = 3001
$frontendPort = 3000

if (Test-PortInUse -Port $backendPort) {
    Write-Log "Port $backendPort is in use. Attempting to free it..." "WARNING"
    $processId = (Get-NetTCPConnection -LocalPort $backendPort -State Listen).OwningProcess
    if ($processId) {
        Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
        Write-Log "Stopped process using port $backendPort" "INFO"
    }
}

if (Test-PortInUse -Port $frontendPort) {
    Write-Log "Port $frontendPort is in use. Attempting to free it..." "WARNING"
    $processId = (Get-NetTCPConnection -LocalPort $frontendPort -State Listen).OwningProcess
    if ($processId) {
        Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
        Write-Log "Stopped process using port $frontendPort" "INFO"
    }
}

# Start backend server
Write-Log "Starting backend server..." "INFO"
$backendProcess = Start-Process -FilePath "powershell" -ArgumentList "-NoProfile", "-Command", "Set-Location -Path '$backendApiPath'; npm run dev" -WindowStyle Normal -PassThru

# Wait for backend to initialize
Write-Log "Waiting for backend to initialize..." "INFO"
Start-Sleep -Seconds 5

# Start frontend server
Write-Log "Starting frontend server..." "INFO"
$frontendProcess = Start-Process -FilePath "powershell" -ArgumentList "-NoProfile", "-Command", "Set-Location -Path '$frontendWebPath'; npx next dev" -WindowStyle Normal -PassThru

# Final message
Write-Log "Application started!" "SUCCESS"
Write-Log "- Frontend: http://localhost:3000" "INFO"
Write-Log "- Backend: http://localhost:3001" "INFO"
Write-Log "Wait a few moments, then access the application in your browser." "INFO"
Write-Log "Log file created at: $logPath" "INFO"

# Keep the script running until user presses Ctrl+C
Write-Host ""
Write-Host "Press Ctrl+C to stop the servers and exit" -ForegroundColor Yellow

try {
    while ($true) {
        # Check if processes are still running
        if ($backendProcess.HasExited) {
            Write-Log "Backend process has exited with code: $($backendProcess.ExitCode)" "ERROR"
            break
        }
        
        if ($frontendProcess.HasExited) {
            Write-Log "Frontend process has exited with code: $($frontendProcess.ExitCode)" "ERROR"
            break
        }
        
        Start-Sleep -Seconds 2
    }
}
finally {
    # Clean up processes when the script exits
    if (-not $backendProcess.HasExited) {
        Write-Log "Stopping backend process..." "INFO"
        Stop-Process -Id $backendProcess.Id -Force -ErrorAction SilentlyContinue
    }
    
    if (-not $frontendProcess.HasExited) {
        Write-Log "Stopping frontend process..." "INFO"
        Stop-Process -Id $frontendProcess.Id -Force -ErrorAction SilentlyContinue
    }
    
    Write-Log "Application stopped" "INFO"
}
