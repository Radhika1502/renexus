# Simple Fix Script for Renexus Application
# This script will fix the most critical issues after reorganization

Write-Host "Renexus Application Simple Fix" -ForegroundColor Cyan
Write-Host "=============================" -ForegroundColor Cyan

# Define paths
$rootPath = $PSScriptRoot
$backendPath = Join-Path $rootPath "backend"
$frontendPath = Join-Path $rootPath "frontend"
$sharedPath = Join-Path $rootPath "shared"
$backendApiPath = Join-Path $backendPath "api"
$frontendWebPath = Join-Path $frontendPath "web"

# Step 1: Copy shared directories to backend and frontend
Write-Host "Step 1: Copying shared directories..." -ForegroundColor Yellow

# Copy shared directories to backend
if (Test-Path $sharedPath) {
    # Copy config directory
    if (Test-Path (Join-Path $sharedPath "config")) {
        Copy-Item -Path (Join-Path $sharedPath "config") -Destination $backendPath -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "✅ Copied config directory to backend" -ForegroundColor Green
    }
    
    # Copy types directory
    if (Test-Path (Join-Path $sharedPath "types")) {
        Copy-Item -Path (Join-Path $sharedPath "types") -Destination $backendPath -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "✅ Copied types directory to backend" -ForegroundColor Green
    }
    
    # Copy utils directory
    if (Test-Path (Join-Path $sharedPath "utils")) {
        Copy-Item -Path (Join-Path $sharedPath "utils") -Destination $backendPath -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "✅ Copied utils directory to backend" -ForegroundColor Green
    }
    
    # Copy to frontend
    if (Test-Path (Join-Path $sharedPath "config")) {
        Copy-Item -Path (Join-Path $sharedPath "config") -Destination $frontendPath -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "✅ Copied config directory to frontend" -ForegroundColor Green
    }
    
    if (Test-Path (Join-Path $sharedPath "types")) {
        Copy-Item -Path (Join-Path $sharedPath "types") -Destination $frontendPath -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "✅ Copied types directory to frontend" -ForegroundColor Green
    }
    
    if (Test-Path (Join-Path $sharedPath "utils")) {
        Copy-Item -Path (Join-Path $sharedPath "utils") -Destination $frontendPath -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "✅ Copied utils directory to frontend" -ForegroundColor Green
    }
} else {
    Write-Host "❌ Shared directory not found" -ForegroundColor Red
}

# Step 2: Update tsconfig.json
Write-Host "Step 2: Updating tsconfig.json..." -ForegroundColor Yellow

$rootTsConfigPath = Join-Path $rootPath "tsconfig.json"
if (Test-Path $rootTsConfigPath) {
    try {
        $tsConfig = Get-Content -Path $rootTsConfigPath -Raw | ConvertFrom-Json
        
        # Add paths property if it doesn't exist
        if (-not $tsConfig.compilerOptions.PSObject.Properties["paths"]) {
            $tsConfig.compilerOptions | Add-Member -MemberType NoteProperty -Name "paths" -Value @{}
        }
        
        # Update paths
        $tsConfig.compilerOptions.paths = @{
            "@/*" = @("./src/*")
            "@shared/*" = @("./shared/*")
            "@config/*" = @("./config/*")
            "@types/*" = @("./types/*")
            "@utils/*" = @("./utils/*")
        }
        
        # Save the updated tsconfig
        $tsConfig | ConvertTo-Json -Depth 10 | Set-Content -Path $rootTsConfigPath
        Write-Host "✅ Updated root tsconfig.json" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ Error updating tsconfig.json: $_" -ForegroundColor Red
    }
} else {
    Write-Host "❌ Root tsconfig.json not found" -ForegroundColor Red
}

# Step 3: Create a simple start script
Write-Host "Step 3: Creating simple start script..." -ForegroundColor Yellow

$startScriptPath = Join-Path $rootPath "start-simple.ps1"
$startScriptContent = @"
# Simple start script for Renexus application
Write-Host "Starting Renexus Application..." -ForegroundColor Cyan

# Start backend
Write-Host "Starting backend server..." -ForegroundColor Yellow
Start-Process -FilePath "powershell" -ArgumentList "-Command", "cd '$backendApiPath'; npm run dev" -WindowStyle Normal

# Wait for backend to initialize
Write-Host "Waiting for backend to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Start frontend
Write-Host "Starting frontend server..." -ForegroundColor Yellow
Start-Process -FilePath "powershell" -ArgumentList "-Command", "cd '$frontendWebPath'; npx next dev" -WindowStyle Normal

Write-Host "Application started!" -ForegroundColor Green
Write-Host "- Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "- Backend: http://localhost:3001" -ForegroundColor Cyan
Write-Host "Wait a few moments, then access the application in your browser." -ForegroundColor Yellow
"@

Set-Content -Path $startScriptPath -Value $startScriptContent
Write-Host "✅ Created simple start script: start-simple.ps1" -ForegroundColor Green

# Step 4: Fix SuggestionPanel.tsx import path
Write-Host "Step 4: Fixing critical import paths..." -ForegroundColor Yellow

$suggestionPanelPath = Join-Path $frontendPath "components\ai\SuggestionPanel.tsx"
if (Test-Path $suggestionPanelPath) {
    $content = Get-Content -Path $suggestionPanelPath -Raw
    
    # Fix import path
    if ($content -match "from '../../types/ai'") {
        $content = $content -replace "from '../../types/ai'", "from '../../../shared/types/ai'"
        Set-Content -Path $suggestionPanelPath -Value $content
        Write-Host "✅ Fixed import path in SuggestionPanel.tsx" -ForegroundColor Green
    } elseif ($content -match "from '../../../shared/types/ai'") {
        Write-Host "✅ Import path in SuggestionPanel.tsx already updated" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Could not find expected import pattern in SuggestionPanel.tsx" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ SuggestionPanel.tsx not found" -ForegroundColor Red
}

Write-Host ""
Write-Host "Fix process completed!" -ForegroundColor Green
Write-Host "To start the application, run: .\start-simple.ps1" -ForegroundColor Cyan
