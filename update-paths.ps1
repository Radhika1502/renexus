# Script to update import paths after directory restructuring
Write-Host "Updating import paths..." -ForegroundColor Cyan

# Define path mappings (old path -> new path)
$pathMappings = @{
    "../backend/api/" = "../backend/api-gateway/"
    "../../backend/api/" = "../../backend/api-gateway/"
    "../backend/services/task/" = "../backend/task-service/"
    "../../backend/services/task/" = "../../backend/task-service/"
    "../frontend/components/" = "../frontend/web/src/components/"
    "../../frontend/components/" = "../../frontend/web/src/components/"
    "../shared/" = "../packages/shared/"
    "../../shared/" = "../../packages/shared/"
}

# Count of files updated
$updatedFiles = 0

# Process TypeScript/JavaScript files
Write-Host "Processing TypeScript/JavaScript files..."
$files = Get-ChildItem -Path "." -Recurse -Include "*.ts", "*.tsx", "*.js", "*.jsx" -Exclude "node_modules" | Select-Object -First 100

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    $updated = $false
    
    foreach ($oldPath in $pathMappings.Keys) {
        $newPath = $pathMappings[$oldPath]
        if ($content -match [regex]::Escape($oldPath)) {
            $content = $content -replace [regex]::Escape($oldPath), $newPath
            $updated = $true
        }
    }
    
    if ($updated) {
        $content | Set-Content -Path $file.FullName -Encoding UTF8
        $updatedFiles++
        Write-Host "Updated: $($file.FullName)" -ForegroundColor Green
    }
}

Write-Host "`nUpdated $updatedFiles files." -ForegroundColor Green
