# Script to update references to the old api folder
# This script will find and replace references to backend/api with backend/api-gateway

Write-Host "Starting update of references to backend/api..." -ForegroundColor Cyan

# Find all files that might contain references to the old api folder
$files = Get-ChildItem -Path "." -Recurse -Include "*.ts", "*.tsx", "*.js", "*.jsx", "*.json", "*.md", "*.yml", "*.yaml" -File

$updatedFiles = 0

foreach ($file in $files) {
    $content = Get-Content -Path $file.FullName -Raw
    
    if ($content -match "backend/api/") {
        Write-Host "Found reference to old API path in $($file.FullName)" -ForegroundColor Yellow
        
        # Replace references to the old api path with the new api-gateway path
        $newContent = $content -replace "backend/api/", "backend/api-gateway/"
        Set-Content -Path $file.FullName -Value $newContent
        
        Write-Host "Updated references in $($file.FullName)" -ForegroundColor Green
        $updatedFiles++
    }
}

Write-Host "Update complete! Updated $updatedFiles files." -ForegroundColor Green 