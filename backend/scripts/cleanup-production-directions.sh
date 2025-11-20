#!/bin/bash
# Script to clean up invalid direction data in production database
# Run via: fly ssh console --app tide-raider-backend -C "cd /app && npx ts-node scripts/delete-invalid-directions.ts"

echo "Running cleanup script on production..."
npx ts-node scripts/delete-invalid-directions.ts

