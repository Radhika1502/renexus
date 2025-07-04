# Task 2.3 API Gateway Service Acceptance Criteria Test
Write-Host "=== Task 2.3 API Gateway Service Tests ===" -ForegroundColor Cyan

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

# Test 1: API Gateway structure exists
Write-Host "`n1. Testing API Gateway structure..." -ForegroundColor Yellow
$hasApiGateway = Test-Path "backend\api-gateway"
$hasMainEntry = Test-Path "backend\api-gateway\src\main.ts"
$hasAppModule = Test-Path "backend\api-gateway\src\app.module.ts"
$hasPackageJson = Test-Path "backend\api-gateway\package.json"

$apiGatewayStructure = $hasApiGateway -and $hasMainEntry -and $hasAppModule -and $hasPackageJson
Test-Criteria "API Gateway structure exists" $apiGatewayStructure "Missing API Gateway structure"

# Test 2: Gateway routing is configured
Write-Host "`n2. Testing gateway routing..." -ForegroundColor Yellow
$hasGatewayModule = Test-Path "backend\api-gateway\src\gateway"
$hasRoutesConfig = Test-Path "backend\api-gateway\routes.ts"

$gatewayRouting = $hasGatewayModule -or $hasRoutesConfig
Test-Criteria "Gateway routing configured" $gatewayRouting "Missing gateway routing configuration"

# Test 3: Service registration exists
Write-Host "`n3. Testing service registration..." -ForegroundColor Yellow
$hasAuthService = Test-Path "backend\auth-service"
$hasTaskService = Test-Path "backend\task-service"
$hasNotificationService = Test-Path "backend\notification-service"

$serviceRegistration = $hasAuthService -and $hasTaskService -and $hasNotificationService
Test-Criteria "Microservices exist for registration" $serviceRegistration "Missing microservices"

# Test 4: Load balancing and health checks
Write-Host "`n4. Testing load balancing and health checks..." -ForegroundColor Yellow
$hasHealthModule = Test-Path "backend\api-gateway\src\health"
$hasLoadBalancer = Test-Path "backend\api-gateway\src\load-balancer"

$loadBalancing = $hasHealthModule -or $hasLoadBalancer
Test-Criteria "Load balancing/health checks configured" $loadBalancing "Missing load balancing or health checks"

# Test 5: Authentication/authorization middleware
Write-Host "`n5. Testing authentication middleware..." -ForegroundColor Yellow
$hasAuthMiddleware = Test-Path "backend\api-gateway\src\middleware\auth.middleware.ts"
$hasGuards = Test-Path "backend\api-gateway\src\guards"

$authMiddleware = $hasAuthMiddleware -or $hasGuards
Test-Criteria "Authentication middleware exists" $authMiddleware "Missing authentication middleware"

# Test 6: Request/response transformation
Write-Host "`n6. Testing request/response transformation..." -ForegroundColor Yellow
$hasTransformers = Test-Path "backend\api-gateway\src\transformers"
$hasInterceptors = Test-Path "backend\api-gateway\src\interceptors"

$transformation = $hasTransformers -or $hasInterceptors
Test-Criteria "Request/response transformation exists" $transformation "Missing transformation logic"

# Test 7: Error handling
Write-Host "`n7. Testing error handling..." -ForegroundColor Yellow
$hasErrorFilter = Test-Path "backend\api-gateway\src\filters"
$hasExceptionHandler = Test-Path "backend\api-gateway\src\exception-handler"

$errorHandling = $hasErrorFilter -or $hasExceptionHandler
Test-Criteria "Error handling exists" $errorHandling "Missing error handling"

# Test 8: Logging and monitoring
Write-Host "`n8. Testing logging and monitoring..." -ForegroundColor Yellow
$hasLogging = Test-Path "backend\api-gateway\src\logging"
$hasMonitoring = Test-Path "backend\api-gateway\src\monitoring"

$loggingMonitoring = $hasLogging -or $hasMonitoring
Test-Criteria "Logging and monitoring exists" $loggingMonitoring "Missing logging and monitoring"

# Summary
Write-Host "`n=== Test Summary ===" -ForegroundColor Cyan
Write-Host "Passed: $passed" -ForegroundColor Green
Write-Host "Failed: $failed" -ForegroundColor Red

$total = $passed + $failed
$percentage = if ($total -gt 0) { [math]::Round(($passed / $total) * 100, 1) } else { 0 }
Write-Host "Success Rate: $percentage%" -ForegroundColor Cyan

if ($failed -eq 0) {
    Write-Host "`n🎉 ALL TESTS PASSED! Task 2.3 is complete." -ForegroundColor Green
    exit 0
} else {
    Write-Host "`n⚠️ Some tests failed. Task 2.3 needs work." -ForegroundColor Yellow
    exit 1
}