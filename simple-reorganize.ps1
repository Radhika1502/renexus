# Simple Reorganize Renexus Project Structure
# This script will move files and directories to their appropriate locations

Write-Host "Starting Renexus Project Reorganization..." -ForegroundColor Cyan
Write-Host "------------------------------------------" -ForegroundColor Cyan

# Define paths
$rootPath = "c:\Users\HP\Renexus"
$backendPath = "$rootPath\backend"
$frontendPath = "$rootPath\frontend"
$sharedPath = "$rootPath\shared"

# Create backup directory
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupPath = "$rootPath\backup_$timestamp"
New-Item -ItemType Directory -Path $backupPath -Force | Out-Null
Write-Host "Created backup directory: $backupPath" -ForegroundColor Yellow

# Create shared directory if it doesn't exist
if (-not (Test-Path $sharedPath)) {
    Write-Host "Creating shared directory..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $sharedPath -Force | Out-Null
}

# Create log file
$logPath = "$rootPath\reorganization_log_$timestamp.txt"
"Renexus Project Reorganization Log - $(Get-Date)" | Out-File -FilePath $logPath -Force

# Backend items
$backendItems = @(
    "api",
    "controllers", 
    "middleware", 
    "database",
    "server.ts",
    "simple-server.js"
)

# Frontend items
$frontendItems = @(
    "components",
    "pages",
    "hooks",
    "public"
)

# Shared items
$sharedItems = @(
    "config",
    "types",
    "utils"
)

# Move backend items
Write-Host "Moving backend-related items..." -ForegroundColor Cyan
foreach ($item in $backendItems) {
    $sourcePath = "$rootPath\$item"
    
    # Skip if source doesn't exist
    if (-not (Test-Path $sourcePath)) {
        Write-Host "Item not found: $item - skipping" -ForegroundColor Yellow
        continue
    }
    
    $itemName = Split-Path $sourcePath -Leaf
    $destinationPath = Join-Path $backendPath $itemName
    
    # Backup if destination exists
    if (Test-Path $destinationPath) {
        Write-Host "Backing up existing $itemName" -ForegroundColor Yellow
        Copy-Item -Path $destinationPath -Destination $backupPath -Recurse -Force
    }
    
    # Copy item to destination
    Write-Host "Moving $itemName to backend" -ForegroundColor Green
    
    try {
        if (Test-Path -Path $sourcePath -PathType Container) {
            # For directories
            if (-not (Test-Path $destinationPath)) {
                New-Item -ItemType Directory -Path $destinationPath -Force | Out-Null
            }
            
            # Copy contents
            Copy-Item -Path "$sourcePath\*" -Destination $destinationPath -Recurse -Force
            Remove-Item -Path $sourcePath -Recurse -Force
        } else {
            # For files
            Copy-Item -Path $sourcePath -Destination $destinationPath -Force
            Remove-Item -Path $sourcePath -Force
        }
        
        "Moved to backend: $itemName" | Out-File -FilePath $logPath -Append
    } catch {
        Write-Host "Error processing $itemName" -ForegroundColor Red
        "Failed to move: $itemName" | Out-File -FilePath $logPath -Append
    }
}

# Move frontend items
Write-Host "Moving frontend-related items..." -ForegroundColor Cyan
foreach ($item in $frontendItems) {
    $sourcePath = "$rootPath\$item"
    
    # Skip if source doesn't exist
    if (-not (Test-Path $sourcePath)) {
        Write-Host "Item not found: $item - skipping" -ForegroundColor Yellow
        continue
    }
    
    $itemName = Split-Path $sourcePath -Leaf
    $destinationPath = Join-Path $frontendPath $itemName
    
    # Backup if destination exists
    if (Test-Path $destinationPath) {
        Write-Host "Backing up existing $itemName" -ForegroundColor Yellow
        Copy-Item -Path $destinationPath -Destination $backupPath -Recurse -Force
    }
    
    # Copy item to destination
    Write-Host "Moving $itemName to frontend" -ForegroundColor Green
    
    try {
        if (Test-Path -Path $sourcePath -PathType Container) {
            # For directories
            if (-not (Test-Path $destinationPath)) {
                New-Item -ItemType Directory -Path $destinationPath -Force | Out-Null
            }
            
            # Copy contents
            Copy-Item -Path "$sourcePath\*" -Destination $destinationPath -Recurse -Force
            Remove-Item -Path $sourcePath -Recurse -Force
        } else {
            # For files
            Copy-Item -Path $sourcePath -Destination $destinationPath -Force
            Remove-Item -Path $sourcePath -Force
        }
        
        "Moved to frontend: $itemName" | Out-File -FilePath $logPath -Append
    } catch {
        Write-Host "Error processing $itemName" -ForegroundColor Red
        "Failed to move: $itemName" | Out-File -FilePath $logPath -Append
    }
}

