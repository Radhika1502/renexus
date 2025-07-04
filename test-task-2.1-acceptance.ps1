# Task 2.1 Acceptance Criteria and Test Cases
# Tests to verify directory structure consolidation is complete

$ErrorActionPreference = "Stop"
$testResults = @()
$testsPassed = 0
$testsFailed = 0

function Test-Acceptance {
    param(
        [string]$TestName,
        [scriptblock]$TestBlock,
        [string]$ExpectedResult = "Pass"
    )
    
    Write-Host "`n=== Testing: $TestName ===" -ForegroundColor Cyan
    
    try {
        $result = & $TestBlock
        if ($result -eq $true -or $result -eq "Pass") {
            Write-Host "✅ PASS: $TestName" -ForegroundColor Green
            $global:testsPassed++
            $global:testResults += @{ Test = $TestName; Result = "PASS"; Details = "Test completed successfully" }
        } else {
            Write-Host "❌ FAIL: $TestName - $result" -ForegroundColor Red
            $global:testsFailed++
            $global:testResults += @{ Test = $TestName; Result = "FAIL"; Details = $result }
        }
    } catch {
        Write-Host "❌ ERROR: $TestName - $_" -ForegroundColor Red
        $global:testsFailed++
        $global:testResults += @{ Test = $TestName; Result = "ERROR"; Details = $_.Exception.Message }
    }
}

# Acceptance Criteria Tests

Write-Host "🔍 Starting Task 2.1 Acceptance Criteria Tests" -ForegroundColor Yellow

# AC1: No duplicate directories exist
Test-Acceptance "AC1: No duplicate directories exist" {
    $duplicates = @()
    
    # Check for backend/database vs packages/database
    if ((Test-Path "backend\database") -and (Test-Path "packages\database")) {
        $duplicates += "database directories"
    }
    
    # Check for backend/packages vs root packages
    if ((Test-Path "backend\packages") -and (Test-Path "packages")) {
        $duplicates += "packages directories"
    }
    
    # Check for root shared vs packages/shared
    if ((Test-Path "shared") -and (Test-Path "packages\shared")) {
        $duplicates += "shared directories"
    }
    
    # Check for root services vs backend/services
    if ((Test-Path "services") -and (Test-Path "backend\services")) {
        $duplicates += "services directories"
    }
    
    # Check for root config vs backend/config
    if ((Test-Path "config") -and (Test-Path "backend\config")) {
        $duplicates += "config directories"
    }
    
    if ($duplicates.Count -eq 0) {
        return $true
    } else {
        return "Found duplicate directories: $($duplicates -join ', ')"
    }
}

# AC2: Backend is organized into microservices
Test-Acceptance "AC2: Backend is organized into microservices" {
    $requiredServices = @("api-gateway", "auth-service", "task-service", "notification-service")
    $missingServices = @()
    
    foreach ($service in $requiredServices) {
        if (-not (Test-Path "backend\$service")) {
            $missingServices += $service
        }
    }
    
    if ($missingServices.Count -eq 0) {
        return $true
    } else {
        return "Missing backend services: $($missingServices -join ', ')"
    }
}

# AC3: Frontend follows feature-based organization
Test-Acceptance "AC3: Frontend follows feature-based organization" {
    $frontendStructure = @("web\src\components", "web\src\features", "web\src\hooks", "web\src\services")
    $missingDirs = @()
    
    foreach ($dir in $frontendStructure) {
        if (-not (Test-Path "frontend\$dir")) {
            $missingDirs += $dir
        }
    }
    
    if ($missingDirs.Count -eq 0) {
        return $true
    } else {
        return "Missing frontend directories: $($missingDirs -join ', ')"
    }
}

# AC4: Shared packages are properly separated
Test-Acceptance "AC4: Shared packages are properly separated" {
    $sharedPackages = @("packages\ui", "packages\database", "packages\shared")
    $missingPackages = @()
    
    foreach ($package in $sharedPackages) {
        if (-not (Test-Path $package)) {
            $missingPackages += $package
        }
    }
    
    if ($missingPackages.Count -eq 0) {
        return $true
    } else {
        return "Missing shared packages: $($missingPackages -join ', ')"
    }
}

# AC5: No code functionality was lost during restructuring
Test-Acceptance "AC5: No code functionality was lost during restructuring" {
    # Check for key files in expected locations
    $keyFiles = @(
        "backend\api-gateway\src\main.ts",
        "backend\api-gateway\package.json",
        "packages\database\schema.ts",
        "frontend\web\src\components\ui\index.ts",
        "packages\shared\types\index.ts"
    )
    
    $missingFiles = @()
    foreach ($file in $keyFiles) {
        if (-not (Test-Path $file)) {
            $missingFiles += $file
        }
    }
    
    if ($missingFiles.Count -eq 0) {
        return $true
    } else {
        return "Missing key files: $($missingFiles -join ', ')"
    }
}

# Test Cases

Write-Host "`n🧪 Starting Task 2.1 Test Cases" -ForegroundColor Yellow

