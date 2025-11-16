# Cron Job Setup Guide

## Overview

The backend now supports multi-timezone cron jobs that:

1. Fetch surf conditions for all regions
2. Calculate and store beach scores
3. Process alerts for all users

## Endpoint

**POST** `/api/cron/fetch-and-alert`

### Authentication

The endpoint is protected by a secret token. Include it in the request header:

```
X-Cron-Secret: your-secret-key-here
```

### Request Body (Optional)

```json
{
  "timezone": "UTC"
}
```

### Response

```json
{
  "success": true,
  "timezone": "UTC",
  "timestamp": "2025-01-16T10:00:00.000Z",
  "duration": "45000ms",
  "regionResults": {
    "regionsProcessed": 30,
    "regionsSucceeded": 28,
    "regionsFailed": 2,
    "errors": []
  },
  "alertResults": {
    "usersProcessed": 150,
    "alertsChecked": 450,
    "notificationsSent": 25,
    "errors": 0,
    "errorDetails": []
  }
}
```

## Environment Variables

Add to `backend/.env`:

```env
CRON_SECRET=your-super-secret-key-change-this-in-production
```

## Setting Up Multiple Timezone Cron Jobs

### Option 1: GitHub Actions (Recommended)

Create `.github/workflows/cron-jobs.yml`:

```yaml
name: Daily Alert Cron Jobs

on:
  schedule:
    # 5am UTC (covers Europe/Africa)
    - cron: "0 5 * * *"
    # 5am EST (9am UTC) - US East Coast
    - cron: "0 9 * * *"
    # 5am PST (13:00 UTC) - US West Coast
    - cron: "0 13 * * *"
    # 5am AEST (19:00 UTC previous day) - Australia
    - cron: "0 19 * * *"
  workflow_dispatch: # Allow manual trigger

jobs:
  fetch-and-alert:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Cron Job
        env:
          CRON_SECRET: ${{ secrets.CRON_SECRET }}
          BACKEND_URL: ${{ secrets.BACKEND_URL }}
        run: |
          TIMEZONE=$(date +%Z)
          curl -X POST $BACKEND_URL/api/cron/fetch-and-alert \
            -H "Content-Type: application/json" \
            -H "X-Cron-Secret: $CRON_SECRET" \
            -d "{\"timezone\": \"$TIMEZONE\"}" \
            -w "\nHTTP Status: %{http_code}\n"
```

**GitHub Secrets to Set:**

- `CRON_SECRET`: Your cron secret from backend `.env`
- `BACKEND_URL`: Your backend URL (e.g., `https://tide-raider-backend.fly.dev`)

### Option 2: Vercel Cron (If deploying backend to Vercel)

Add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/fetch-and-alert",
      "schedule": "0 5 * * *"
    },
    {
      "path": "/api/cron/fetch-and-alert?timezone=America/New_York",
      "schedule": "0 9 * * *"
    },
    {
      "path": "/api/cron/fetch-and-alert?timezone=Australia/Sydney",
      "schedule": "0 19 * * *"
    }
  ]
}
```

### Option 3: Fly.io Cron Jobs

Add to `fly.toml`:

```toml
[[services]]
  processes = ["cron"]

  [[services.schedule]]
    cron = "0 5 * * *"
    action = "curl -X POST http://localhost:3001/api/cron/fetch-and-alert -H 'X-Cron-Secret: ${CRON_SECRET}' -H 'Content-Type: application/json' -d '{\"timezone\":\"UTC\"}'"
```

### Option 4: External Cron Service (cron-job.org, EasyCron, etc.)

1. Create a new cron job
2. Set schedule (e.g., daily at 5am in different timezones)
3. Set URL: `https://your-backend.fly.dev/api/cron/fetch-and-alert`
4. Set method: POST
5. Add header: `X-Cron-Secret: your-secret-key`
6. Add body: `{"timezone": "UTC"}`

## Testing

### Manual Test

```bash
# Test the endpoint
curl -X POST http://localhost:3001/api/cron/fetch-and-alert \
  -H "Content-Type: application/json" \
  -H "X-Cron-Secret: your-secret-key" \
  -d '{"timezone": "UTC"}'
```

### Health Check

```bash
curl http://localhost:3001/api/cron/health
```

## Monitoring

The endpoint logs:

- Start time and timezone
- Region processing progress
- Alert processing progress
- Success/failure counts
- Total duration

Check your backend logs to monitor cron job execution.

## Timezone Coverage

Recommended cron schedules for global coverage:

| Timezone            | Local 5am | UTC Time         | Cron Schedule |
| ------------------- | --------- | ---------------- | ------------- |
| UTC                 | 05:00     | 05:00            | `0 5 * * *`   |
| EST (US East)       | 05:00     | 10:00            | `0 10 * * *`  |
| PST (US West)       | 05:00     | 13:00            | `0 13 * * *`  |
| AEST (Australia)    | 05:00     | 19:00 (prev day) | `0 19 * * *`  |
| SAST (South Africa) | 05:00     | 03:00            | `0 3 * * *`   |

## Troubleshooting

### 401 Unauthorized

- Check `CRON_SECRET` matches in both `.env` and cron service
- Verify header name is exactly `X-Cron-Secret`

### Timeout Errors

- Cron jobs can take 1-5 minutes depending on number of regions
- Increase timeout in your cron service if needed

### Region Fetch Failures

- Check scraper is working for that region
- Verify region exists in database
- Check network connectivity

### Alert Processing Failures

- Check database connectivity
- Verify user records exist
- Check notification service configuration
