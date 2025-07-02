# Simple script to verify directory structure
Write-Host "Verifying directory structure..." -ForegroundColor Cyan

$requiredDirs = @(
    "backend/api-gateway",
    "backend/auth-service",
    "backend/task-service",
    "backend/notification-service",
    "frontend/web/src/features",
    "packages/ui",
    "packages/database",
    "packages/shared"
)

$allExist = $true
foreach ($dir in $requiredDirs) {
    if (Test-Path $dir) {
        Write-Host "Found: $dir" -ForegroundColor Green
    } else {
        Write-Host "Missing: $dir" -ForegroundColor Red
        $allExist = $false
    }
}

if ($allExist) {
    Write-Host "`nAll required directories exist." -ForegroundColor Green
} else {
    Write-Host "`nSome required directories are missing." -ForegroundColor Yellow
}
