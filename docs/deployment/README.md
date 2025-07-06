# Renexus Deployment Guide

## Overview

This guide covers the deployment process for Renexus in production environments. We use Docker for containerization and GitHub Actions for CI/CD.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Docker Deployment](#docker-deployment)
4. [CI/CD Pipeline](#cicd-pipeline)
5. [Monitoring](#monitoring)
6. [Maintenance](#maintenance)

## Prerequisites

- Docker >= 20.10
- Docker Compose >= 2.0
- Node.js >= 18.0.0 (for build process)
- PostgreSQL >= 14
- Redis >= 6.2
- NGINX >= 1.20

## Environment Setup

### 1. Clone Repository

```bash
git clone https://github.com/your-org/renexus.git
cd renexus
```

### 2. Configure Environment Variables

```bash
# Copy environment templates
cp .env.production.example .env.production
cp .env.db.example .env.db

# Edit environment files with production values
nano .env.production
nano .env.db
```

Required environment variables:
```env
# .env.production
NODE_ENV=production
DATABASE_URL=postgresql://user:password@db:5432/renexus
REDIS_URL=redis://redis:6379
JWT_SECRET=your-secure-jwt-secret
API_URL=https://api.your-domain.com
CORS_ORIGIN=https://your-domain.com

# .env.db
POSTGRES_USER=your-db-user
POSTGRES_PASSWORD=your-secure-password
POSTGRES_DB=renexus
```

## Docker Deployment

### 1. Build Docker Images

```bash
# Build all services
docker-compose -f docker-compose.prod.yml build

# Build specific service
docker-compose -f docker-compose.prod.yml build api
docker-compose -f docker-compose.prod.yml build web
```

### 2. Start Services

```bash
# Start all services
docker-compose -f docker-compose.prod.yml up -d

# Check service status
docker-compose -f docker-compose.prod.yml ps
```

### 3. Database Migration

```bash
# Run database migrations
docker-compose -f docker-compose.prod.yml exec api npm run migrate

# Seed initial data (if needed)
docker-compose -f docker-compose.prod.yml exec api npm run seed:prod
```

## CI/CD Pipeline

### GitHub Actions Workflow

The CI/CD pipeline is configured in `.github/workflows/deploy.yml`:

1. On push to main:
   - Run tests
   - Build Docker images
   - Push to container registry
   - Deploy to production

2. On pull request:
   - Run tests
   - Build Docker images
   - Deploy to staging

### Manual Deployment

```bash
# Pull latest changes
git pull origin main

# Build and deploy
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d
```

## Monitoring

### 1. Logging

Logs are collected using ELK Stack:
```bash
# View service logs
docker-compose -f docker-compose.prod.yml logs -f [service]

# Access Kibana
open http://localhost:5601
```

### 2. Metrics

Metrics are collected using Prometheus and Grafana:
```bash
# Access Grafana
open http://localhost:3000

# Access Prometheus
open http://localhost:9090
```

### 3. Alerts

Configure alerts in Grafana for:
- High CPU/Memory usage
- High response times
- Error rate spikes
- Disk space usage

## Maintenance

### 1. Backup

```bash
# Backup database
docker-compose -f docker-compose.prod.yml exec db pg_dump -U user renexus > backup.sql

# Backup Redis data
docker-compose -f docker-compose.prod.yml exec redis redis-cli SAVE
```

### 2. Updates

```bash
# Update dependencies
npm update

# Update Docker images
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d
```

### 3. Rollback

```bash
# Rollback to previous version
git checkout v1.x.x
docker-compose -f docker-compose.prod.yml up -d

# Rollback database
docker-compose -f docker-compose.prod.yml exec api npm run migrate:rollback
```

## Troubleshooting

### Common Issues

1. Database Connection Issues
```bash
# Check database logs
docker-compose -f docker-compose.prod.yml logs db

# Verify connection
docker-compose -f docker-compose.prod.yml exec api npm run db:check
```

2. Redis Connection Issues
```bash
# Check Redis logs
docker-compose -f docker-compose.prod.yml logs redis

# Verify connection
docker-compose -f docker-compose.prod.yml exec api npm run redis:check
```

3. API Issues
```bash
# Check API logs
docker-compose -f docker-compose.prod.yml logs api

# Run health check
curl https://api.your-domain.com/health
```

### Performance Issues

1. Check resource usage:
```bash
docker stats
```

2. Monitor slow queries:
```bash
docker-compose -f docker-compose.prod.yml exec db psql -U user -d renexus -c "SELECT * FROM pg_stat_activity WHERE state = 'active';"
```

3. Check cache hit ratio:
```bash
docker-compose -f docker-compose.prod.yml exec redis redis-cli INFO | grep hit_rate
```

## Security

1. SSL/TLS Configuration
2. Firewall Rules
3. Rate Limiting
4. Regular Security Updates
5. Access Control

## Need Help?

- Check our [FAQ](../FAQ.md)
- Contact DevOps team
- Open an issue on GitHub 