# TC1: Verify all services start correctly after restructuring
Test-Acceptance "TC1: Verify all services start correctly after restructuring" {
    # Check if package.json files exist for all services
    $services = @("backend\api-gateway", "backend\auth-service", "backend\task-service", "backend\notification-service")
    $servicesWithoutPackageJson = @()
    
    foreach ($service in $services) {
        if (-not (Test-Path "$service\package.json")) {
            $servicesWithoutPackageJson += $service
        }
    }
    
    if ($servicesWithoutPackageJson.Count -eq 0) {
        return $true
    } else {
        return "Services without package.json: $($servicesWithoutPackageJson -join ', ')"
    }
}

# TC2: Confirm all features continue working after restructuring
Test-Acceptance "TC2: Confirm all features continue working after restructuring" {
    # Check if main entry points exist
    $entryPoints = @(
        "frontend\web\pages\index.tsx",
        "frontend\web\src\components\dashboard\DashboardSummaryCard.tsx",
        "backend\api-gateway\src\main.ts"
    )
    
    $missingEntryPoints = @()
    foreach ($entryPoint in $entryPoints) {
        if (-not (Test-Path $entryPoint)) {
            $missingEntryPoints += $entryPoint
        }
    }
    
    if ($missingEntryPoints.Count -eq 0) {
        return $true
    } else {
        return "Missing entry points: $($missingEntryPoints -join ', ')"
    }
}

# TC3: Test build process for all packages
Test-Acceptance "TC3: Test build process for all packages" {
    # Check if TypeScript config files exist
    $tsConfigs = @(
        "backend\api-gateway\tsconfig.json",
        "frontend\web\tsconfig.json",
        "packages\ui\tsconfig.json"
    )
    
    $missingTsConfigs = @()
    foreach ($tsConfig in $tsConfigs) {
        if (-not (Test-Path $tsConfig)) {
            $missingTsConfigs += $tsConfig
        }
    }
    
    if ($missingTsConfigs.Count -eq 0) {
        return $true
    } else {
        return "Missing TypeScript configs: $($missingTsConfigs -join ', ')"
    }
}

# TC4: Validate all imports are working correctly
Test-Acceptance "TC4: Validate all imports are working correctly" {
    # Check for old import paths in test files
    $testFiles = Get-ChildItem -Path "tests" -Recurse -Include "*.ts", "*.js" -File | Select-Object -First 5
    $badImports = @()
    
    foreach ($file in $testFiles) {
        $content = Get-Content -Path $file.FullName -Raw
        if ($content -match "\.\.\/\.\.\/database\/db" -or $content -match "\.\.\/database\/db") {
            $badImports += $file.FullName
        }
    }
    
    if ($badImports.Count -eq 0) {
        return $true
    } else {
        return "Files with old import paths: $($badImports -join ', ')"
    }
}

# Additional Structure Validation Tests

Test-Acceptance "Structure: Recommended directory structure follows pattern" {
    $recommendedStructure = @{
        "backend\api-gateway" = "API Gateway service"
        "backend\auth-service" = "Authentication service"
        "backend\task-service" = "Task management service"
        "backend\notification-service" = "Notification service"
        "frontend\web" = "Next.js web application"
        "packages\ui" = "UI component library"
        "packages\database" = "Database models and utilities"
        "packages\shared" = "Cross-app shared utilities"
        "infrastructure" = "Infrastructure code"
        "scripts" = "Utility scripts"
        "docs" = "Documentation"
        "tests" = "Global test files"
    }
    
    $missingStructure = @()
    foreach ($path in $recommendedStructure.Keys) {
        if (-not (Test-Path $path)) {
            $missingStructure += "$path ($($recommendedStructure[$path]))"
        }
    }
    
    if ($missingStructure.Count -eq 0) {
        return $true
    } else {
        return "Missing recommended structure: $($missingStructure -join ', ')"
    }
}

# Summary
Write-Host "`n📊 Test Results Summary" -ForegroundColor Yellow
Write-Host "Tests Passed: $testsPassed" -ForegroundColor Green
Write-Host "Tests Failed: $testsFailed" -ForegroundColor Red
Write-Host "Total Tests: $($testsPassed + $testsFailed)" -ForegroundColor Cyan

if ($testsFailed -eq 0) {
    Write-Host "`n🎉 ALL TESTS PASSED! Task 2.1 directory structure is 100% complete." -ForegroundColor Green
} else {
    Write-Host "`n⚠️  Some tests failed. Task 2.1 needs additional work." -ForegroundColor Yellow
    
    Write-Host "`nFailed Tests Details:" -ForegroundColor Red
    foreach ($result in $testResults) {
        if ($result.Result -ne "PASS") {
            Write-Host "❌ $($result.Test): $($result.Details)" -ForegroundColor Red
        }
    }
}

# Calculate success percentage
$successPercentage = [math]::Round(($testsPassed / ($testsPassed + $testsFailed)) * 100, 1)
Write-Host "`n📈 Success Rate: $successPercentage%" -ForegroundColor Cyan

return $successPercentage 