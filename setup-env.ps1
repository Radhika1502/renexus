# Setup-Env.ps1 - Setup environment for Renexus

# Set error action preference
$ErrorActionPreference = "Stop"

# Display header
Write-Host "=== Renexus Environment Setup ===" -ForegroundColor Cyan
Write-Host "Setting up environment files..." -ForegroundColor Cyan
Write-Host ""

# Function to copy example env file
function Copy-EnvFile {
    param (
        [string]$ExamplePath,
        [string]$TargetPath
    )
    
    Write-Host "Checking $TargetPath..." -NoNewline
    
    if (Test-Path $TargetPath) {
        Write-Host " Already exists" -ForegroundColor Yellow
    } else {
        if (Test-Path $ExamplePath) {
            Copy-Item -Path $ExamplePath -Destination $TargetPath
            Write-Host " Created from example" -ForegroundColor Green
        } else {
            Write-Host " Example file not found: $ExamplePath" -ForegroundColor Red
            return $false
        }
    }
    
    return $true
}

# Set paths
$rootDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Backend .env
$backendEnvExample = Join-Path $rootDir "backend\api\.env.example"
$backendEnv = Join-Path $rootDir "backend\api\.env"

# Frontend .env.local
$frontendEnvExample = Join-Path $rootDir "frontend\web\env.local.example"
$frontendEnv = Join-Path $rootDir "frontend\web\.env.local"

# Create backend .env
if (Copy-EnvFile -ExamplePath $backendEnvExample -TargetPath $backendEnv) {
    Write-Host "Backend environment file is ready: $backendEnv" -ForegroundColor Green
} else {
    Write-Host "Failed to create backend environment file" -ForegroundColor Red
}

# Create frontend .env.local
if (Copy-EnvFile -ExamplePath $frontendEnvExample -TargetPath $frontendEnv) {
    Write-Host "Frontend environment file is ready: $frontendEnv" -ForegroundColor Green
} else {
    Write-Host "Failed to create frontend environment file" -ForegroundColor Red
}

# Install dependencies
Write-Host ""
Write-Host "=== Installing Dependencies ===" -ForegroundColor Cyan

# Install backend dependencies
$backendDir = Join-Path $rootDir "backend\api"
if (Test-Path $backendDir) {
    Write-Host "Installing backend dependencies..." -ForegroundColor Yellow
    Set-Location $backendDir
    npm install
} else {
    Write-Host "Backend directory not found: $backendDir" -ForegroundColor Red
}

# Install frontend dependencies
$frontendDir = Join-Path $rootDir "frontend\web"
if (Test-Path $frontendDir) {
    Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
    Set-Location $frontendDir
    npm install
} else {
    Write-Host "Frontend directory not found: $frontendDir" -ForegroundColor Red
}

# Return to root directory
Set-Location $rootDir

Write-Host ""
Write-Host "=== Setup Complete ===" -ForegroundColor Green
Write-Host "1. Review the environment files:"
Write-Host "   - Backend: $backendEnv"
Write-Host "   - Frontend: $frontendEnv"
Write-Host "2. Start the development environment with: .\start-dev.ps1"
Write-Host ""

# Check if the user wants to start the application
$startApp = Read-Host "Do you want to start the development environment now? (y/n)"
if ($startApp -eq 'y') {
    Write-Host "Starting development environment..." -ForegroundColor Cyan
    .\start-dev.ps1
}

# Return to the original directory
Set-Location $PSScriptRoot
