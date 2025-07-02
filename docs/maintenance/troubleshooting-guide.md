# Renexus Troubleshooting Guide

## Common Issues and Solutions

This guide provides solutions to frequently encountered issues in the Renexus platform.

## Authentication Issues

### Users Unable to Login

**Symptoms:**
- Login attempts fail with "Invalid credentials" error
- Password reset emails not received
- Session unexpectedly terminates

**Troubleshooting Steps:**
1. Verify the authentication service is running:
   ```bash
   pm2 status auth-service
   ```

2. Check authentication logs:
   ```bash
   tail -n 100 /var/log/renexus/auth.log | grep "login failed"
   ```

3. Verify JWT service and Redis connectivity:
   ```bash
   node scripts/verify-services.js --service=jwt,redis
   ```

**Common Solutions:**
- Restart authentication service: `pm2 restart auth-service`
- Clear Redis token cache: `node scripts/clear-cache.js --cache=tokens`
- Check for Redis memory issues: `redis-cli info memory`

## API Performance Issues

### Slow API Response Times

**Symptoms:**
- API requests take more than 500ms to respond
- Timeout errors in client applications
- Growing queue of pending requests

**Troubleshooting Steps:**
1. Check system resources:
   ```bash
   node scripts/health-check.js --resources
   ```

2. Analyze slow queries:
   ```bash
   node scripts/db-analyze.js --slow-queries --last=30m
   ```

3. Monitor API latency:
   ```bash
   curl -w "%{time_total}\n" -o /dev/null -s https://api.renexus.io/health
   ```

**Common Solutions:**
- Scale up API instances: `node scripts/scale.js --service=api --count=+1`
- Optimize identified slow queries
- Increase connection pool: Edit `config/environments/production.env` DB_POOL_SIZE
- Enable additional caching: `node scripts/toggle-feature.js --feature=enhanced-caching --state=on`

## Database Issues

### Connection Pool Exhaustion

**Symptoms:**
- "Too many connections" errors in logs
- Intermittent database timeouts
- Growing number of pending queries

**Troubleshooting Steps:**
1. Check active connections:
   ```bash
   node scripts/db-connections.js --active
   ```

2. Identify connection-heavy services:
   ```bash
   node scripts/db-connections.js --by-service
   ```

3. Look for connection leaks:
   ```bash
   node scripts/db-analyze.js --check-leaks
   ```

**Common Solutions:**
- Restart problematic services
- Increase max connections in PostgreSQL: Edit `postgresql.conf` max_connections
- Configure connection timeouts: Edit `config/environments/production.env` DB_CONN_TIMEOUT
- Implement connection pooling: `node scripts/enable-pgbouncer.js`

### Database Replication Lag

**Symptoms:**
- Inconsistent query results
- Outdated data when reading from replicas
- Increasing lag reported in monitoring

**Troubleshooting Steps:**
1. Check replication status:
   ```bash
   node scripts/db-replication-status.js
   ```

2. Analyze write volume:
   ```bash
   node scripts/db-analyze.js --write-volume --last=1h
   ```

3. Check replica server resources:
   ```bash
   node scripts/health-check.js --server=db-replica-01 --resources
   ```

**Common Solutions:**
- Temporarily direct read queries to primary: `node scripts/toggle-feature.js --feature=read-from-primary --state=on`
- Scale up replica resources
- Optimize write-heavy operations
- Rebuild problematic replica: `node scripts/rebuild-replica.js --target=db-replica-01`

## Redis Issues

### Redis Memory Issues

**Symptoms:**
- Out of memory errors in Redis logs
- Slow Redis operations
- Keys unexpectedly disappearing

**Troubleshooting Steps:**
1. Check Redis memory usage:
   ```bash
   redis-cli info memory
   ```

2. Identify large keys:
   ```bash
   node scripts/redis-analyze.js --find-large-keys
   ```

3. Review memory policies:
   ```bash
   redis-cli config get maxmemory-policy
   ```

**Common Solutions:**
- Increase Redis memory: Edit `redis.conf` maxmemory setting
- Adjust eviction policy: `redis-cli config set maxmemory-policy volatile-lru`
- Clear specific caches: `node scripts/clear-cache.js --cache=responses`
- Add Redis instance for specific workloads: `node scripts/add-redis-instance.js --purpose=sessions`

## Frontend Issues

### Client-Side Performance Problems

**Symptoms:**
- Slow page loads
- High client-side CPU usage
- Memory leaks in browser

**Troubleshooting Steps:**
1. Analyze bundle size:
   ```bash
   npm run analyze-bundle
   ```

2. Check for render performance issues:
   ```bash
   npm run lighthouse
   ```

3. Review error tracking for client errors:
   ```bash
   node scripts/error-report.js --client --last=24h
   ```

