# Fix frontend display issue
Write-Host "Fixing Next.js installation..." -ForegroundColor Cyan

# Navigate to the frontend directory
Set-Location -Path "frontend\web"

# Create simple .env.local file with API URL
$envContent = "NEXT_PUBLIC_API_URL=http://localhost:3001"
Set-Content -Path ".env.local" -Value $envContent -Force

# Reinstall Next.js globally and locally
Write-Host "Installing Next.js globally..." -ForegroundColor Yellow
npm install -g next

Write-Host "Installing Next.js locally..." -ForegroundColor Yellow
npm install next@latest react@latest react-dom@latest

# Start the frontend server
Write-Host "Starting frontend server..." -ForegroundColor Green
npx next dev
