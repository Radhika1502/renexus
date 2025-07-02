# Run Renexus Frontend
# This script properly sets up and runs the Next.js frontend

# Navigate to frontend directory
Set-Location -Path "C:\Users\HP\Renexus\frontend\web"

# Create environment file dynamically at runtime
$envContent = "NEXT_PUBLIC_API_URL=http://localhost:3001"
Write-Output $envContent | Out-File -FilePath ".env.local" -Encoding utf8 -Force

Write-Host "Environment file created with API URL: http://localhost:3001" -ForegroundColor Green

# Clean Next.js cache
Write-Host "Cleaning Next.js cache..." -ForegroundColor Yellow
if (Test-Path ".next") {
    Remove-Item -Recurse -Force ".next"
}

# Install missing modules if needed
Write-Host "Checking for required modules..." -ForegroundColor Yellow
if (-not (Test-Path "node_modules/.bin/next")) {
    Write-Host "Installing Next.js dependencies..." -ForegroundColor Yellow
    # Force clean install of dependencies
    npm install
    
    # Explicit install of Next.js if not found after npm install
    if (-not (Test-Path "node_modules/.bin/next")) {
        Write-Host "Explicitly installing Next.js..." -ForegroundColor Yellow
        npm install next@14.2.3 react@18.3.1 react-dom@18.3.1 --save
    }
}

# Start Next.js with explicit options
Write-Host "Starting Next.js development server..." -ForegroundColor Cyan
Write-Host "Your application will be available at: http://localhost:3000/test-page" -ForegroundColor Green
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow

# Run Next.js with node modules path to ensure we use the locally installed version
$env:PATH = "$PWD\node_modules\.bin;" + $env:PATH
node ./node_modules/next/dist/bin/next dev -p 3000
