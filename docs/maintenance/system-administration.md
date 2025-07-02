# Renexus System Administration Guide

## Overview

This guide provides essential information for system administrators responsible for managing and maintaining the Renexus platform infrastructure. It covers server configurations, user management, security practices, and routine administrative tasks.

## System Architecture

The Renexus platform uses a distributed architecture with the following components:

- **Web Servers**: Node.js application servers running the frontend
- **API Servers**: Express-based REST API services
- **Database Servers**: PostgreSQL database cluster
- **Redis Servers**: In-memory data store for caching and session management
- **Load Balancer**: HAProxy for traffic distribution and failover
- **Monitoring**: Prometheus and Grafana for metrics collection and visualization

## Server Configuration

### Production Environment

| Server Type | Specifications | Quantity | Purpose |
|-------------|----------------|----------|---------|
| Web | 4 CPU, 8GB RAM | 2+ | Serves frontend application |
| API | 8 CPU, 16GB RAM | 2+ | Handles API requests |
| Database (Primary) | 8 CPU, 32GB RAM | 1 | Primary database instance |
| Database (Replica) | 4 CPU, 16GB RAM | 2 | Read replicas |
| Redis | 2 CPU, 8GB RAM | 2 | Cache and session store |
| Monitoring | 4 CPU, 8GB RAM | 1 | Prometheus and Grafana |

### Directory Structure

```
/var/www/renexus/         # Application root
├── current/              # Current application version (symlink)
├── releases/             # Previous releases
├── shared/               # Shared files across deployments
│   ├── logs/             # Application logs
│   ├── uploads/          # User uploads
│   └── .env              # Environment variables
└── config/               # Configuration files
```

## User Management

### System Users

| Username | Purpose | Home Directory | Permissions |
|----------|---------|----------------|-------------|
| renexus-app | Application service account | /home/renexus-app | Application files |
| renexus-db | Database service account | /home/renexus-db | Database files |
| admin | Administrative access | /home/admin | Sudo access |

### User Management Commands

```bash
# Add a new system user
sudo adduser --system --group username

# Grant sudo access
sudo usermod -aG sudo username

# Set user permissions for application directory
sudo chown -R renexus-app:renexus-app /var/www/renexus/current
```

## Security Configuration

### Firewall Rules

| Port | Service | Access |
|------|---------|--------|
| 22 | SSH | Admin IPs only |
| 80 | HTTP | Redirect to HTTPS |
| 443 | HTTPS | Public |
| 5432 | PostgreSQL | Internal network only |
| 6379 | Redis | Internal network only |
| 9090 | Prometheus | Internal network only |
| 3000 | Grafana | Admin IPs only |

### SSL Certificate Management

Certificates are managed using Let's Encrypt with automatic renewal:

```bash
# Manual certificate renewal
sudo certbot renew

# Certificate status
sudo certbot certificates
```

Certificates are stored in:
- `/etc/letsencrypt/live/renexus.io/fullchain.pem`
- `/etc/letsencrypt/live/renexus.io/privkey.pem`

### Security Policies

1. Password Policy:
   - Minimum 12 characters
   - Complexity requirements enforced
   - Maximum age of 90 days

2. Access Control:
   - Role-based access control
   - Principle of least privilege
   - Regular access review

3. Network Security:
   - VPN required for administrative access
   - Internal services not exposed to public internet
   - Regular network scanning

## Service Management

### Node.js Application

```bash
# Start the application
pm2 start ecosystem.config.js --env production

# Restart the application
pm2 restart renexus-api renexus-web

# View logs
pm2 logs

# Monitor application
pm2 monit
```

### Database Management

```bash
# Connect to database
psql -U renexus-db -h localhost -d renexus

# Backup database
pg_dump -U renexus-db -h localhost -d renexus > backup.sql

# Restore database
psql -U renexus-db -h localhost -d renexus < backup.sql

# Check database status
sudo systemctl status postgresql
```

### Redis Management

```bash
# Connect to Redis
redis-cli

# Check Redis status
redis-cli info

# Flush cache
redis-cli flushall

# Monitor Redis
redis-cli monitor
```

## Monitoring and Alerting

### Prometheus Configuration

Prometheus configuration is located at `/etc/prometheus/prometheus.yml`.

```bash
# Validate Prometheus configuration
promtool check config /etc/prometheus/prometheus.yml

# Reload Prometheus configuration
curl -X POST http://localhost:9090/-/reload
```

### Grafana Dashboards

Grafana is accessible at `https://monitoring.renexus.io`.

Important dashboards:
- System Overview (ID: 1): Server metrics
- Application Performance (ID: 2): API performance metrics
- Database Performance (ID: 3): Database health and performance

### Alert Manager

