#!/bin/sh

# Health check script for Renexus API
# This script checks if the API is responding correctly

API_URL="http://localhost:3000/health"
TIMEOUT=5

# Try to get a response from the health endpoint
response=$(curl -s -o /dev/null -w "%{http_code}" --max-time $TIMEOUT $API_URL)

# Check if the response is 200 OK
if [ "$response" = "200" ]; then
  echo "API is healthy"
  exit 0
else
  echo "API health check failed with status: $response"
  exit 1
fi
