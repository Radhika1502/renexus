Set-Location -Path $PSScriptRoot
Write-Host "Running TaskTimeTracking tests..."
$result = npm test -- src/features/task-management/components/__tests__/TaskTimeTracking.test.tsx
Write-Host "Test output:"
Write-Host $result
Write-Host "Tests completed!"