**Common Solutions:**
- Optimize large bundles: Review and refactor code in identified bundles
- Implement code splitting: Add dynamic imports for heavy components
- Fix memory leaks: Address components not properly unmounting
- Enable additional caching: Update CDN cache policies

## Network Issues

### API Connectivity Problems

**Symptoms:**
- Intermittent connection errors
- Timeout errors between services
- DNS resolution failures

**Troubleshooting Steps:**
1. Check DNS resolution:
   ```bash
   node scripts/network-diagnostics.js --dns
   ```

2. Test network latency:
   ```bash
   node scripts/network-diagnostics.js --latency
   ```

3. Verify firewall rules:
   ```bash
   node scripts/network-diagnostics.js --firewall
   ```

**Common Solutions:**
- Update DNS cache: `service nscd restart`
- Adjust timeout settings: Edit service configuration timeout values
- Verify firewall rules: Check security groups and network ACLs
- Check for network saturation: Review bandwidth usage on interfaces

## Monitoring Issues

### Missing Prometheus Metrics

**Symptoms:**
- Gaps in Grafana dashboards
- Missing data points in alerts
- Prometheus scrape failures

**Troubleshooting Steps:**
1. Check Prometheus target status:
   ```bash
   curl -s http://prometheus:9090/api/v1/targets | jq
   ```

2. Verify metrics endpoint accessibility:
   ```bash
   curl -s http://api-server:3000/metrics | head
   ```

3. Check Prometheus logs:
   ```bash
   tail -n 100 /var/log/prometheus/prometheus.log
   ```

**Common Solutions:**
- Restart exporters: `pm2 restart node-exporter`
- Reload Prometheus configuration: `curl -X POST http://prometheus:9090/-/reload`
- Fix accessibility between Prometheus and targets: Check network paths
- Adjust scrape timeouts: Edit `config/prometheus/prometheus.yml` scrape timeout

## Deployment Issues

### Failed Deployments

**Symptoms:**
- CI/CD pipeline failures
- Incomplete deployments
- Application inconsistencies after deployment

**Troubleshooting Steps:**
1. Check CI/CD logs:
   ```bash
   node scripts/ci-logs.js --last-deployment
   ```

2. Verify deployment state:
   ```bash
   node scripts/deployment-status.js
   ```

3. Check for conflicting processes:
   ```bash
   pm2 list
   ```

**Common Solutions:**
- Roll back to last stable version: `node scripts/rollback.js --to=previous`
- Clear deployment locks: `node scripts/clear-deployment-locks.js`
- Manually complete failed steps: Follow error message instructions
- Restart CI/CD pipeline: Trigger rebuild in GitHub Actions

## Logging Issues

### Missing or Corrupted Logs

**Symptoms:**
- Gaps in log data
- Log files not rotating properly
- Disk space warnings for log partition

**Troubleshooting Steps:**
1. Check logging service status:
   ```bash
   pm2 status log-shipper
   ```

2. Verify log file permissions:
   ```bash
   ls -la /var/log/renexus/
   ```

3. Check disk space:
   ```bash
   df -h /var/log
   ```

**Common Solutions:**
- Restart logging service: `pm2 restart log-shipper`
- Fix permissions: `chmod 644 /var/log/renexus/*.log`
- Rotate logs manually: `node scripts/rotate-logs.js --force`
- Clear old logs: `node scripts/cleanup-logs.js --older-than=30d`

## Security Issues

### Suspicious Login Attempts

**Symptoms:**
- Multiple failed login attempts from unknown IPs
- Unusual access patterns in logs
- Unexpected session activity

**Troubleshooting Steps:**
1. Check authentication logs:
   ```bash
   node scripts/security-scan.js --auth-logs --last=24h
   ```

2. Check for unusual API patterns:
   ```bash
   node scripts/security-scan.js --api-patterns --last=24h
   ```

3. Verify active sessions:
   ```bash
   node scripts/active-sessions.js --all
   ```

**Common Solutions:**
- Temporarily block suspicious IPs: `node scripts/block-ip.js --ip=x.x.x.x --duration=24h`
- Force password reset for affected users: `node scripts/reset-password.js --user=username --force`
- Enable enhanced security monitoring: `node scripts/toggle-feature.js --feature=enhanced-security --state=on`
- Invalidate all active sessions: `node scripts/invalidate-sessions.js --all`

## Escalation Procedures

When standard troubleshooting fails to resolve an issue:

1. **Tier 1 Escalation**:
   - Contact: DevOps Team
   - Response time: 30 minutes
   - Contact method: Slack #devops-emergency

2. **Tier 2 Escalation**:
   - Contact: System Architects
   - Response time: 1 hour
   - Contact method: Call on-call architect

