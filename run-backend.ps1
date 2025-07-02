# Run Renexus Backend API
# This script properly sets up and runs the NestJS backend

# Navigate to backend directory
Set-Location -Path "C:\Users\HP\Renexus\backend\api"

# Create environment file for backend
$backendEnv = @"
# Database Configuration
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/renexus?schema=public"

# Server Configuration
PORT=3001
NODE_ENV=development
LOG_LEVEL=debug

# Security
JWT_SECRET=renexus-jwt-secret-dev-only
ALLOWED_ORIGINS=http://localhost:3000
"@

Write-Output $backendEnv | Out-File -FilePath ".env" -Encoding utf8 -Force
Write-Host "Backend environment file created" -ForegroundColor Green

# Check for required packages
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing backend dependencies..." -ForegroundColor Yellow
    npm install
}

# Start backend server
Write-Host "Starting NestJS backend server..." -ForegroundColor Cyan
Write-Host "API will be available at: http://localhost:3001" -ForegroundColor Green

# Run backend with appropriate script
npm run dev
