# Renexus Deployment Guide

This guide provides instructions for deploying the Renexus application to production environments.

## Prerequisites

- Docker and Docker Compose
- Node.js 18.x or higher
- PostgreSQL 14.x or higher
- Redis 6.x or higher
- Nginx
- SSL certificates
- Domain name configured with DNS

## Deployment Options

Renexus supports the following deployment options:

1. **Docker Compose Deployment** (Recommended)
2. **Kubernetes Deployment**
3. **Manual Deployment**

## Docker Compose Deployment

### Step 1: Clone the Repository

```bash
git clone https://github.com/renexus/renexus.git
cd renexus
```

### Step 2: Configure Environment Variables

Create a `.env.production` file in the root directory:

```
# Database
DATABASE_URL=postgresql://postgres:root@db:5432/renexus
DATABASE_USER=postgres
DATABASE_PASSWORD=root
DATABASE_NAME=renexus

# Redis
REDIS_URL=redis://redis:6379

# JWT
JWT_SECRET=your_secure_jwt_secret
JWT_EXPIRATION=3600

# API
API_PORT=3000
API_URL=https://api.yourdomain.com

# Web Client
CLIENT_URL=https://yourdomain.com

# Monitoring
PROMETHEUS_PORT=9090
GRAFANA_PORT=3001
GRAFANA_ADMIN_USER=admin
GRAFANA_ADMIN_PASSWORD=your_secure_password
```

### Step 3: Run the Deployment Script

```bash
chmod +x deployment/deploy-production.sh
sudo ./deployment/deploy-production.sh
```

### Step 4: Verify Deployment

```bash
chmod +x deployment/post-deploy-verification.sh
./deployment/post-deploy-verification.sh
```

## Kubernetes Deployment

For Kubernetes deployment, we provide Helm charts in the `infrastructure/kubernetes` directory.

### Step 1: Configure Kubernetes

Ensure you have a Kubernetes cluster and `kubectl` configured.

### Step 2: Install Helm

```bash
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
```

### Step 3: Deploy with Helm

```bash
cd infrastructure/kubernetes
helm install renexus ./renexus-chart --values ./values-production.yaml
```

### Step 4: Verify Deployment

```bash
kubectl get pods
kubectl get services
```

## Manual Deployment

For environments where Docker or Kubernetes is not available, follow these steps:

### Step 1: Set Up the Database

```bash
psql -U postgres -c "CREATE DATABASE renexus;"
psql -U postgres -d renexus -f schema.sql
```

### Step 2: Set Up Redis

Install and configure Redis according to your operating system's instructions.

### Step 3: Build and Deploy the API

```bash
cd apps/api
npm install
npm run build
npm run start:prod
```

### Step 4: Build and Deploy the Web Client

```bash
cd apps/web-client
npm install
npm run build
```

### Step 5: Configure Nginx

Copy the Nginx configuration:

```bash
sudo cp deployment/nginx/renexus.conf /etc/nginx/sites-available/
sudo ln -s /etc/nginx/sites-available/renexus.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## Backup and Restore

### Automated Backups

Automated backups are configured to run daily at 2:00 AM. Backup files are stored in the `/backup` directory.

### Manual Backup

```bash
docker exec renexus-db pg_dump -U postgres -d renexus > backup/renexus-manual-$(date +%Y%m%d).sql
```

### Restore from Backup

```bash
docker exec -i renexus-db psql -U postgres -d renexus < backup/renexus-backup-file.sql
```

## Monitoring

Renexus includes Prometheus and Grafana for monitoring:

- Prometheus: http://localhost:9090
- Grafana: http://localhost:3001

Default Grafana credentials:
- Username: admin
- Password: (specified in your .env.production file)

## Troubleshooting

### Common Issues

- **Database Connection Errors**: Check PostgreSQL is running and credentials are correct
- **Redis Connection Errors**: Verify Redis is running and accessible
- **API Not Responding**: Check logs with `docker logs renexus-api`
- **Web Client Not Loading**: Check Nginx configuration and logs

### Getting Help

For additional support:
- Review logs: `docker-compose logs`
- Check the GitHub repository for known issues
- Contact support at devops@renexus.example.com
