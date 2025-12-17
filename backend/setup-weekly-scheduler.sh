#!/bin/bash

# Cloud Scheduler WEEKLY JOB Setup
# Sets up a weekly full-scrape job (Mondays at 3 AM SAST)

set -e

echo "🌊 Tide Raider - Weekly Web Scrape Setup"
echo "=========================================="
echo ""

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ gcloud CLI not found."
    exit 1
fi

PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
if [ -z "$PROJECT_ID" ]; then
    echo "❌ No GCP project selected."
    exit 1
fi

echo "📋 Project ID: $PROJECT_ID"
echo ""

read -p "Enter your Cloud Run backend URL (e.g., https://tide-raider-backend-xxx.run.app): " BACKEND_URL
read -sp "Enter your CRON_SECRET: " CRON_SECRET
echo ""
read -p "Enter Cloud Run region (default: europe-west1): " REGION
REGION=${REGION:-europe-west1}

echo ""
echo "Step 1: Creating/Updating Weekly Scheduler job (Mondays at 3AM SAST)..."

JOB_NAME="tide-raider-cron-weekly-3am"

if gcloud scheduler jobs describe $JOB_NAME --location=$REGION &>/dev/null; then
    echo "   ℹ️  Job already exists. Updating..."
    gcloud scheduler jobs update http $JOB_NAME \
        --location=$REGION \
        --schedule="0 3 * * 1" \
        --uri="${BACKEND_URL}/api/cron/run-weekly" \
        --http-method=POST \
        --headers="Content-Type=application/json,x-cron-secret=${CRON_SECRET}" \
        --oidc-service-account-email="cloud-scheduler-invoker@${PROJECT_ID}.iam.gserviceaccount.com" \
        --oidc-token-audience="${BACKEND_URL}" \
        --time-zone="Africa/Johannesburg" \
        --attempt-deadline=1800s \
        --max-retry-attempts=2 \
        --project=$PROJECT_ID
else
    gcloud scheduler jobs create http $JOB_NAME \
        --location=$REGION \
        --schedule="0 3 * * 1" \
        --uri="${BACKEND_URL}/api/cron/run-weekly" \
        --http-method=POST \
        --headers="Content-Type=application/json,x-cron-secret=${CRON_SECRET}" \
        --oidc-service-account-email="cloud-scheduler-invoker@${PROJECT_ID}.iam.gserviceaccount.com" \
        --oidc-token-audience="${BACKEND_URL}" \
        --time-zone="Africa/Johannesburg" \
        --attempt-deadline=1800s \
        --max-retry-attempts=2 \
        --description="Fetch FULL WEEK surf forecasts weekly at 3 AM SAST Mondays" \
        --project=$PROJECT_ID
fi

echo ""
echo "✅ Weekly job setup complete!"
echo "📅 Schedule: Mondays at 03:00 SAST"