3. **Tier 3 Escalation**:
   - Contact: CTO and Engineering Leadership
   - Response time: 2 hours
   - Contact method: Emergency contact list

## Diagnostic Tools Reference

| Tool | Purpose | Usage |
|------|---------|-------|
| `scripts/health-check.js` | System health verification | `node scripts/health-check.js [options]` |
| `scripts/db-analyze.js` | Database performance analysis | `node scripts/db-analyze.js --slow-queries` |
| `scripts/network-diagnostics.js` | Network connectivity testing | `node scripts/network-diagnostics.js --ping` |
| `scripts/log-search.js` | Centralized log searching | `node scripts/log-search.js --term="error" --service=api` |
| `scripts/clear-cache.js` | Cache management | `node scripts/clear-cache.js --cache=responses` |

## Emergency Contacts

| Role | Name | Contact | Hours |
|------|------|---------|-------|
| DevOps Lead | Alex Chen | alex.chen@renexus.io / 555-123-4567 | 9am-5pm EST |
| On-call Engineer | Rotating | oncall@renexus.io / 555-123-8900 | 24/7 |
| Database Admin | Sarah Johnson | sarah.johnson@renexus.io / 555-123-2345 | 9am-5pm EST |
| Security Lead | Miguel Rodriguez | miguel.rodriguez@renexus.io / 555-123-6789 | 9am-5pm EST |

## Error Handling and Diagnostics

### Common Error Messages

#### Database Connection Errors

**Error:** `ECONNREFUSED - Connection refused by server`

**Cause:** Database server is down or unreachable

**Solution:**
1. Verify database server status: `systemctl status postgresql`
2. Check network connectivity: `ping db.renexus.io`
3. Restart database if needed: `systemctl restart postgresql`

#### Authentication Errors

**Error:** `JWT verification failed`

**Cause:** Invalid token, expired token, or wrong secret key

**Solution:**
1. Check JWT secret configuration across services
2. Verify token expiration settings
3. Clear token cache: `node scripts/clear-cache.js --cache=tokens`

#### API Request Errors

**Error:** `429 - Too Many Requests`

**Cause:** Rate limiting thresholds exceeded

**Solution:**
1. Adjust rate limits: `node scripts/config-update.js --service=api --setting=rateLimit --value=100`
2. Identify source of excessive requests in logs
3. Implement request batching in client applications

### Error Log Analysis

**Steps to analyze error logs:**

1. Locate relevant error logs:
   ```bash
   find /var/log/renexus -name "*.log" -mtime -1 -exec grep -l "ERROR" {} \;
   ```

2. Extract error patterns:
   ```bash
   grep -i error /var/log/renexus/api.log | cut -d" " -f5- | sort | uniq -c | sort -nr
   ```

3. Correlate errors across services:
   ```bash
   node scripts/log-analyzer.js --pattern="error" --timeframe=1h --correlation
   ```

## System Recovery Procedures

### Database Recovery

**Symptoms:**
- Database corruption errors
- Missing or inconsistent data
- Database service fails to start

**Recovery Steps:**
1. Stop affected database service:
   ```bash
   systemctl stop postgresql
   ```

2. Identify the appropriate backup to restore:
   ```bash
   ls -la /var/backups/database/ | sort -k6,7
   ```

3. Restore from the most recent valid backup:
   ```bash
   node scripts/restore.js --type=database --source=/var/backups/database/backup_YYYY-MM-DD.sql
   ```

4. Verify data integrity after restore:
   ```bash
   node scripts/verify-data.js --thorough
   ```

### Application Recovery

**Symptoms:**
- Application crashes repeatedly
- Corrupt application state
- Deployment failure

**Recovery Steps:**
1. Roll back to the last known good version:
   ```bash
   node scripts/rollback.js --version=X.Y.Z
   ```

2. Clear application caches:
   ```bash
   node scripts/clear-cache.js --all
   ```

3. Restart all services:
   ```bash
   pm2 restart all
   ```

4. Verify application health:
   ```bash
   node scripts/health-check.js --services=all
   ```

### Full System Recovery

**Symptoms:**
- Multiple system failures
- Server hardware failure
- Catastrophic data center issue

**Recovery Steps:**
1. Activate the disaster recovery plan:
   ```bash
   node scripts/dr-activate.js --region=backup
   ```

2. Verify DNS failover:
   ```bash
   dig +short renexus.io
   ```

3. Restore data from offsite backups:
   ```bash
   node scripts/restore-full.js --source=s3://renexus-backups/full/latest
   ```

4. Verify full system functionality:
   ```bash
   node scripts/verify-system.js --complete
   ```

5. Notify stakeholders of recovery status:
   ```bash
   node scripts/notify.js --event="disaster-recovery-complete"
   ```
