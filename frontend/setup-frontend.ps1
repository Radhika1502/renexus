# Frontend setup script for Renexus
# This will set up environment variables and restart the server

Write-Host "Setting up Renexus Frontend..." -ForegroundColor Cyan

# Create .env.local with proper API URL
$envContent = @"
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001
NODE_ENV=development
"@

Write-Host "Creating .env.local file..." -NoNewline
Set-Content -Path ".env.local" -Value $envContent
Write-Host " Done!" -ForegroundColor Green

# Install any missing dependencies
Write-Host "Checking dependencies..." -NoNewline
if (-not (Test-Path "node_modules")) {
    Write-Host " Installing packages..." -ForegroundColor Yellow
    npm install
} else {
    Write-Host " Dependencies already installed" -ForegroundColor Green
}

# Create a debug file to help diagnose rendering issues
$debugContent = @"
console.log('Debug script loaded');

// Override console.error to make errors more visible
const originalError = console.error;
console.error = function() {
    document.body.innerHTML += `<div style="position:fixed;bottom:10px;left:10px;background:red;color:white;padding:10px;z-index:10000;max-width:80%;">Error: \${arguments[0]}</div>`;
    originalError.apply(console, arguments);
};

// Add window error handler
window.addEventListener('error', function(e) {
    document.body.innerHTML += `<div style="position:fixed;top:10px;left:10px;background:red;color:white;padding:10px;z-index:10000;max-width:80%;">JS Error: \${e.message}</div>`;
    return false;
});

// Check if React is loading
setTimeout(() => {
    if (!window.React) {
        document.body.innerHTML += `<div style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:orange;color:black;padding:20px;z-index:10000;">React not loaded properly</div>`;
    }
}, 2000);
"@

Write-Host "Creating debug.js..." -NoNewline
if (-not (Test-Path "public")) {
    New-Item -ItemType Directory -Path "public"
}
Set-Content -Path "public/debug.js" -Value $debugContent
Write-Host " Done!" -ForegroundColor Green

# Update index.html to include debug script
$debugScriptTag = '<script src="/debug.js"></script>'
Write-Host "Updating _document.js to include debug script..." -NoNewline

if (-not (Test-Path "pages/_document.js")) {
    $documentContent = @"
import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="en">
      <Head />
      <body>
        <Main />
        <NextScript />
        <script src="/debug.js"></script>
      </body>
    </Html>
  )
}
"@
    Set-Content -Path "pages/_document.js" -Value $documentContent
    Write-Host " Created!" -ForegroundColor Green
} else {
    Write-Host " _document.js already exists" -ForegroundColor Yellow
}

# Clear Next.js cache to prevent stale files
Write-Host "Clearing Next.js cache..." -NoNewline
if (Test-Path ".next") {
    Remove-Item -Recurse -Force ".next"
}
Write-Host " Done!" -ForegroundColor Green

Write-Host "`nSetup complete! Starting Next.js development server..." -ForegroundColor Cyan
Write-Host "Visit http://localhost:3000/test to verify your setup" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop the server`n" -ForegroundColor Yellow

# Start the development server
npm run dev
