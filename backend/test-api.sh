#!/bin/bash

# Simple API testing script for backend
# Usage: ./test-api.sh [token]

BASE_URL="http://localhost:3001"
TOKEN=${1:-""}

echo "🧪 Testing Backend API"
echo "===================="
echo ""

# Health check
echo "1. Health Check:"
curl -s "$BASE_URL/health" | jq .
echo ""

# Beaches (public)
echo "2. Get Beaches (public):"
curl -s "$BASE_URL/api/beaches" | jq '.beaches | length' | xargs echo "Found beaches:"
echo ""

# Alerts (requires auth)
if [ -n "$TOKEN" ]; then
  echo "3. Get Alerts (authenticated):"
  curl -s "$BASE_URL/api/alerts" \
    -H "Cookie: next-auth.session-token=$TOKEN" \
    | jq '. | length' | xargs echo "Found alerts:"
  echo ""
else
  echo "3. Get Alerts (skipped - no token provided)"
  echo "   Usage: ./test-api.sh YOUR_SESSION_TOKEN"
  echo ""
fi

echo "✅ Testing complete!"

