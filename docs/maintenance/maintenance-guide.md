# Renexus Maintenance Guide

## System Architecture Overview

This maintenance guide provides comprehensive instructions for maintaining, troubleshooting, and upgrading the Renexus platform. It is intended for system administrators and DevOps personnel.

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           Client Devices                                │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                            CDN / Edge Cache                             │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                             Load Balancer                               │
└─────┬─────────────────────────────┬──────────────────────────────┬──────┘
      │                             │                              │
      ▼                             ▼                              ▼
┌─────────────┐             ┌──────────────┐              ┌──────────────┐
│   Web       │             │     API      │              │  WebSocket   │
│   Servers   │             │   Servers    │              │   Servers    │
└─────┬───────┘             └──────┬───────┘              └──────┬───────┘
      │                            │                             │
      │                            ▼                             │
      │               ┌──────────────────────────┐               │
      │               │       Redis Cache        │               │
      │               └──────────┬───────────────┘               │
      │                          │                               │
      └──────────────────────────┼───────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                            Database Cluster                             │
│                                                                         │
│  ┌────────────┐         ┌────────────┐         ┌────────────┐           │
│  │   Primary   │◄───────│  Standby   │◄───────│  Standby   │           │
│  │             │        │            │        │            │           │
│  └────────────┘         └────────────┘        └────────────┘           │
└─────────────────────────────────────────────────────────────────────────┘
           │                      │                     │
           ▼                      ▼                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          Monitoring System                              │
