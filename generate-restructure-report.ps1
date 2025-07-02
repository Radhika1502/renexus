# Script to generate a comprehensive report of the directory restructuring
$ErrorActionPreference = "Stop"

function Write-Log {
    param (
        [string]$Message,
        [string]$Type = "INFO"
    )
    
    $color = switch ($Type) {
        "INFO" { "White" }
        "SUCCESS" { "Green" }
        "WARNING" { "Yellow" }
        "ERROR" { "Red" }
        default { "White" }
    }
    
    Write-Host "[$Type] $Message" -ForegroundColor $color
}

function Get-DirectoryStructure {
    param (
        [string]$Path,
        [int]$IndentLevel = 0,
        [switch]$IncludeFiles,
        [switch]$SkipNodeModules
    )
    
    $indent = "  " * $IndentLevel
    $result = @()
    
    $items = Get-ChildItem -Path $Path | Sort-Object -Property @{Expression={$_.PSIsContainer};Descending=$true}, Name
    
    foreach ($item in $items) {
        if ($SkipNodeModules -and $item.Name -eq 'node_modules') {
            $result += "$indent- node_modules/ (skipped)"
            continue
        }
        
        if ($item.PSIsContainer) {
            $result += "$indent- $($item.Name)/"
            $result += Get-DirectoryStructure -Path $item.FullName -IndentLevel ($IndentLevel + 1) -IncludeFiles:$IncludeFiles -SkipNodeModules:$SkipNodeModules
        } elseif ($IncludeFiles) {
            $result += "$indent  $($item.Name)"
        }
    }
    
    return $result
}

# Generate the report
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$reportPath = "c:\Users\HP\Renexus\restructuring-report.md"

Write-Log "Generating directory restructuring report at: $reportPath"

$reportContent = @"
# Renexus Directory Restructuring Report
**Generated:** $timestamp

## Overview
This report documents the consolidated monorepo directory structure implemented for the Renexus project. 
The restructuring involved merging duplicate files and folders to create a clean, organized directory structure.

## Consolidated Directory Structure
The project now follows a monorepo architecture with the following structure:

\`\`\`
Renexus/
├── backend/
│   ├── api-gateway/          # API Gateway service (merged from backend/api)
│   ├── auth-service/         # Authentication service
│   ├── notification-service/ # Notification service
│   ├── task-service/         # Task management service (merged from backend/services/task)
│   ├── config/               # Backend-specific configuration
│   ├── middleware/           # Backend middleware
│   └── server.ts             # Main server entry point
├── frontend/
│   └── web/                  # Web application
│       ├── pages/            # Next.js pages
│       ├── public/           # Public assets (merged from frontend/public)
│       └── src/
│           ├── components/   # UI components (merged from frontend/components)
│           ├── contexts/     # React contexts
│           ├── features/     # Feature modules
│           ├── hooks/        # React hooks (merged from frontend/hooks)
│           ├── services/     # API services (merged from frontend/services)
│           ├── types/        # TypeScript types (merged from frontend/types)
│           └── utils/        # Utility functions (merged from frontend/utils)
├── packages/                 # Shared packages
│   ├── database/             # Database models and migrations (merged from backend/database)
│   ├── shared/               # Cross-app shared utilities (merged from shared/)
│   │   ├── config/           # Shared configuration
│   │   ├── services/         # Shared services
│   │   ├── types/            # Shared types
│   │   └── utils/            # Shared utilities
│   └── ui/                   # Shared UI components
├── infrastructure/           # Infrastructure code
├── scripts/                  # Utility scripts
├── docs/                     # Documentation
└── tests/                    # Global test files
\`\`\`

## Merged Duplicate Files and Directories

### Frontend Duplications Merged
1. **Components**: `frontend/components` → `frontend/web/src/components`
2. **Hooks**: `frontend/hooks` → `frontend/web/src/hooks`
3. **Services**: `frontend/services` → `frontend/web/src/services`
4. **Types**: `frontend/types` → `frontend/web/src/types`
5. **Utils**: `frontend/utils` → `frontend/web/src/utils`
6. **Public**: `frontend/public` → `frontend/web/public`
7. **Configuration**: `frontend/paths.ts` → `frontend/web/src/paths.ts`

### Backend Duplications Merged
1. **API Gateway**: `backend/api` → `backend/api-gateway`
2. **Database**: `backend/database` → `packages/database`
3. **Task Service**: `backend/services/task` → `backend/task-service`

### Shared Code Merged
1. **Config**: `shared/config` → `packages/shared/config`
2. **Services**: `shared/services` → `packages/shared/services`
3. **Types**: `shared/types` → `packages/shared/types`
4. **Utils**: `shared/utils` → `packages/shared/utils`

## Next Steps
1. Update all import paths in the codebase to reference the new locations
2. Update build scripts and configuration files (package.json, tsconfig.json, etc.)
3. Run comprehensive tests to verify functionality
4. Remove the original duplicated directories after confirming everything works
5. Update documentation and development guides

## Backups
Backups of the original directories were created before merging:
- Frontend backup: `frontend-backup-*`
- Backend backup: `backend-backup-*`

These can be restored if needed during the transition period.
"@

# Save the report
Set-Content -Path $reportPath -Value $reportContent

Write-Log "Report generated successfully at: $reportPath" "SUCCESS"

# Display the top of the report
Write-Log "Report Preview:" "INFO"
Get-Content -Path $reportPath -TotalCount 20

Write-Log "Full report available at: $reportPath" "SUCCESS"
