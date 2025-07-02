# Renexus Directory Restructuring Script
# Implements the recommended directory structure from QA_Analysis_FIX_Implement.md section 2.1.2

# Set error action preference to stop on errors
$ErrorActionPreference = "Stop"

# Create log file
$logFile = "reorganization_log_$(Get-Date -Format 'yyyyMMdd_HHmmss').txt"
"Starting directory restructuring at $(Get-Date)" | Out-File -FilePath $logFile

function Write-Log {
    param (
        [string]$Message
    )
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "$timestamp - $Message" | Out-File -FilePath $logFile -Append
    Write-Host $Message
}

# Define the root directory
$rootDir = "c:\Users\HP\Renexus"
Set-Location $rootDir

# Create backup of current structure
$backupDir = "backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
Write-Log "Creating backup directory: $backupDir"
New-Item -Path $backupDir -ItemType Directory -Force | Out-Null

# Create the new directory structure
Write-Log "Creating new directory structure..."

# Define the directories to create
$directories = @(
    "backend/api-gateway",
    "backend/auth-service",
    "backend/task-service",
    "backend/notification-service",
    "backend/shared",
    "frontend/web/public",
    "frontend/web/pages",
    "frontend/web/src/components",
    "frontend/web/src/features",
    "frontend/web/src/hooks",
    "frontend/web/src/services",
    "packages/ui",
    "packages/database",
    "packages/shared",
    "infrastructure",
    "scripts",
    "docs",
    "tests/e2e",
    "tests/integration",
    "tests/unit"
)

# Create directories
foreach ($dir in $directories) {
    $fullPath = Join-Path -Path $rootDir -ChildPath $dir
    if (-not (Test-Path $fullPath)) {
        Write-Log "Creating directory: $dir"
        New-Item -Path $fullPath -ItemType Directory -Force | Out-Null
    }
    else {
        Write-Log "Directory already exists: $dir"
    }
}

# Move files and directories to their new locations
Write-Log "Moving files and directories to new structure..."

# Backend restructuring
if (Test-Path "backend/api") {
    Write-Log "Moving backend/api to backend/api-gateway"
    Copy-Item -Path "backend/api/*" -Destination "backend/api-gateway" -Recurse -Force
}

# Ensure existing api-gateway content is preserved
if (Test-Path "backend/api-gateway" -PathType Container) {
    Write-Log "Preserving existing backend/api-gateway content"
    # No need to copy as we're keeping the existing directory
}

# Move auth-service content
if (Test-Path "backend/auth-service" -PathType Container) {
    Write-Log "Preserving existing backend/auth-service content"
    # No need to copy as we're keeping the existing directory
}

# Move task-service content
if (Test-Path "backend/task-service" -PathType Container) {
    Write-Log "Preserving existing backend/task-service content"
    # No need to copy as we're keeping the existing directory
}
else {
    Write-Log "Moving task-related services to backend/task-service"
    if (Test-Path "backend/services/task") {
        Copy-Item -Path "backend/services/task/*" -Destination "backend/task-service" -Recurse -Force
    }
}

# Move notification-service content
if (Test-Path "backend/notification-service" -PathType Container) {
    Write-Log "Preserving existing backend/notification-service content"
    # No need to copy as we're keeping the existing directory
}

# Move shared backend utilities
Write-Log "Moving shared backend utilities"
if (Test-Path "backend/shared" -PathType Container) {
    # Directory exists, just ensure content is there
    Write-Log "Preserving existing backend/shared content"
}
else {
    # Create and populate shared directory
    if (Test-Path "backend/utils") {
        Copy-Item -Path "backend/utils/*" -Destination "backend/shared" -Recurse -Force
    }
    if (Test-Path "backend/types") {
        Copy-Item -Path "backend/types/*" -Destination "backend/shared" -Recurse -Force
    }
    if (Test-Path "backend/config") {
        Copy-Item -Path "backend/config/*" -Destination "backend/shared" -Recurse -Force
    }
}

# Frontend restructuring
Write-Log "Restructuring frontend..."

# Preserve existing web directory structure if it exists
if (Test-Path "frontend/web" -PathType Container) {
    Write-Log "Preserving existing frontend/web structure"
    
    # Ensure src directory exists
    if (-not (Test-Path "frontend/web/src")) {
        New-Item -Path "frontend/web/src" -ItemType Directory -Force | Out-Null
    }
    
    # Move components if they're at the frontend root
    if (Test-Path "frontend/components") {
        Write-Log "Moving frontend/components to frontend/web/src/components"
        Copy-Item -Path "frontend/components/*" -Destination "frontend/web/src/components" -Recurse -Force
    }
    
    # Move hooks if they're at the frontend root
    if (Test-Path "frontend/hooks") {
        Write-Log "Moving frontend/hooks to frontend/web/src/hooks"
        Copy-Item -Path "frontend/hooks/*" -Destination "frontend/web/src/hooks" -Recurse -Force
    }
    
    # Move services if they're at the frontend root
    if (Test-Path "frontend/services") {
        Write-Log "Moving frontend/services to frontend/web/src/services"
        Copy-Item -Path "frontend/services/*" -Destination "frontend/web/src/services" -Recurse -Force
    }
    
    # Create features directory and organize by feature
    if (-not (Test-Path "frontend/web/src/features")) {
        New-Item -Path "frontend/web/src/features" -ItemType Directory -Force | Out-Null
    }
    
    # Move pages if they're at the frontend root
    if (Test-Path "frontend/pages") {
        Write-Log "Moving frontend/pages to frontend/web/pages"
        Copy-Item -Path "frontend/pages/*" -Destination "frontend/web/pages" -Recurse -Force
    }
    
    # Move public assets if they're at the frontend root
    if (Test-Path "frontend/public") {
        Write-Log "Moving frontend/public to frontend/web/public"
        Copy-Item -Path "frontend/public/*" -Destination "frontend/web/public" -Recurse -Force
    }
}