# Move shared items
Write-Host "Moving shared items..." -ForegroundColor Cyan
foreach ($item in $sharedItems) {
    $sourcePath = "$rootPath\$item"
    
    # Skip if source doesn't exist
    if (-not (Test-Path $sourcePath)) {
        Write-Host "Item not found: $item - skipping" -ForegroundColor Yellow
        continue
    }
    
    $itemName = Split-Path $sourcePath -Leaf
    $destinationPath = Join-Path $sharedPath $itemName
    
    # Copy item to destination
    Write-Host "Moving $itemName to shared" -ForegroundColor Green
    
    try {
        if (Test-Path -Path $sourcePath -PathType Container) {
            # For directories
            if (-not (Test-Path $destinationPath)) {
                New-Item -ItemType Directory -Path $destinationPath -Force | Out-Null
            }
            
            # Copy contents
            Copy-Item -Path "$sourcePath\*" -Destination $destinationPath -Recurse -Force
            Remove-Item -Path $sourcePath -Recurse -Force
        } else {
            # For files
            Copy-Item -Path $sourcePath -Destination $destinationPath -Force
            Remove-Item -Path $sourcePath -Force
        }
        
        "Moved to shared: $itemName" | Out-File -FilePath $logPath -Append
    } catch {
        Write-Host "Error processing $itemName" -ForegroundColor Red
        "Failed to move: $itemName" | Out-File -FilePath $logPath -Append
    }
}

# Handle services directory
Write-Host "Processing services directory..." -ForegroundColor Cyan
$servicesPath = "$rootPath\services"

if (Test-Path $servicesPath) {
    # Create services directories
    if (-not (Test-Path "$backendPath\services")) {
        New-Item -ItemType Directory -Path "$backendPath\services" -Force | Out-Null
    }
    
    if (-not (Test-Path "$frontendPath\services")) {
        New-Item -ItemType Directory -Path "$frontendPath\services" -Force | Out-Null
    }
    
    if (-not (Test-Path "$sharedPath\services")) {
        New-Item -ItemType Directory -Path "$sharedPath\services" -Force | Out-Null
    }
    
    # Backend services
    $backendServices = @("auth", "logging", "security", "users", "teams")
    foreach ($service in $backendServices) {
        $servicePath = "$servicesPath\$service"
        if (Test-Path $servicePath) {
            Write-Host "Moving $service to backend services" -ForegroundColor Green
            Copy-Item -Path $servicePath -Destination "$backendPath\services\" -Recurse -Force
            "Moved to backend services: $service" | Out-File -FilePath $logPath -Append
        }
    }
    
    # Frontend services
    $frontendServices = @("analytics", "projects", "tasks", "widget")
    foreach ($service in $frontendServices) {
        $servicePath = "$servicesPath\$service"
        if (Test-Path $servicePath) {
            Write-Host "Moving $service to frontend services" -ForegroundColor Green
            Copy-Item -Path $servicePath -Destination "$frontendPath\services\" -Recurse -Force
            "Moved to frontend services: $service" | Out-File -FilePath $logPath -Append
        }
    }
    
    # Shared services
    $sharedServices = @("ai", "nlp", "performance", "offline")
    foreach ($service in $sharedServices) {
        $servicePath = "$servicesPath\$service"
        if (Test-Path $servicePath) {
            Write-Host "Moving $service to shared services" -ForegroundColor Green
            Copy-Item -Path $servicePath -Destination "$sharedPath\services\" -Recurse -Force
            "Moved to shared services: $service" | Out-File -FilePath $logPath -Append
        }
    }
    
    # Remove original services directory
    Write-Host "Removing original services directory" -ForegroundColor Yellow
    Remove-Item -Path $servicesPath -Recurse -Force
}

# Generate summary file
Write-Host "Generating summary file..." -ForegroundColor Cyan
$summaryPath = "$rootPath\new_structure_summary_$timestamp.txt"

@"
Renexus Project - New Structure Summary ($(Get-Date))

BACKEND DIRECTORY:
$(Get-ChildItem -Path $backendPath -Force | ForEach-Object { "- $($_.Name)" })

FRONTEND DIRECTORY:
$(Get-ChildItem -Path $frontendPath -Force | ForEach-Object { "- $($_.Name)" })

SHARED DIRECTORY:
$(Get-ChildItem -Path $sharedPath -Force | ForEach-Object { "- $($_.Name)" })
"@ | Out-File -FilePath $summaryPath -Force

Write-Host "Reorganization complete!" -ForegroundColor Green
Write-Host "Log file created at: $logPath" -ForegroundColor Cyan
Write-Host "Structure summary created at: $summaryPath" -ForegroundColor Cyan
Write-Host "" -ForegroundColor White
Write-Host "IMPORTANT: Please review the reorganization and test your application" -ForegroundColor Yellow
Write-Host "You may need to update import paths in your code after this reorganization." -ForegroundColor Yellow
