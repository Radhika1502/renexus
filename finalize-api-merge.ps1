# Script to finalize the API merge
# This script will check for files that need manual merging and remove the old api folder

$apiPath = "backend/api"
$apiGatewayPath = "backend/api-gateway"

Write-Host "Starting finalization of API merge..." -ForegroundColor Cyan

# Check for files that need manual merging
Write-Host "Checking for files that need manual merging..." -ForegroundColor Yellow
$apiFiles = Get-ChildItem -Path $apiGatewayPath -Recurse -Filter "*.api"

if ($apiFiles.Count -gt 0) {
    Write-Host "Found $($apiFiles.Count) files that need manual merging:" -ForegroundColor Red
    foreach ($file in $apiFiles) {
        Write-Host "  - $($file.FullName)" -ForegroundColor Red
        
        # Get the original file path
        $originalFile = $file.FullName -replace "\.api$", ""
        
        # Show diff between files
        Write-Host "    Differences between original and API version:" -ForegroundColor Yellow
        $originalContent = Get-Content -Path $originalFile -Raw
        $apiContent = Get-Content -Path $file.FullName -Raw
        
        if ($originalContent -ne $apiContent) {
            Write-Host "    Files are different. Please review and merge manually." -ForegroundColor Yellow
        } else {
            Write-Host "    Files are identical. You can safely delete the .api version." -ForegroundColor Green
            Remove-Item -Path $file.FullName -Force
        }
    }
} else {
    Write-Host "No files need manual merging." -ForegroundColor Green
}

# Check if api folder still exists
if (Test-Path $apiPath) {
    Write-Host "Do you want to remove the old API folder? (Y/N)" -ForegroundColor Yellow
    $response = Read-Host
    if ($response -eq "Y" -or $response -eq "y") {
        Remove-Item -Path $apiPath -Recurse -Force
        Write-Host "Old API folder removed." -ForegroundColor Green
    } else {
        Write-Host "Old API folder kept. You can remove it manually later." -ForegroundColor Yellow
    }
} else {
    Write-Host "Old API folder already removed." -ForegroundColor Green
}

# Update any import paths in the codebase that might be referencing the old api folder
Write-Host "Checking for import paths that need updating..." -ForegroundColor Yellow
$tsFiles = Get-ChildItem -Path "." -Recurse -Include "*.ts", "*.tsx", "*.js", "*.jsx" -File

foreach ($file in $tsFiles) {
    $content = Get-Content -Path $file.FullName -Raw
    
    # Check if file contains references to the old api path
    if ($content -match "backend/api/") {
        Write-Host "Found reference to old API path in $($file.FullName)" -ForegroundColor Yellow
        
        # Replace references to the old api path with the new api-gateway path
        $newContent = $content -replace "backend/api/", "backend/api-gateway/"
        Set-Content -Path $file.FullName -Value $newContent
        
        Write-Host "Updated references in $($file.FullName)" -ForegroundColor Green
    }
}

Write-Host "API merge finalization complete!" -ForegroundColor Green
Write-Host "IMPORTANT: If there were files that needed manual merging, please review them before proceeding." -ForegroundColor Yellow 