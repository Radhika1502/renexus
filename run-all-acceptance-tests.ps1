# Comprehensive Test Runner for Tasks 2.1-2.4
# This script runs all acceptance criteria and test cases

Write-Host "=== Renexus Project - Comprehensive Acceptance Testing ===" -ForegroundColor Cyan
Write-Host "Running all acceptance criteria and test cases for Tasks 2.1-2.4" -ForegroundColor Yellow
Write-Host ""

function Run-Test {
    param(
        [string]$TestScript,
        [string]$TestName
    )
    
    Write-Host "Running $TestName..." -ForegroundColor Blue
    
    if (Test-Path $TestScript) {
        try {
            & powershell -ExecutionPolicy Bypass -File $TestScript
            if ($LASTEXITCODE -eq 0) {
                Write-Host "PASSED: $TestName" -ForegroundColor Green
                return $true
            } else {
                Write-Host "FAILED: $TestName" -ForegroundColor Red
                return $false
            }
        } catch {
            Write-Host "ERROR in $TestName : $($_.Exception.Message)" -ForegroundColor Red
            return $false
        }
    } else {
        Write-Host "TEST SCRIPT NOT FOUND: $TestScript" -ForegroundColor Red
        return $false
    }
}

# Track results
$testResults = @()

# Task 2.1 - Directory Structure Consolidation
Write-Host "`n=== Task 2.1: Directory Structure Consolidation ===" -ForegroundColor Magenta
$result21 = Run-Test "simple-test-2.1.ps1" "Task 2.1 - Directory Structure"
$testResults += @{Task = "2.1"; Result = $result21}

# Task 2.2 - Dashboard Module
Write-Host "`n=== Task 2.2: Dashboard Module ===" -ForegroundColor Magenta
$result22 = Run-Test "test-task-2.2-acceptance-fixed.ps1" "Task 2.2 - Dashboard Module"
$testResults += @{Task = "2.2"; Result = $result22}

# Task 2.3 - API Gateway Service
Write-Host "`n=== Task 2.3: API Gateway Service ===" -ForegroundColor Magenta
$result23 = Run-Test "test-task-2.3-acceptance.ps1" "Task 2.3 - API Gateway"
$testResults += @{Task = "2.3"; Result = $result23}

# Task 2.4 - Database Implementation
Write-Host "`n=== Task 2.4: Database Implementation ===" -ForegroundColor Magenta
$result24 = Run-Test "test-task-2.4-acceptance.ps1" "Task 2.4 - Database"
$testResults += @{Task = "2.4"; Result = $result24}

# Summary Report
Write-Host "`n=== FINAL RESULTS SUMMARY ===" -ForegroundColor Cyan
$passedCount = 0
$totalCount = $testResults.Count

foreach ($result in $testResults) {
    if ($result.Result) {
        Write-Host "Task $($result.Task): PASSED" -ForegroundColor Green
        $passedCount++
    } else {
        Write-Host "Task $($result.Task): FAILED" -ForegroundColor Red
    }
}

$successRate = [math]::Round(($passedCount / $totalCount) * 100, 2)
Write-Host "`nOverall Success Rate: $passedCount/$totalCount ($successRate%)" -ForegroundColor $(if ($successRate -eq 100) { "Green" } else { "Yellow" })

if ($successRate -eq 100) {
    Write-Host "`nALL ACCEPTANCE CRITERIA AND TEST CASES PASSED!" -ForegroundColor Green
    Write-Host "Ready for production deployment." -ForegroundColor Green
    exit 0
} else {
    Write-Host "`nSome tests failed. Please review and fix issues." -ForegroundColor Red
    exit 1
} 