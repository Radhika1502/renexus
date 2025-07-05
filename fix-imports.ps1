# PowerShell script to fix UI component imports
Write-Host "Fixing UI component imports..." -ForegroundColor Green

# Get all TypeScript and TSX files in the frontend src directory
$files = Get-ChildItem -Path "frontend/web/src" -Recurse -Include "*.ts", "*.tsx"

foreach ($file in $files) {
    $content = Get-Content -Path $file.FullName -Raw
    
    # Skip if file doesn't contain @renexus/ui-components imports
    if (-not ($content -match "@renexus/ui-components")) {
        continue
    }
    
    Write-Host "Processing: $($file.FullName)" -ForegroundColor Yellow
    
    # Replace the import statements
    $content = $content -replace "import \{ ([^}]+) \} from '@renexus/ui-components';", "import { `$1 } from '../../../components/ui';"
    $content = $content -replace "import \{ ([^}]+) \} from '@renexus/ui-components/([^']+)';", "import { `$1 } from '../../../components/ui';"
    
    # Handle different path levels - adjust based on file location
    $relativePath = $file.FullName.Replace((Get-Location).Path, "").Replace("\", "/")
    $pathDepth = ($relativePath.Split("/").Length - 4) # Subtract base path parts
    
    if ($pathDepth -eq 1) {
        $importPath = "../components/ui"
    } elseif ($pathDepth -eq 2) {
        $importPath = "../../components/ui"
    } elseif ($pathDepth -eq 3) {
        $importPath = "../../../components/ui"
    } elseif ($pathDepth -eq 4) {
        $importPath = "../../../../components/ui"
    } else {
        $importPath = "../../../components/ui" # Default fallback
    }
    
    # Replace with correct relative path
    $content = $content -replace "import \{ ([^}]+) \} from '@renexus/ui-components';", "import { `$1 } from '$importPath';"
    $content = $content -replace "import \{ ([^}]+) \} from '@renexus/ui-components/([^']+)';", "import { `$1 } from '$importPath';"
    
    # Write the modified content back to the file
    Set-Content -Path $file.FullName -Value $content -NoNewline
}

Write-Host "Import fixing complete!" -ForegroundColor Green 