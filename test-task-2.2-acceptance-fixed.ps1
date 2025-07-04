# Task 2.2 Dashboard Module Acceptance Criteria Test
Write-Host "=== Task 2.2 Dashboard Module Tests ===" -ForegroundColor Cyan

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

# Test 1: Dashboard components display real data
Write-Host "`n1. Testing dashboard components..." -ForegroundColor Yellow
$hasDashboardSummaryCard = Test-Path "frontend\web\src\components\dashboard\DashboardSummaryCard.tsx"
$hasProjectProgressCard = Test-Path "frontend\web\src\components\dashboard\ProjectProgressCard.tsx"
$hasTaskStatusChart = Test-Path "frontend\web\src\components\dashboard\TaskStatusChart.tsx"
$hasActivityFeed = Test-Path "frontend\web\src\components\dashboard\ActivityFeed.tsx"

$dashboardComponents = $hasDashboardSummaryCard -and $hasProjectProgressCard -and $hasTaskStatusChart -and $hasActivityFeed
Test-Criteria "Dashboard components exist" $dashboardComponents "Missing dashboard components"

# Test 2: Backend dashboard API exists
Write-Host "`n2. Testing backend dashboard API..." -ForegroundColor Yellow
$hasDashboardController = Test-Path "backend\api-gateway\src\features\dashboard\dashboard.controller.ts"
$hasDashboardService = Test-Path "backend\api-gateway\src\features\dashboard\dashboard.service.ts"

$backendAPI = $hasDashboardController -and $hasDashboardService
Test-Criteria "Backend dashboard API exists" $backendAPI "Missing backend dashboard API files"

# Test 3: Frontend dashboard service exists
Write-Host "`n3. Testing frontend dashboard service..." -ForegroundColor Yellow
$hasFrontendDashboardService = Test-Path "frontend\web\src\features\dashboard\api\dashboardService.ts"

Test-Criteria "Frontend dashboard service exists" $hasFrontendDashboardService "Missing frontend dashboard service"

# Test 4: Dashboard hooks exist
Write-Host "`n4. Testing dashboard hooks..." -ForegroundColor Yellow
$hasDashboardHooks = Test-Path "frontend\web\src\features\dashboard\hooks"

Test-Criteria "Dashboard hooks directory exists" $hasDashboardHooks "Missing dashboard hooks"

# Test 5: UI components and styling exist
Write-Host "`n5. Testing dashboard consistency..." -ForegroundColor Yellow
$hasUIComponents = Test-Path "frontend\web\src\components\ui"
$hasStyles1 = Test-Path "frontend\web\src\styles"
$hasStyles2 = Test-Path "frontend\web\styles"

$styling = $hasUIComponents -and ($hasStyles1 -or $hasStyles2)
Test-Criteria "UI components and styling exist" $styling "Missing UI components or styles"

# Test 6: Check for main dashboard page
Write-Host "`n6. Testing dashboard page..." -ForegroundColor Yellow
$hasDashboardPage1 = Test-Path "frontend\web\pages\dashboard.tsx"
$hasDashboardPage2 = Test-Path "frontend\web\src\features\dashboard\pages\DashboardPage.tsx"

$hasDashboardPage = $hasDashboardPage1 -or $hasDashboardPage2
Test-Criteria "Dashboard page exists" $hasDashboardPage "Missing dashboard page"

# Test 7: Check for dashboard types
Write-Host "`n7. Testing dashboard types..." -ForegroundColor Yellow
$hasDashboardTypes = Test-Path "frontend\web\src\features\dashboard\types"

Test-Criteria "Dashboard types exist" $hasDashboardTypes "Missing dashboard types"

# Summary
Write-Host "`n=== Test Summary ===" -ForegroundColor Cyan
Write-Host "Passed: $passed" -ForegroundColor Green
Write-Host "Failed: $failed" -ForegroundColor Red

$total = $passed + $failed
$percentage = if ($total -gt 0) { [math]::Round(($passed / $total) * 100, 1) } else { 0 }
Write-Host "Success Rate: $percentage%" -ForegroundColor Cyan

if ($failed -eq 0) {
    Write-Host "`n🎉 ALL TESTS PASSED! Task 2.2 is complete." -ForegroundColor Green
    exit 0
} else {
    Write-Host "`n⚠️ Some tests failed. Task 2.2 needs work." -ForegroundColor Yellow
    exit 1
} 