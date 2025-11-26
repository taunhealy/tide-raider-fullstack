#!/bin/bash

# Cloud Scheduler Setup Script for Tide Raider
# This script sets up Google Cloud Scheduler to trigger your Cloud Run backend every 4 hours

set -e

echo "🌊 Tide Raider - Cloud Scheduler Setup"
echo "======================================="
echo ""

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ gcloud CLI not found. Please install it first:"
    echo "   https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Get project ID
PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
if [ -z "$PROJECT_ID" ]; then
    echo "❌ No GCP project selected. Run: gcloud config set project YOUR_PROJECT_ID"
    exit 1
fi

echo "📋 Project ID: $PROJECT_ID"
echo ""

# Prompt for required values
read -p "Enter your Cloud Run backend URL (e.g., https://tide-raider-backend-xxx.run.app): " BACKEND_URL
read -sp "Enter your CRON_SECRET: " CRON_SECRET
echo ""
read -p "Enter Cloud Run region (default: europe-west1): " REGION
REGION=${REGION:-europe-west1}

echo ""
echo "🔧 Configuration:"
echo "   Backend URL: $BACKEND_URL"
echo "   Region: $REGION"
echo "   Project: $PROJECT_ID"
echo ""

read -p "Continue with setup? (y/n): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Setup cancelled"
    exit 1
fi

echo ""
echo "Step 1/5: Enabling Cloud Scheduler API..."
gcloud services enable cloudscheduler.googleapis.com --project=$PROJECT_ID

echo ""
echo "Step 2/5: Creating service account..."
if gcloud iam service-accounts describe cloud-scheduler-invoker@${PROJECT_ID}.iam.gserviceaccount.com &>/dev/null; then
    echo "   ℹ️  Service account already exists, skipping..."
else
    gcloud iam service-accounts create cloud-scheduler-invoker \
        --display-name="Cloud Scheduler Invoker" \
        --project=$PROJECT_ID
    echo "   ✅ Service account created"
fi

echo ""
echo "Step 3/5: Granting Cloud Run invoker permission..."
# Extract service name from URL
SERVICE_NAME=$(echo $BACKEND_URL | sed 's/https:\/\///' | cut -d'.' -f1 | sed 's/-[0-9]*$//')
echo "   Detected service name: $SERVICE_NAME"

gcloud run services add-iam-policy-binding $SERVICE_NAME \
    --member="serviceAccount:cloud-scheduler-invoker@${PROJECT_ID}.iam.gserviceaccount.com" \
    --role="roles/run.invoker" \
    --region=$REGION \
    --project=$PROJECT_ID

echo ""
echo "Step 4/5: Creating Cloud Scheduler job..."
if gcloud scheduler jobs describe tide-raider-cron-4hourly --location=$REGION &>/dev/null; then
    echo "   ℹ️  Job already exists. Updating..."
    gcloud scheduler jobs update http tide-raider-cron-4hourly \
        --location=$REGION \
        --schedule="0 */4 * * *" \
        --uri="${BACKEND_URL}/api/cron/run-now" \
        --http-method=POST \
        --headers="Content-Type=application/json,x-cron-secret=${CRON_SECRET}" \
        --oidc-service-account-email="cloud-scheduler-invoker@${PROJECT_ID}.iam.gserviceaccount.com" \
        --oidc-token-audience="${BACKEND_URL}" \
        --time-zone="UTC" \
        --attempt-deadline=600s \
        --max-retry-attempts=2 \
        --project=$PROJECT_ID
else
    gcloud scheduler jobs create http tide-raider-cron-4hourly \
        --location=$REGION \
        --schedule="0 */4 * * *" \
        --uri="${BACKEND_URL}/api/cron/run-now" \
        --http-method=POST \
        --headers="Content-Type=application/json,x-cron-secret=${CRON_SECRET}" \
        --oidc-service-account-email="cloud-scheduler-invoker@${PROJECT_ID}.iam.gserviceaccount.com" \
        --oidc-token-audience="${BACKEND_URL}" \
        --time-zone="UTC" \
        --attempt-deadline=600s \
        --max-retry-attempts=2 \
        --description="Fetch surf forecasts and process alerts every 4 hours" \
        --project=$PROJECT_ID
fi

echo ""
echo "Step 5/5: Testing the job..."
read -p "Run a test execution now? (y/n): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "   🚀 Triggering test run..."
    gcloud scheduler jobs run tide-raider-cron-4hourly --location=$REGION --project=$PROJECT_ID
    echo ""
    echo "   ⏳ Waiting for execution (this may take 1-2 minutes)..."
    sleep 10
    echo ""
    echo "   📊 Recent execution status:"
    gcloud scheduler jobs describe tide-raider-cron-4hourly \
        --location=$REGION \
        --project=$PROJECT_ID \
        --format="table(state, lastAttemptTime, status.code, status.message)"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "📅 Schedule: Every 4 hours (00:00, 04:00, 08:00, 12:00, 16:00, 20:00 UTC)"
echo "💰 Estimated cost: ~$1.10/month"
echo ""
echo "📝 Useful commands:"
echo "   List jobs:    gcloud scheduler jobs list --location=$REGION"
echo "   Run manually: gcloud scheduler jobs run tide-raider-cron-4hourly --location=$REGION"
echo "   View logs:    gcloud scheduler jobs describe tide-raider-cron-4hourly --location=$REGION"
echo "   Pause job:    gcloud scheduler jobs pause tide-raider-cron-4hourly --location=$REGION"
echo "   Resume job:   gcloud scheduler jobs resume tide-raider-cron-4hourly --location=$REGION"
echo ""