│                                                                         │
│  ┌────────────┐         ┌────────────┐         ┌────────────┐           │
│  │ Prometheus │         │  Grafana   │         │ AlertManager│           │
│  └────────────┘         └────────────┘         └────────────┘           │
└─────────────────────────────────────────────────────────────────────────┘
```

## Regular Maintenance Tasks

### Daily Tasks

1. **System Health Check**
   - Review Grafana dashboards for critical metrics
   - Check error logs for unexpected entries
   - Verify all services are running properly
   - Command: `npm run health-check`

2. **Backup Verification**
   - Ensure daily backups completed successfully
   - Verify backup integrity
   - Command: `node scripts/verify-backups.js`

3. **Alert Review**
   - Review any triggered alerts from the past 24 hours
   - Command: `node scripts/alert-report.js --last=24h`

### Weekly Tasks

1. **Performance Analysis**
   - Review performance metrics for the past week
   - Identify potential bottlenecks
   - Command: `npm run performance-report -- --period=week`

2. **Security Review**
   - Check for failed login attempts
   - Review access logs for suspicious activity
   - Command: `node scripts/security-audit.js`

3. **Storage Management**
   - Clean up temporary files
   - Optimize database storage
   - Command: `npm run cleanup-storage`

### Monthly Tasks

1. **Full System Backup**
   - Perform complete backup of all data and configurations
   - Command: `node scripts/full-backup.js`

2. **Dependency Updates**
   - Review and apply non-breaking package updates
   - Command: `npm run update-check`

3. **Long-term Performance Analysis**
   - Review monthly performance trends
   - Plan capacity adjustments as needed
   - Command: `npm run performance-report -- --period=month`

### Quarterly Tasks

1. **Security Audit**
   - Conduct comprehensive security review
   - Update security patches
   - Command: `npm run security-audit`

2. **Disaster Recovery Drill**
   - Test recovery procedures
   - Verify backup restoration process
   - Command: `npm run dr-drill`

3. **System Architecture Review**
   - Evaluate current architecture against requirements
   - Plan infrastructure upgrades as needed

## Database Maintenance

### Backup Procedures

#### Automated Backups

Automated backups run daily at 01:00 UTC using the `scripts/backup.js` script.

Configuration:
- Full database dumps are created daily
- Transaction logs are backed up hourly
- Backups are stored in:
  - Primary location: `/var/backups/renexus/`
  - Secondary location: AWS S3 bucket `renexus-backups-{environment}`

Manual backup command:
```bash
node scripts/backup.js --type=full
```

#### Backup Rotation Policy

- Daily backups: Retained for 7 days
- Weekly backups: Retained for 4 weeks
- Monthly backups: Retained for 12 months
- Yearly backups: Retained indefinitely

### Database Optimization

Run the following maintenance tasks monthly:

1. **Index Optimization**
   ```bash
   node scripts/db-maintenance.js --task=reindex
   ```

2. **Table Vacuuming**
   ```bash
   node scripts/db-maintenance.js --task=vacuum
   ```

3. **Statistics Update**
   ```bash
   node scripts/db-maintenance.js --task=analyze
   ```

### Database Scaling

When database performance degrades:

1. Vertical scaling steps:
   - Increase instance size in `config/environments/{env}.env`
   - Apply changes with `npm run db:scale`

2. Horizontal scaling steps:
   - Add read replicas in HAProxy configuration
   - Update connection pool settings

## Application Servers

### Deployment Process

Detailed deployment workflow:

1. Build preparation
   ```bash
   node scripts/deploy.js --prepare
   ```

2. Progressive deployment
   ```bash
   node scripts/deploy.js --deploy --strategy=progressive
   ```

3. Verification
   ```bash
   node scripts/post-deploy-verification.sh
   ```

4. Rollback (if needed)
   ```bash
   node scripts/deploy.js --rollback --version={previous-version}
   ```

### Scaling Application Servers

To scale horizontally:

1. Add new server to the pool:
   ```bash
   node scripts/scale.js --service=api --action=add --count=1
   ```

2. Remove server from pool:
   ```bash
   node scripts/scale.js --service=api --action=remove --id=server-12
   ```

3. Update HAProxy configuration:
   ```bash
   node scripts/update-lb-config.js
   ```

### Log Management

Log files are stored in `/var/log/renexus/` with the following structure:

- `api-{YYYY-MM-DD}.log` - API server logs
- `client-{YYYY-MM-DD}.log` - Web client logs
- `db-{YYYY-MM-DD}.log` - Database-related logs
- `system-{YYYY-MM-DD}.log` - System-level logs
- `security-{YYYY-MM-DD}.log` - Security-related events

Log rotation occurs daily with 14 days retention.

Command to search logs:
```bash
node scripts/log-search.js --service=api --level=error --date=2025-06-25
```

## Monitoring System

### Prometheus Configuration

The Prometheus configuration is located at `config/prometheus/prometheus.yml`.

Key metrics to monitor:
- API response times
- Error rates
- Database connection pool utilization
- Memory usage
- CPU load
- Disk space

To reload configuration:
```bash
curl -X POST http://localhost:9090/-/reload
```

### Grafana Dashboards

Available dashboards:
1. System Overview - General health metrics
2. API Performance - Detailed API metrics
3. Database Performance - Database-specific metrics
4. Error Analysis - Error trends and details

To update dashboards:
```bash
node scripts/update-grafana-dashboards.js
```

### Alerting Rules

Alert rules are defined in `config/prometheus/alert_rules.yml`.

Key alerts configured:
- High API error rate (> 5% over 5 minutes)
- Slow API response time (> 500ms p95 over 5 minutes)
- Low disk space (< 10% free)
- High CPU usage (> 85% for 10 minutes)
- Database connection saturation (> 80% pool utilization)

To test alerting:
```bash
node scripts/test-alerts.js --alert=high-error-rate
```

## Troubleshooting

### Common Issues

#### High API Latency

1. Check system resources:
   ```bash
   node scripts/system-check.js --focus=resources
   ```

2. Analyze database query performance:
   ```bash
   node scripts/db-analyze.js --slow-queries
   ```

3. Check for network issues:
   ```bash
   node scripts/network-diagnostics.js
   ```

4. Possible solutions:
   - Scale up API servers
   - Optimize slow database queries
   - Increase caching

#### Database Connection Issues

1. Check connection pool status:
   ```bash
   node scripts/db-connection-status.js
   ```

2. Verify database health:
   ```bash
   node scripts/db-health-check.js
   ```

3. Possible solutions:
   - Restart connection pool
   - Check for connection leaks
   - Increase maximum connections

#### High Memory Usage

1. Check memory usage patterns:
   ```bash
   node scripts/memory-analysis.js
   ```

2. Identify memory-intensive requests:
   ```bash
   node scripts/request-profiling.js --resource=memory --top=10
   ```

3. Possible solutions:
   - Restart leaking services
   - Optimize memory-intensive operations
   - Scale up resources

### Failover Procedures

#### Database Failover

Automatic failover is configured, but can be triggered manually:

```bash
node scripts/failover.js --service=database --mode=manual
```

To verify failover success:
```bash
node scripts/verify-failover.js
```

#### Application Server Failover

1. Remove unhealthy server:
   ```bash
   node scripts/haproxy-manage.js --action=disable --server=app-server-03
   ```

2. Provision replacement:
   ```bash
   node scripts/scale.js --service=api --action=replace --id=app-server-03
   ```

### Emergency Procedures

#### Complete Outage Recovery

1. Restore from latest backup:
   ```bash
   node scripts/restore.js --latest
   ```

2. Verify data integrity:
   ```bash
   node scripts/verify-data.js
   ```

3. Bring up services in correct order:
   ```bash
   node scripts/service-orchestrator.js --action=start --sequence=emergency
   ```

#### Security Incident Response

1. Isolate affected systems:
   ```bash
   node scripts/security-isolate.js --service=api
   ```

2. Analyze intrusion:
   ```bash
   node scripts/security-analysis.js --last=24h
   ```

3. Restore from clean backup:
   ```bash
   node scripts/restore.js --clean-snapshot
   ```

## Upgrade Procedures

### Minor Version Upgrades

For non-breaking changes:

1. Backup current system:
   ```bash
   node scripts/backup.js --type=pre-upgrade
   ```

2. Apply upgrade:
   ```bash
   node scripts/upgrade.js --type=minor
   ```

3. Verify system health:
   ```bash
   node scripts/post-upgrade-verification.js
   ```

### Major Version Upgrades

For potentially breaking changes:

1. Backup current system:
   ```bash
   node scripts/backup.js --type=full
   ```

2. Create staging environment:
   ```bash
   node scripts/create-staging.js --from=production
   ```

3. Apply upgrade in staging:
   ```bash
   node scripts/upgrade.js --type=major --env=staging
   ```

4. Run test suite:
   ```bash
   npm run test:upgrade-validation
   ```

5. Schedule production upgrade:
   ```bash
   node scripts/schedule-upgrade.js --date="YYYY-MM-DD HH:MM:SS"
   ```

### Configuration Updates

To update application configuration:

1. Edit appropriate file in `config/environments/`
2. Validate configuration:
   ```bash
   npm run validate-config -- --env=production
   ```
3. Apply changes:
   ```bash
   npm run update-config -- --env=production
   ```

## Appendix

### Important File Locations

| File Type | Location |
|-----------|----------|
| Application Source | `/var/www/renexus/current` |
| Configuration | `/var/www/renexus/config` |
| Logs | `/var/log/renexus/` |
| Backups | `/var/backups/renexus/` |
| SSL Certificates | `/etc/ssl/renexus/` |

### Environment Variables

Core environment variables used across the system:

| Variable | Purpose | Example Value |
|----------|---------|--------------|
| NODE_ENV | Environment name | `production` |
| DB_CONNECTION_STRING | Database connection | `postgresql://user:pass@db:5432/renexus` |
| REDIS_URL | Redis connection | `redis://redis:6379` |
| LOG_LEVEL | Logging verbosity | `info` |
| API_KEY_SECRET | API key encryption | `****` |
| JWT_SECRET | Authentication secret | `****` |

### Contact Information

| Role | Name | Email | Phone |
|------|------|-------|-------|
| Lead DevOps | Alex Chen | alex.chen@renexus.io | +1-555-123-4567 |
| Database Admin | Sarah Johnson | sarah.johnson@renexus.io | +1-555-123-8901 |
| Security Lead | Miguel Rodriguez | miguel.rodriguez@renexus.io | +1-555-123-2345 |
| 24/7 Support | On-call Team | oncall@renexus.io | +1-555-123-9999 |

### Vendor Documentation

| System | Documentation URL |
|--------|-------------------|
| PostgreSQL | https://www.postgresql.org/docs/current/ |
| Redis | https://redis.io/documentation |
| HAProxy | https://www.haproxy.org/doc/ |
| Node.js | https://nodejs.org/en/docs/ |
| Prometheus | https://prometheus.io/docs/ |
