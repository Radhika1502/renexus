#!/bin/bash
set -e

# Post-deployment verification script for Renexus
echo "Starting post-deployment verification..."

# Check API health
echo "Checking API health..."
API_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health)
if [ "$API_HEALTH" = "200" ]; then
  echo "✅ API health check passed"
else
  echo "❌ API health check failed with status $API_HEALTH"
  exit 1
fi

# Check web client
echo "Checking web client..."
WEB_CLIENT=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:80)
if [ "$WEB_CLIENT" = "200" ]; then
  echo "✅ Web client check passed"
else
  echo "❌ Web client check failed with status $WEB_CLIENT"
  exit 1
fi

# Check database connection
echo "Checking database connection..."
DB_CHECK=$(docker exec renexus-db pg_isready -U postgres -d renexus)
if [ $? -eq 0 ]; then
  echo "✅ Database connection check passed"
else
  echo "❌ Database connection check failed"
  exit 1
fi

# Check Redis
echo "Checking Redis connection..."
REDIS_CHECK=$(docker exec renexus-redis redis-cli ping)
if [ "$REDIS_CHECK" = "PONG" ]; then
  echo "✅ Redis connection check passed"
else
  echo "❌ Redis connection check failed"
  exit 1
fi

# Check Prometheus
echo "Checking Prometheus..."
PROMETHEUS_CHECK=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:9090/-/healthy)
if [ "$PROMETHEUS_CHECK" = "200" ]; then
  echo "✅ Prometheus check passed"
else
  echo "❌ Prometheus check failed with status $PROMETHEUS_CHECK"
  exit 1
fi

# Check Grafana
echo "Checking Grafana..."
GRAFANA_CHECK=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/health)
if [ "$GRAFANA_CHECK" = "200" ]; then
  echo "✅ Grafana check passed"
else
  echo "❌ Grafana check failed with status $GRAFANA_CHECK"
  exit 1
fi

# All checks passed
echo "✅ All services are running correctly!"
echo "Renexus is successfully deployed to production."