Alert Manager configuration is at `/etc/alertmanager/alertmanager.yml`.

```bash
# Test alerting
amtool alert add alertname="TestAlert" severity="test"

# Silence alerts
amtool silence add --comment="Maintenance window" alertname=HighErrorRate
```

## Backup and Recovery

### Backup Schedule

| Data | Schedule | Retention | Location |
|------|----------|-----------|----------|
| Database | Daily | 30 days | `/var/backups/database` |
| Files | Daily | 30 days | `/var/backups/files` |
| Configuration | Weekly | 90 days | `/var/backups/config` |
| Full system | Monthly | 12 months | S3 bucket `renexus-backups` |

### Manual Backup

```bash
# Database backup
node scripts/backup.js --type=database --output=/path/to/backup.sql

# File backup
node scripts/backup.js --type=files --output=/path/to/files.tar.gz

# Full backup
node scripts/backup.js --type=full
```

### Recovery Procedures

```bash
# Database restore
node scripts/restore.js --type=database --source=/path/to/backup.sql

# File restore
node scripts/restore.js --type=files --source=/path/to/files.tar.gz

# Full restore
node scripts/restore.js --type=full --source=/path/to/backup
```

## Routine Maintenance

### Daily Tasks

- Review system logs
- Check backup completion
- Monitor resource usage

### Weekly Tasks

- Apply security patches
- Review user accounts
- Analyze performance metrics
- Rotate logs

### Monthly Tasks

- Full system backup
- SSL certificate verification
- Security vulnerability scan
- Dependency updates review

## System Updates

### Application Updates

```bash
# Pull latest code
git pull origin main

# Install dependencies
npm ci

# Build application
npm run build

# Apply database migrations
npm run db:migrate

# Restart services
pm2 restart ecosystem.config.js
```

### System Package Updates

```bash
# Update package list
sudo apt update

# Install updates
sudo apt upgrade

# Reboot if needed
sudo reboot
```

## Troubleshooting

### Common Issues

1. **Application not starting**:
   - Check logs: `pm2 logs`
   - Verify environment variables: `cat /var/www/renexus/shared/.env`
   - Check disk space: `df -h`

2. **Database connectivity issues**:
   - Verify database service: `systemctl status postgresql`
   - Check connection pool: `node scripts/db-connections.js --check`
   - Test connection: `psql -U renexus-db -h localhost -d renexus -c "SELECT 1"`

3. **High CPU/Memory usage**:
   - Identify process: `top` or `htop`
   - Check application metrics: Grafana Dashboard ID 1
   - Restart problematic service: `pm2 restart <service-id>`

4. **Slow API responses**:
   - Check database performance: Grafana Dashboard ID 3
   - Review slow queries: `node scripts/db-analyze.js --slow-queries`
   - Check Redis latency: `redis-cli --latency`

### Log Locations

| Log | Location |
|-----|----------|
| Application | `/var/www/renexus/shared/logs` |
| Access | `/var/log/nginx/access.log` |
| Error | `/var/log/nginx/error.log` |
| Database | `/var/log/postgresql/postgresql.log` |
| System | `/var/log/syslog` |

## Disaster Recovery

### Failover Procedure

1. Determine failure type (database/application/server)
2. Execute appropriate failover script:

```bash
# Database failover
node scripts/failover.js --service=database

# Application server failover
node scripts/failover.js --service=application

# Complete system failover
node scripts/failover.js --service=all
```

3. Verify services functionality:

```bash
# Verify API health
curl -s https://api.renexus.io/health | jq

# Verify database health
node scripts/health-check.js --service=database
```

### Recovery Time Objectives

| Component | RTO | RPO |
|-----------|-----|-----|
| Database | 10 minutes | 5 minutes |
| Application | 5 minutes | 0 (stateless) |
| Full system | 30 minutes | 24 hours |

## Reference Information

### Service Ports

| Service | Port | Protocol |
|---------|------|----------|
| Web | 3000 | HTTP |
| API | 3001 | HTTP |
| WebSocket | 3002 | WS |
| Database | 5432 | PostgreSQL |
| Redis | 6379 | Redis |
| Prometheus | 9090 | HTTP |
| Grafana | 3000 | HTTP |

### Important Credentials

All sensitive credentials are stored in the secure credential store. Contact the security team for access.

### Contact Information

| Role | Name | Contact |
|------|------|---------|
| System Administrator | John Smith | john.smith@renexus.io / 555-123-4567 |
| Database Administrator | Maria Johnson | maria.johnson@renexus.io / 555-123-8901 |
| Security Officer | David Lee | david.lee@renexus.io / 555-123-2345 |
| On-Call Support | - | oncall@renexus.io / 555-123-9999 |
