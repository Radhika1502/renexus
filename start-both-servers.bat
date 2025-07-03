@echo off
echo Starting Renexus Servers...

start "Backend" cmd /k "cd backend\api-gateway && node simple-server.js"
timeout /t 3 >nul

start "Frontend" cmd /k "cd frontend\web && npm run dev"
timeout /t 10 >nul

echo Opening dashboard...
start http://localhost:3000/dashboard 