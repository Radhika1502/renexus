# Renexus Maintenance Guide

This guide provides instructions for maintaining the Renexus application in production.

## Routine Maintenance Tasks

### Daily Tasks

- **Monitor System Health**
  - Check Grafana dashboards for anomalies
  - Review error logs
  - Verify all services are running

- **Review Backups**
  - Confirm daily database backups completed successfully
  - Verify backup integrity periodically

### Weekly Tasks

- **Update Dependencies**
  - Review security advisories
  - Apply critical security patches
  - Test updates in staging before production

- **Performance Review**
  - Analyze performance metrics
  - Identify potential bottlenecks
  - Optimize as needed

### Monthly Tasks

- **Security Audit**
  - Run automated security scans
  - Review access logs for suspicious activity
  - Verify user permissions

- **Database Maintenance**
  - Run database vacuum and analyze
  - Check for index bloat
  - Optimize slow queries

## Monitoring System

### Key Metrics to Monitor

- **System Metrics**
  - CPU usage (alert threshold: >80% for 5 minutes)
  - Memory usage (alert threshold: >85% for 5 minutes)
  - Disk usage (alert threshold: >85%)
  - Network traffic

- **Application Metrics**
  - API response time (alert threshold: p95 >500ms)
  - Error rate (alert threshold: >5%)
  - Request rate
  - Active users

- **Database Metrics**
  - Connection pool usage (alert threshold: >80%)
  - Query performance (alert threshold: queries taking >1s)
  - Transaction rate
  - Lock contention

- **Redis Metrics**
  - Memory usage (alert threshold: >80%)
  - Connection count (alert threshold: >100)
  - Hit/miss ratio
  - Eviction rate

### Alerting Configuration

Alert rules are defined in `deployment/prometheus/alert-rules.yml`. Alerts are sent via:

- Email notifications
- Slack channel (#renexus-alerts)
- PagerDuty for critical alerts

## Backup and Recovery

### Backup Strategy

- **Database**: Daily full backups at 2:00 AM
- **File Storage**: Daily incremental backups
- **Configuration**: Version-controlled in Git

### Backup Locations

- Primary backups: `/backup` directory on the backup server
- Secondary backups: AWS S3 bucket (renexus-backups)

### Recovery Procedures

#### Database Recovery

1. Stop the application services:
   ```bash
   docker-compose -f deployment/docker-compose.prod.yml stop api web-client
   ```

2. Restore the database:
   ```bash
   docker exec -i renexus-db psql -U postgres -d renexus < /backup/renexus-YYYYMMDD.sql
   ```

3. Restart the application services:
   ```bash
   docker-compose -f deployment/docker-compose.prod.yml up -d api web-client
   ```

#### Complete System Recovery

1. Set up a new server with Docker and Docker Compose
2. Clone the repository
3. Configure environment variables
4. Restore the database backup
5. Run the deployment script:
   ```bash
   ./deployment/deploy-production.sh
   ```

## Scaling Procedures

### Horizontal Scaling

To add more API instances:

1. Update the `docker-compose.prod.yml` file:
   ```yaml
   api:
     deploy:
       replicas: 3  # Increase as needed
   ```

2. Apply the changes:
   ```bash
   docker-compose -f deployment/docker-compose.prod.yml up -d
   ```

### Vertical Scaling

To increase resources for a service:

1. Update the `docker-compose.prod.yml` file:
   ```yaml
   api:
     deploy:
       resources:
         limits:
           cpus: '2'
           memory: 2G
   ```

2. Apply the changes:
   ```bash
   docker-compose -f deployment/docker-compose.prod.yml up -d
   ```

## Troubleshooting Common Issues

### API Service Down

1. Check the logs:
   ```bash
   docker logs renexus-api
   ```

2. Verify database connection:
   ```bash
   docker exec renexus-db pg_isready -U postgres -d renexus
   ```

3. Restart the service:
   ```bash
   docker-compose -f deployment/docker-compose.prod.yml restart api
   ```

### Database Performance Issues

1. Check for long-running queries:
   ```bash
   docker exec renexus-db psql -U postgres -d renexus -c "SELECT pid, now() - pg_stat_activity.query_start AS duration, query FROM pg_stat_activity WHERE state = 'active' ORDER BY duration DESC;"
   ```

2. Optimize indexes:
   ```bash
   docker exec renexus-db psql -U postgres -d renexus -c "VACUUM ANALYZE;"
   ```

### Redis Connection Issues

1. Check Redis status:
   ```bash
   docker exec renexus-redis redis-cli ping
   ```

2. Clear Redis cache if necessary:
   ```bash
   docker exec renexus-redis redis-cli FLUSHDB
   ```

## Updating the Application

### Minor Updates

1. Pull the latest changes:
   ```bash
   git pull origin main
   ```

2. Build and restart the services:
   ```bash
   npm run docker:build
   npm run docker:up
   ```

### Major Updates

1. Create a backup:
   ```bash
   ./deployment/backup.sh
   ```

2. Pull the latest changes:
   ```bash
   git pull origin main
   ```

3. Run database migrations:
   ```bash
   npm run migrate:deploy
   ```

4. Build and restart the services:
   ```bash
   npm run docker:build
   npm run docker:up
   ```

5. Verify the update:
   ```bash
   ./deployment/post-deploy-verification.sh
   ```

## Contact Information

- **DevOps Team**: devops@renexus.example.com
- **Database Administrator**: dba@renexus.example.com
- **Security Team**: security@renexus.example.com
- **Emergency Support**: +1-555-123-4567
