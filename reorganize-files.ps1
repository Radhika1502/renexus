# Reorganize Renexus Project Structure
# This script will move files and directories to their appropriate locations
# - Backend-related directories into the backend directory
# - Frontend-related directories into the frontend directory
# - Create a shared directory for files used by both

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

# Function to move directory or file with backup
function Move-ItemSafely {
    param (
        [string]$SourcePath,
        [string]$DestinationDir,
        [string]$ItemType
    )
    
    # Check if source exists
    if (-not (Test-Path $SourcePath)) {
        Write-Host "Warning: $SourcePath not found, skipping..." -ForegroundColor Yellow
        return
    }
    
    $itemName = Split-Path $SourcePath -Leaf
    $destinationPath = Join-Path $DestinationDir $itemName
    
    # Check if destination already exists
    if (Test-Path $destinationPath) {
        Write-Host "Backing up existing $itemName in destination..." -ForegroundColor Yellow
        Copy-Item -Path $destinationPath -Destination $backupPath -Recurse -Force
    }
    
    # Move the item
    Write-Host "Moving $ItemType '$itemName' to destination..." -ForegroundColor Green
    
    try {
        if ((Get-Item $SourcePath).PSIsContainer) {
            # For directories
            if (-not (Test-Path $destinationPath)) {
                New-Item -ItemType Directory -Path $destinationPath -Force | Out-Null
            }
            
            # Copy contents instead of moving the directory itself
            Copy-Item -Path "$SourcePath\*" -Destination $destinationPath -Recurse -Force
            Remove-Item -Path $SourcePath -Recurse -Force
        } else {
            # For files
            Copy-Item -Path $SourcePath -Destination $destinationPath -Force
            Remove-Item -Path $SourcePath -Force
        }
        
        "Moved $ItemType: $itemName" | Out-File -FilePath "$rootPath\reorganization_log.txt" -Append
    } catch {
        Write-Host "Error processing $itemName" -ForegroundColor Red
        "Failed to move $ItemType: $itemName" | Out-File -FilePath "$rootPath\reorganization_log.txt" -Append
    }
}

# Lists of directories and files to move
$backendItems = @(
    "api",
    "controllers", 
    "middleware", 
    "database",
    "server.ts",
    "simple-server.js"
)

$frontendItems = @(
    "components",
    "pages",
    "hooks",
    "public"
)

$sharedItems = @(
    "config",
    "types",
    "utils"
)

# Create a log file
"Renexus Project Reorganization Log - $(Get-Date)" | Out-File -FilePath "$rootPath\reorganization_log.txt" -Force

# Move backend items
Write-Host "Moving backend-related items..." -ForegroundColor Cyan
foreach ($item in $backendItems) {
    $sourcePath = "$rootPath\$item"
    Move-ItemSafely -SourcePath $sourcePath -DestinationDir $backendPath -ItemType "Backend item"
}

# Move frontend items
Write-Host "Moving frontend-related items..." -ForegroundColor Cyan
foreach ($item in $frontendItems) {
    $sourcePath = "$rootPath\$item"
    Move-ItemSafely -SourcePath $sourcePath -DestinationDir $frontendPath -ItemType "Frontend item"
}

# Move shared items
Write-Host "Moving shared items..." -ForegroundColor Cyan
foreach ($item in $sharedItems) {
    $sourcePath = "$rootPath\$item"
    Move-ItemSafely -SourcePath $sourcePath -DestinationDir $sharedPath -ItemType "Shared item"
}

# Special handling for services directory
Write-Host "Analyzing services directory for proper placement..." -ForegroundColor Yellow
if (Test-Path "$rootPath\services") {
    # Create services directories in both frontend and backend if they don't exist
    if (-not (Test-Path "$backendPath\services")) {
        New-Item -ItemType Directory -Path "$backendPath\services" -Force | Out-Null
    }
    
    if (-not (Test-Path "$frontendPath\services")) {
        New-Item -ItemType Directory -Path "$frontendPath\services" -Force | Out-Null
    }
    
    if (-not (Test-Path "$sharedPath\services")) {
        New-Item -ItemType Directory -Path "$sharedPath\services" -Force | Out-Null
    }
    
    # Backend-specific services
    $backendServices = @("auth", "logging", "security", "users", "teams")
    foreach ($service in $backendServices) {
        if (Test-Path "$rootPath\services\$service") {
            Write-Host "Moving $service service to backend..." -ForegroundColor Green
            Copy-Item -Path "$rootPath\services\$service" -Destination "$backendPath\services" -Recurse -Force
            "Moved backend service: $service" | Out-File -FilePath "$rootPath\reorganization_log.txt" -Append
        }
    }
    
    # Frontend-specific services
    $frontendServices = @("analytics", "projects", "tasks", "widget")
    foreach ($service in $frontendServices) {
        if (Test-Path "$rootPath\services\$service") {
            Write-Host "Moving $service service to frontend..." -ForegroundColor Green
            Copy-Item -Path "$rootPath\services\$service" -Destination "$frontendPath\services" -Recurse -Force
            "Moved frontend service: $service" | Out-File -FilePath "$rootPath\reorganization_log.txt" -Append
        }
    }
    
    # Shared services
    $sharedServices = @("ai", "nlp", "performance", "offline")
    foreach ($service in $sharedServices) {
        if (Test-Path "$rootPath\services\$service") {
            Write-Host "Moving $service service to shared..." -ForegroundColor Green
            Copy-Item -Path "$rootPath\services\$service" -Destination "$sharedPath\services" -Recurse -Force
            "Moved shared service: $service" | Out-File -FilePath "$rootPath\reorganization_log.txt" -Append
        }
    }
    
    # Remove the services directory after copying everything
    Write-Host "Removing original services directory..." -ForegroundColor Yellow
    Remove-Item -Path "$rootPath\services" -Recurse -Force
}

# Generate summary file
Write-Host "Generating summary file..." -ForegroundColor Cyan
$summaryFile = "$rootPath\new_structure_summary.txt"

"Renexus Project - New Structure Summary ($(Get-Date))" | Out-File -FilePath $summaryFile -Force
"" | Out-File -FilePath $summaryFile -Append
"BACKEND DIRECTORY:" | Out-File -FilePath $summaryFile -Append
Get-ChildItem -Path $backendPath -Force | ForEach-Object {
    "- $($_.Name)" | Out-File -FilePath $summaryFile -Append
}

"" | Out-File -FilePath $summaryFile -Append
"FRONTEND DIRECTORY:" | Out-File -FilePath $summaryFile -Append
Get-ChildItem -Path $frontendPath -Force | ForEach-Object {
    "- $($_.Name)" | Out-File -FilePath $summaryFile -Append
}

"" | Out-File -FilePath $summaryFile -Append
"SHARED DIRECTORY:" | Out-File -FilePath $summaryFile -Append
Get-ChildItem -Path $sharedPath -Force | ForEach-Object {
    "- $($_.Name)" | Out-File -FilePath $summaryFile -Append
}

Write-Host "Reorganization complete!" -ForegroundColor Green
Write-Host "Log file created at: $rootPath\reorganization_log.txt" -ForegroundColor Cyan
Write-Host "Structure summary created at: $summaryFile" -ForegroundColor Cyan
Write-Host "" -ForegroundColor White
Write-Host "IMPORTANT: Please review the reorganization and test your application" -ForegroundColor Yellow
Write-Host "You may need to update import paths in your code after this reorganization." -ForegroundColor Yellow
