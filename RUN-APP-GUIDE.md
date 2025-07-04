# Renexus Application Launcher Guide

## Overview
The `run-app.ps1` PowerShell script is a comprehensive launcher for the entire Renexus application platform.

## Usage
Basic commands:
- `.\run-app.ps1` - Start all services
- `.\run-app.ps1 stop` - Stop all services  
- `.\run-app.ps1 status` - Check service status
- `.\run-app.ps1 logs` - View live logs
- `.\run-app.ps1 -Help` - Show full help

## Services Managed
- Frontend (Next.js) - Port 3000
- API Gateway (NestJS) - Port 3001  
- Auth Service - Port 4001
- Notification Service - Port 4002
- PostgreSQL Database - Port 5432
- Redis Cache - Port 6379

## Key Features
- Automatic port cleanup
- Dependency installation
- Health checks
- Centralized logging
- Graceful shutdown

Run `.\run-app.ps1 -Help` for complete documentation.
