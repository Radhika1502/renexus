# Renexus Application Fix Script
# This script will fix your frontend display issue

# Stop any running server processes first
Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object {$_.MainWindowTitle -eq ""} | Stop-Process -Force

# Navigate to frontend directory
Set-Location "C:\Users\HP\Renexus\frontend\web"

# Step 1: Fix dependencies
Write-Host "Step 1: Fixing dependencies..." -ForegroundColor Cyan
npm install next@latest react@latest react-dom@latest
npm install @tanstack/react-query @tanstack/react-query-devtools
npm uninstall react-query

# Step 2: Create a simplified Next.js entry point
Write-Host "Step 2: Creating simplified Next.js page..." -ForegroundColor Cyan

# Create a simple .env.local file
$envContent = "NEXT_PUBLIC_API_URL=http://localhost:3001"
Set-Content -Path ".env.local" -Value $envContent -Force

# Create a new, simplified index page
$simplePage = @"
import { useState, useEffect } from 'react';
import Head from 'next/head';

export default function Home() {
  const [isConnected, setIsConnected] = useState(false);
  const [message, setMessage] = useState('Checking connection...');

  useEffect(() => {
    async function checkConnection() {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        console.log('Trying to connect to API at:', apiUrl);
        
        const response = await fetch(`\${apiUrl}/api/health`);
        
        if (response.ok) {
          const data = await response.json();
          setIsConnected(true);
          setMessage('Backend connected! API status: ' + data.status);
          console.log('API data:', data);
        } else {
          setMessage(`API responded with status: \${response.status}`);
        }
      } catch (error) {
        console.error('Connection error:', error);
        setMessage(`Connection error: \${error.message}`);
      }
    }
    
    checkConnection();
  }, []);

  return (
    <>
      <Head>
        <title>Renexus App</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div className="flex min-h-screen flex-col items-center justify-center p-8">
        <main className="flex w-full max-w-3xl flex-1 flex-col items-center justify-center text-center">
          <h1 className="text-4xl font-bold mb-6">Welcome to Renexus</h1>
          
          <div className={`p-4 mb-6 rounded-lg w-full \${isConnected ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
            <p className="font-medium">{message}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4 w-full max-w-lg">
            <a 
              href="/dashboard" 
              className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100"
            >
              <h2 className="mb-3 text-xl font-semibold">
                Dashboard <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
              </h2>
              <p className="m-0 text-sm opacity-70">
                View your Renexus dashboard
              </p>
            </a>

            <a
              href="/debug"
              className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100"
            >
              <h2 className="mb-3 text-xl font-semibold">
                Debug <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
              </h2>
              <p className="m-0 text-sm opacity-70">
                Diagnose issues with the app
              </p>
            </a>
          </div>
        </main>
        
        <footer className="flex h-24 w-full items-center justify-center border-t">
          <p>Renexus Application - {new Date().getFullYear()}</p>
        </footer>
      </div>
    </>
  );
}
"@
Set-Content -Path "pages\index-simple.tsx" -Value $simplePage -Force

# Step 3: Fix Next.js config to remove swcMinify
Write-Host "Step 3: Updating Next.js configuration..." -ForegroundColor Cyan
$nextConfig = @"
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost'],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3001/api/:path*',
      },
    ];
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  },
};

module.exports = nextConfig;
"@
Set-Content -Path "next.config.js" -Value $nextConfig -Force

# Step 4: Start both servers
Write-Host "Step 4: Starting servers..." -ForegroundColor Cyan

# Start backend server in a new window
Start-Process -FilePath "powershell" -ArgumentList "-NoExit", "-Command", "cd 'C:\Users\HP\Renexus\backend\api'; npm run dev"

# Wait a moment for backend to initialize
Start-Sleep -Seconds 3

# Start frontend with npx next dev
Write-Host "Starting frontend server..." -ForegroundColor Green
Start-Process -FilePath "powershell" -ArgumentList "-NoExit", "-Command", "cd 'C:\Users\HP\Renexus\frontend\web'; npx next -p 3000 dev"

# Open browser after a short delay
Start-Sleep -Seconds 5
Write-Host "Opening browser..." -ForegroundColor Cyan
Start-Process "http://localhost:3000/index-simple" -WindowStyle Normal

Write-Host "Renexus should now be running!" -ForegroundColor Green
Write-Host "- Simple Frontend: http://localhost:3000/index-simple" -ForegroundColor Cyan
Write-Host "- Backend API: http://localhost:3001" -ForegroundColor Cyan
