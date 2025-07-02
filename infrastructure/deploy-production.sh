#!/bin/bash
set -e

# Production deployment script for Renexus
echo "Starting Renexus production deployment..."

# Check if running with proper permissions
if [ "$(id -u)" != "0" ]; then
   echo "This script must be run as root" 1>&2
   exit 1
fi

# Set environment variables
export NODE_ENV=production
export DEPLOYMENT_ENV=production

# Pull latest changes
echo "Pulling latest changes from main branch..."
git checkout main
git pull origin main

# Install dependencies
echo "Installing dependencies..."
npm ci

# Build all applications
echo "Building applications..."
npm run build:api
npm run build:web

# Run database migrations
echo "Running database migrations..."
npm run migrate:deploy

# Build and start Docker containers
echo "Building and starting Docker containers..."
npm run docker:build
npm run docker:up

# Verify deployment
echo "Verifying deployment..."
./deployment/health-check.sh

# Set up backup schedule
echo "Setting up automated backups..."
(crontab -l 2>/dev/null; echo "0 2 * * * /usr/bin/docker exec renexus-db pg_dump -U postgres -d renexus > /backup/renexus-$(date +\%Y\%m\%d).sql") | crontab -

echo "Deployment completed successfully!"
echo "Run './deployment/post-deploy-verification.sh' to verify all services are running correctly."
