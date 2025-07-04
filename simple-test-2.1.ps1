# Simple Task 2.1 Acceptance Criteria Test
Write-Host "=== Task 2.1 Directory Structure Tests ===" -ForegroundColor Cyan

$passed = 0
$failed = 0

function Test-Criteria {
    param($name, $condition, $description)
    if ($condition) {
        Write-Host "✅ PASS: $name" -ForegroundColor Green
        $global:passed++
    } else {
        Write-Host "❌ FAIL: $name - $description" -ForegroundColor Red
        $global:failed++
    }
}

# Test 1: No duplicate directories
Write-Host "`n1. Testing for duplicate directories..." -ForegroundColor Yellow
$duplicateDatabase = (Test-Path "backend\database") -and (Test-Path "packages\database")
$duplicatePackages = (Test-Path "backend\packages") -and (Test-Path "packages")
$duplicateShared = (Test-Path "shared") -and (Test-Path "packages\shared")
$duplicateServices = (Test-Path "services") -and (Test-Path "backend\services")
$duplicateConfig = (Test-Path "config") -and (Test-Path "backend\config")

$noDuplicates = -not ($duplicateDatabase -or $duplicatePackages -or $duplicateShared -or $duplicateServices -or $duplicateConfig)
Test-Criteria "No duplicate directories" $noDuplicates "Found duplicate directories"

# Test 2: Backend microservices structure
Write-Host "`n2. Testing backend microservices structure..." -ForegroundColor Yellow
$hasApiGateway = Test-Path "backend\api-gateway"
$hasAuthService = Test-Path "backend\auth-service"
$hasTaskService = Test-Path "backend\task-service"
$hasNotificationService = Test-Path "backend\notification-service"

$backendStructure = $hasApiGateway -and $hasAuthService -and $hasTaskService -and $hasNotificationService
Test-Criteria "Backend microservices structure" $backendStructure "Missing backend services"

# Test 3: Frontend feature-based organization
Write-Host "`n3. Testing frontend structure..." -ForegroundColor Yellow
$hasFrontendWeb = Test-Path "frontend\web"
$hasComponents = Test-Path "frontend\web\src\components"
$hasServices = Test-Path "frontend\web\src\services"

$frontendStructure = $hasFrontendWeb -and $hasComponents -and $hasServices
Test-Criteria "Frontend feature-based structure" $frontendStructure "Missing frontend directories"

# Test 4: Shared packages
Write-Host "`n4. Testing shared packages..." -ForegroundColor Yellow
$hasPackagesUI = Test-Path "packages\ui"
$hasPackagesDB = Test-Path "packages\database"
$hasPackagesShared = Test-Path "packages\shared"

$sharedPackages = $hasPackagesUI -and $hasPackagesDB -and $hasPackagesShared
Test-Criteria "Shared packages structure" $sharedPackages "Missing shared packages"

# Test 5: Key files exist
Write-Host "`n5. Testing key files..." -ForegroundColor Yellow
$hasMainTS = Test-Path "backend\api-gateway\src\main.ts"
$hasPackageJson = Test-Path "backend\api-gateway\package.json"
$hasSchema = Test-Path "packages\database\schema.ts"

$keyFiles = $hasMainTS -and $hasPackageJson -and $hasSchema
Test-Criteria "Key files exist" $keyFiles "Missing key files"

# Summary
Write-Host "`n=== Test Summary ===" -ForegroundColor Cyan
Write-Host "Passed: $passed" -ForegroundColor Green
Write-Host "Failed: $failed" -ForegroundColor Red

$total = $passed + $failed
$percentage = if ($total -gt 0) { [math]::Round(($passed / $total) * 100, 1) } else { 0 }
Write-Host "Success Rate: $percentage%" -ForegroundColor Cyan

if ($failed -eq 0) {
    Write-Host "`n🎉 ALL TESTS PASSED! Task 2.1 is complete." -ForegroundColor Green
    exit 0
} else {
    Write-Host "`n⚠️ Some tests failed. Task 2.1 needs work." -ForegroundColor Yellow
    exit 1
} 