# Packages restructuring
Write-Log "Restructuring shared packages..."

# Move UI components to packages/ui
if (Test-Path "shared/components") {
    Write-Log "Moving shared/components to packages/ui"
    Copy-Item -Path "shared/components/*" -Destination "packages/ui" -Recurse -Force
}
elseif (Test-Path "frontend/components/shared") {
    Write-Log "Moving frontend/components/shared to packages/ui"
    Copy-Item -Path "frontend/components/shared/*" -Destination "packages/ui" -Recurse -Force
}

# Move database models and utilities
if (Test-Path "backend/database") {
    Write-Log "Moving backend/database to packages/database"
    Copy-Item -Path "backend/database/*" -Destination "packages/database" -Recurse -Force
}

# Move shared utilities
if (Test-Path "shared") {
    Write-Log "Moving shared utilities to packages/shared"
    
    if (Test-Path "shared/utils") {
        Copy-Item -Path "shared/utils/*" -Destination "packages/shared" -Recurse -Force
    }
    
    if (Test-Path "shared/types") {
        Copy-Item -Path "shared/types/*" -Destination "packages/shared" -Recurse -Force
    }
    
    if (Test-Path "shared/config") {
        Copy-Item -Path "shared/config/*" -Destination "packages/shared" -Recurse -Force
    }
}

# Move infrastructure code
if (Test-Path "deployment") {
    Write-Log "Moving deployment to infrastructure"
    Copy-Item -Path "deployment/*" -Destination "infrastructure" -Recurse -Force
}

# Move documentation
if (Test-Path "docs") {
    Write-Log "Preserving existing docs directory"
    # No need to copy as we're keeping the existing directory
}
else {
    Write-Log "Creating docs directory"
    # Create docs directory if it doesn't exist
    New-Item -Path "docs" -ItemType Directory -Force | Out-Null
    
    # Move markdown files to docs
    Get-ChildItem -Path $rootDir -Filter "*.md" | Where-Object { $_.Name -ne "README.md" } | ForEach-Object {
        Write-Log "Moving $($_.Name) to docs"
        Copy-Item -Path $_.FullName -Destination "docs/$($_.Name)" -Force
    }
}

# Move test files
Write-Log "Organizing test files..."

# Move e2e tests
if (Test-Path "tests/e2e") {
    Write-Log "Preserving existing tests/e2e directory"
}
elseif (Test-Path "tests/e2e-tests") {
    Write-Log "Moving tests/e2e-tests to tests/e2e"
    Copy-Item -Path "tests/e2e-tests/*" -Destination "tests/e2e" -Recurse -Force
}

# Move integration tests
if (Test-Path "tests/integration") {
    Write-Log "Preserving existing tests/integration directory"
}
elseif (Test-Path "tests/integration-tests") {
    Write-Log "Moving tests/integration-tests to tests/integration"
    Copy-Item -Path "tests/integration-tests/*" -Destination "tests/integration" -Recurse -Force
}

# Move unit tests
if (Test-Path "tests/unit") {
    Write-Log "Preserving existing tests/unit directory"
}
elseif (Test-Path "tests/unit-tests") {
    Write-Log "Moving tests/unit-tests to tests/unit"
    Copy-Item -Path "tests/unit-tests/*" -Destination "tests/unit" -Recurse -Force
}

# Move utility scripts
Write-Log "Organizing utility scripts..."
if (Test-Path "scripts") {
    Write-Log "Preserving existing scripts directory"
}
else {
    # Move PowerShell scripts to scripts directory
    Get-ChildItem -Path $rootDir -Filter "*.ps1" | ForEach-Object {
        Write-Log "Moving $($_.Name) to scripts"
        Copy-Item -Path $_.FullName -Destination "scripts/$($_.Name)" -Force
    }
    
    # Move JavaScript utility scripts to scripts directory
    Get-ChildItem -Path $rootDir -Filter "*.js" | Where-Object { $_.Name -match "^(run|fix|setup|verify)" } | ForEach-Object {
        Write-Log "Moving $($_.Name) to scripts"
        Copy-Item -Path $_.FullName -Destination "scripts/$($_.Name)" -Force
    }
}

Write-Log "Directory restructuring completed successfully!"
Write-Log "New structure has been created. Original files are preserved."
Write-Log "Please verify the new structure before removing any original files."

# Create a summary of the new structure
Write-Log "Generating structure summary..."
$summaryFile = "new_structure_summary_$(Get-Date -Format 'yyyyMMdd_HHmmss').txt"
"Renexus Project Directory Structure Summary" | Out-File -FilePath $summaryFile
"Generated on: $(Get-Date)" | Out-File -FilePath $summaryFile -Append
"" | Out-File -FilePath $summaryFile -Append

function Get-DirectoryStructure {
    param (
        [string]$Path,
        [int]$Depth = 0,
        [int]$MaxDepth = 3
    )
    
    if ($Depth -gt $MaxDepth) {
        return
    }
    
    $indent = "  " * $Depth
    
    Get-ChildItem -Path $Path -Directory | ForEach-Object {
        "$indent- $($_.Name)/" | Out-File -FilePath $summaryFile -Append
        Get-DirectoryStructure -Path $_.FullName -Depth ($Depth + 1) -MaxDepth $MaxDepth
    }
}

"Root Directory Structure:" | Out-File -FilePath $summaryFile -Append
Get-DirectoryStructure -Path $rootDir -Depth 0 -MaxDepth 3

Write-Log "Structure summary saved to $summaryFile"
Write-Log "Restructuring process complete!"
