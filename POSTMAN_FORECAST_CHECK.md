# Checking Forecast Data with Postman

## Method 1: Check via API Endpoint (Easiest)

### Get Log Entry with Forecast

**Request:**

- **Method:** `GET`
- **URL:** `https://your-backend-url.com/api/raid-logs?id=f669700e-0b6f-4447-80ab-6003c3635e17`
- **Headers:**
  ```
  Authorization: Bearer YOUR_JWT_TOKEN
  ```
  OR if using cookies:
  ```
  Cookie: auth-token=YOUR_TOKEN
  ```

**Response should include:**

```json
{
  "id": "f669700e-0b6f-4447-80ab-6003c3635e17",
  "date": "2025-11-21",
  "beachName": "Long Beach",
  "forecastId": "some-forecast-id-or-null",
  "forecast": {
    "id": "forecast-id",
    "date": "2025-11-21",
    "windSpeed": 16,
    "windDirection": 147.71,
    "swellHeight": 2.8,
    "swellPeriod": 15,
    "swellDirection": 218.88
  }
}
```

### Check All Log Entries (to see forecast data)

**Request:**

- **Method:** `GET`
- **URL:** `https://your-backend-url.com/api/raid-logs?page=1&limit=10`
- **Headers:** Same as above

**Response:**

```json
{
  "entries": [
    {
      "id": "f669700e-0b6f-4447-80ab-6003c3635e17",
      "forecast": { ... }
    }
  ],
  "total": 10
}
```

## Method 2: Direct Database Access

### Option A: Using Prisma Studio (Visual Interface)

1. **Navigate to backend folder:**

   ```bash
   cd backend
   ```

2. **Run Prisma Studio:**

   ```bash
   npx prisma studio
   ```

3. **Access in browser:**
   - Open `http://localhost:5555`
   - Click on `LogEntry` model
   - Search for ID: `f669700e-0b6f-4447-80ab-6003c3635e17`
   - Check the `forecastId` field
   - Click on the `forecast` relation to see forecast data

### Option B: Using Database Client (pgAdmin, DBeaver, etc.)

**Connection Details:**

- Get your `DATABASE_URL` from environment variables
- Format: `postgresql://user:password@host:port/database`

**SQL Query:**

```sql
-- Check log entry with forecast
SELECT
  le.id,
  le.date,
  le."beachName",
  le."forecastId",
  le."regionId",
  f.id as "forecast_id",
  f.date as "forecast_date",
  f."windSpeed",
  f."windDirection",
  f."swellHeight",
  f."swellPeriod",
  f."swellDirection",
  f.source
FROM "LogEntry" le
LEFT JOIN "Forecast" f ON le."forecastId" = f.id
WHERE le.id = 'f669700e-0b6f-4447-80ab-6003c3635e17';
```

### Option C: Using psql Command Line

```bash
# Connect to database
psql "postgresql://user:password@host:port/database"

# Run query
SELECT
  le.id,
  le."forecastId",
  f."windSpeed",
  f."swellHeight"
FROM "LogEntry" le
LEFT JOIN "Forecast" f ON le."forecastId" = f.id
WHERE le.id = 'f669700e-0b6f-4447-80ab-6003c3635e17';
```

## Method 3: Using Next.js API Route (If Available)

If you have a Next.js API route that proxies to the backend:

**Request:**

- **Method:** `GET`
- **URL:** `https://www.tideraider.com/api/raid-logs?id=f669700e-0b6f-4447-80ab-6003c3635e17`
- **Headers:**
  ```
  Cookie: auth-token=YOUR_TOKEN
  ```

## Postman Collection Setup

### Step 1: Create New Request

1. Open Postman
2. Click "New" → "HTTP Request"
3. Set method to `GET`

### Step 2: Set URL

```
GET https://your-backend-url.com/api/raid-logs?id=f669700e-0b6f-4447-80ab-6003c3635e17
```

### Step 3: Add Authentication

**Option A: Bearer Token**

- Go to "Authorization" tab
- Select "Bearer Token"
- Enter your JWT token

**Option B: Cookie**

- Go to "Headers" tab
- Add header:
  ```
  Cookie: auth-token=YOUR_TOKEN
  ```

### Step 4: Send Request

Click "Send" and check the response body for:

- `forecastId` field (should have a UUID or be null)
- `forecast` object (should have forecast data or be null)

## Expected Results

### ✅ If Forecast is Linked:

```json
{
  "id": "f669700e-0b6f-4447-80ab-6003c3635e17",
  "forecastId": "abc123-forecast-id",
  "forecast": {
    "id": "abc123-forecast-id",
    "windSpeed": 16,
    "swellHeight": 2.8,
    ...
  }
}
```

### ❌ If Forecast is NOT Linked:

```json
{
  "id": "f669700e-0b6f-4447-80ab-6003c3635e17",
  "forecastId": null,
  "forecast": null
}
```

### ⚠️ If Forecast ID exists but relation is broken:

```json
{
  "id": "f669700e-0b6f-4447-80ab-6003c3635e17",
  "forecastId": "abc123-forecast-id",
  "forecast": null // <-- This means the ID exists but forecast doesn't
}
```
