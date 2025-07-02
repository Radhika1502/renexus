# Simple start script for Renexus application
Write-Host "Starting Renexus Application..." -ForegroundColor Cyan

# Start backend
Write-Host "Starting backend server..." -ForegroundColor Yellow
Start-Process -FilePath "powershell" -ArgumentList "-Command", "cd 'C:\Users\HP\Renexus\backend\api'; npm run dev" -WindowStyle Normal

# Wait for backend to initialize
Write-Host "Waiting for backend to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Start frontend
Write-Host "Starting frontend server..." -ForegroundColor Yellow
Start-Process -FilePath "powershell" -ArgumentList "-Command", "cd 'C:\Users\HP\Renexus\frontend\web'; npx next dev" -WindowStyle Normal

Write-Host "Application started!" -ForegroundColor Green
Write-Host "- Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "- Backend: http://localhost:3001" -ForegroundColor Cyan
Write-Host "Wait a few moments, then access the application in your browser." -ForegroundColor Yellow
