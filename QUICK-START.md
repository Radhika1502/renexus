# Renexus Quick Start Guide

## Overview
This guide helps you get the Renexus application running quickly without Docker dependencies.

## Prerequisites
- Node.js (v18 or higher)
- npm (v10 or higher)

## Quick Start Options

### Option 1: Using Batch File (Recommended)
```bash
# Start all services
.\run-app.bat

# Or specific commands
.\run-app.bat start
.\run-app.bat status
.\run-app.bat stop
.\run-app.bat help
```

### Option 2: Using PowerShell Script
```powershell
# Start all services (will skip Docker if not available)
.\run-app.ps1 start

# Check status
.\run-app.ps1 status

# Stop services
.\run-app.ps1 stop
```

### Option 3: Manual Start (Individual Services)
```bash
# Install root dependencies
npm install

# Terminal 1: Start Frontend
cd frontend/web
npm install
npm run dev

# Terminal 2: Start API Gateway
cd backend/api-gateway
npm install
npm run dev

# Terminal 3: Start Auth Service
cd backend/auth-service
npm install
npm run dev

# Terminal 4: Start Notification Service
cd backend/notification-service
npm install
npm run dev
```

## Application URLs
Once started, access your application at:
- **Frontend**: http://localhost:3000
- **API Gateway**: http://localhost:3001
- **Auth Service**: http://localhost:4001
- **Notification Service**: http://localhost:4002

## Troubleshooting

### Common Issues

1. **Docker Not Found Error**
   - Solution: Use `.\run-app.bat` instead of `.\run-app.ps1`
   - Or install Docker Desktop if you need database functionality

2. **Port Already in Use**
   - Solution: Run `.\run-app.bat stop` to stop existing services
   - Or manually kill processes using Task Manager

3. **npm install fails**
   - Solution: Delete `node_modules` folders and try again
   - Check if you have the correct Node.js version

4. **Service won't start**
   - Check if the service directory exists
   - Verify `package.json` has the correct scripts
   - Look for error messages in the console

### Database Setup (Optional)
If you need database functionality:
1. Install Docker Desktop
2. Run `.\run-app.ps1 start` to start with PostgreSQL and Redis
3. Or set up local PostgreSQL and Redis manually

## Next Steps
1. Open http://localhost:3000 in your browser
2. Explore the application features
3. Check the API documentation at http://localhost:3001/api-docs (if available)

## Support
If you encounter issues:
1. Check the console output for error messages
2. Verify all prerequisites are installed
3. Try the manual start method to isolate issues
4. Check individual service logs for detailed errors 