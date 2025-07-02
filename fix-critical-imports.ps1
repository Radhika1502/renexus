# Fix Critical Import Paths Script
# This script will fix the most critical import paths that might prevent the application from starting

Write-Host "Fixing Critical Import Paths..." -ForegroundColor Cyan
Write-Host "------------------------------------------" -ForegroundColor Cyan

# Define paths
$rootPath = "c:\Users\HP\Renexus"
$backendPath = "$rootPath\backend"
$frontendPath = "$rootPath\frontend"
$sharedPath = "$rootPath\shared"

# Create log file
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$logPath = "$rootPath\critical_imports_fix_$timestamp.txt"
"Critical Import Fixes Log - $(Get-Date)" | Out-File -FilePath $logPath -Force

# Function to update tsconfig.json paths
function Update-TsConfig {
    param (
        [string]$TsConfigPath
    )
    
    try {
        if (Test-Path $TsConfigPath) {
            Write-Host "Updating paths in $TsConfigPath..." -ForegroundColor Yellow
            
            $tsConfig = Get-Content -Path $TsConfigPath -Raw | ConvertFrom-Json
            
            # Check if paths property exists, if not create it
            if (-not $tsConfig.compilerOptions.paths) {
                $tsConfig.compilerOptions | Add-Member -MemberType NoteProperty -Name "paths" -Value @{}
            }
            
            # Add paths for shared directories
            $tsConfig.compilerOptions.paths = @{
                "@shared/*" = @("../shared/*")
                "@config/*" = @("../shared/config/*")
                "@types/*" = @("../shared/types/*")
                "@utils/*" = @("../shared/utils/*")
            }
            
            # Save the updated tsconfig
            $tsConfig | ConvertTo-Json -Depth 10 | Set-Content -Path $TsConfigPath
            
            Write-Host "✅ Updated tsconfig.json at $TsConfigPath" -ForegroundColor Green
            "Updated tsconfig.json at $TsConfigPath" | Out-File -FilePath $logPath -Append
            
            return $true
        } else {
            Write-Host "❌ tsconfig.json not found at $TsConfigPath" -ForegroundColor Red
            "tsconfig.json not found at $TsConfigPath" | Out-File -FilePath $logPath -Append
            
            return $false
        }
    }
    catch {
        Write-Host "❌ Error updating tsconfig.json: $_" -ForegroundColor Red
        "Error updating tsconfig.json: $_" | Out-File -FilePath $logPath -Append
        
        return $false
    }
}

# Function to create path alias files
function Create-PathAliasFile {
    param (
        [string]$Directory,
        [string]$FileName
    )
    
    try {
        $filePath = Join-Path $Directory $FileName
        
        $content = @"
/**
 * Path aliases for the reorganized project structure
 * This file helps resolve imports after the directory reorganization
 */

// For TypeScript/JavaScript modules
export const SHARED_PATH = '../../shared';
export const CONFIG_PATH = '../../shared/config';
export const TYPES_PATH = '../../shared/types';
export const UTILS_PATH = '../../shared/utils';

// Helper function to resolve paths
export function resolvePath(basePath, relativePath) {
  return `\${basePath}/\${relativePath}`;
}

// Export path resolvers
export const resolveSharedPath = (path) => resolvePath(SHARED_PATH, path);
export const resolveConfigPath = (path) => resolvePath(CONFIG_PATH, path);
export const resolveTypesPath = (path) => resolvePath(TYPES_PATH, path);
export const resolveUtilsPath = (path) => resolvePath(UTILS_PATH, path);
"@
        
        Set-Content -Path $filePath -Value $content
        
        Write-Host "✅ Created path alias file at $filePath" -ForegroundColor Green
        "Created path alias file at $filePath" | Out-File -FilePath $logPath -Append
        
        return $true
    }
    catch {
        Write-Host "❌ Error creating path alias file: $_" -ForegroundColor Red
        "Error creating path alias file: $_" | Out-File -FilePath $logPath -Append
        
        return $false
    }
}

# Update root tsconfig.json
$rootTsConfigPath = "$rootPath\tsconfig.json"
Update-TsConfig -TsConfigPath $rootTsConfigPath

# Update backend tsconfig.json
$backendTsConfigPath = "$backendPath\tsconfig.json"
Update-TsConfig -TsConfigPath $backendTsConfigPath

# Create path alias files
Create-PathAliasFile -Directory $backendPath -FileName "paths.ts"
Create-PathAliasFile -Directory $frontendPath -FileName "paths.ts"

# Create symbolic links for shared directories (if needed)
Write-Host "Creating symbolic links for shared directories..." -ForegroundColor Yellow

try {
    # Create symbolic links in backend
    if (-not (Test-Path "$backendPath\shared")) {
        cmd /c mklink /D "$backendPath\shared" "$sharedPath"
        Write-Host "✅ Created symbolic link for shared directory in backend" -ForegroundColor Green
        "Created symbolic link for shared directory in backend" | Out-File -FilePath $logPath -Append
    } else {
        Write-Host "Shared directory link already exists in backend" -ForegroundColor Yellow
    }
    
    # Create symbolic links in frontend
    if (-not (Test-Path "$frontendPath\shared")) {
        cmd /c mklink /D "$frontendPath\shared" "$sharedPath"
        Write-Host "✅ Created symbolic link for shared directory in frontend" -ForegroundColor Green
        "Created symbolic link for shared directory in frontend" | Out-File -FilePath $logPath -Append
    } else {
        Write-Host "Shared directory link already exists in frontend" -ForegroundColor Yellow
    }
}
catch {
    Write-Host "❌ Error creating symbolic links: $_" -ForegroundColor Red
    "Error creating symbolic links: $_" | Out-File -FilePath $logPath -Append
}

Write-Host "Critical import path fixes complete!" -ForegroundColor Green
Write-Host "Log file created at: $logPath" -ForegroundColor Cyan
Write-Host "" -ForegroundColor White
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Try running the application with .\start-reorganized-app.ps1" -ForegroundColor Yellow
Write-Host "2. If issues persist, check the application logs for specific import errors" -ForegroundColor Yellow
