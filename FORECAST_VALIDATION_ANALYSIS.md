# Forecast Validation Analysis

## Backend API Endpoints

### 1. **GET /api/raid-logs** - Fetch logs with forecasts
**Location:** `backend/src/routes/raid-logs.ts` (line 22-97)
**Service:** `backend/src/services/logService.ts` → `getLogEntriesWithFilters()`

**Returns:**
```typescript
{
  entries: LogEntry[],
  total: number,
  page: number,
  limit: number,
  totalPages: number
}
```

**Log Entry Structure (includes forecast):**
```typescript
{
  id: string,
  date: Date,
  surferName: string,
  // ... other fields
  forecast: {
    id: string,
    date: Date,
    windSpeed: number,
    windDirection: number,
    swellHeight: number,
    swellPeriod: number,
    swellDirection: number
  } | null
}
```

### 2. **POST /api/raid-logs** - Create log entry
**Location:** `backend/src/routes/raid-logs.ts` (line 100-126)
**Validation:** `validate({ body: createRaidLogSchema })` (line 104)
**Service:** `backend/src/services/logService.ts` → `createRaidLogEntry()`

## Expected Data Structure for POST

**Schema:** `backend/src/validators/logValidators.ts` → `createRaidLogSchema`

```typescript
{
  beachName: string,           // Required
  date: string,               // Required, format: YYYY-MM-DD
  surferName: string,          // Required
  surferEmail: string,        // Required, valid email
  surferRating: number,        // Required, 0-5
  comments?: string,          // Optional
  imageUrl?: string,          // Optional, valid URL or empty string
  imageUrls?: string[],       // Optional, array of valid URLs
  videoUrl?: string,           // Optional, valid URL or empty string
  videoPlatform?: string,      // Optional, nullable
  isPrivate?: boolean,         // Optional
  isAnonymous?: boolean,      // Optional
  waveType?: string,           // Optional
  beachId?: string,           // Optional, UUID
  regionId: string,           // Required, UUID or slug
  forecastId?: string,        // Optional, UUID
  forecast?: {                // Optional, only if no forecastId
    id?: string,              // Optional, UUID
    date?: string,            // Optional
    windSpeed?: number,        // Optional
    windDirection?: number,    // Optional
    swellHeight?: number,      // Optional
    swellPeriod?: number,     // Optional
    swellDirection?: number    // Optional
    // NO legacy fields (wind, swell, timestamp)
  }
}
```

## Why Validation Fails

### Root Cause
The **production backend** still has the old schema that defines legacy fields:

```typescript
// OLD SCHEMA (in production)
forecast: z.object({
  // ... new format fields
  wind: z.object({
    speed: z.number(),      // Required if wind exists
    direction: z.string()  // Required if wind exists
  }).optional(),
  swell: z.object({
    height: z.number(),    // Required if swell exists
    period: z.number(),   // Required if swell exists
    direction: z.string()  // Required if swell exists
  }).optional(),
  timestamp: z.number().optional()
}).optional()
```

### The Problem
When the frontend sends a forecast object that contains legacy fields (even as empty objects `{}`), Zod validation:

1. Sees `forecast.wind: {}` exists
2. Tries to validate it against `z.object({ speed: z.number(), direction: z.string() })`
3. Fails because `speed` and `direction` are **required** inside the `wind` object
4. Returns error: `"forecast.wind: Required"`

### Current Schema (Local - Not Deployed)
```typescript
// NEW SCHEMA (local only)
forecast: z.object({
  id?: string,
  date?: string,
  windSpeed?: number,
  windDirection?: number,
  swellHeight?: number,
  swellPeriod?: number,
  swellDirection?: number
  // Legacy fields REMOVED
})
.passthrough()  // Allows extra fields but doesn't validate them
.optional()
```

## Solution

### 1. **Frontend Fix** (Already Done)
- If `forecastId` exists → **NEVER** send `forecast` object
- If no `forecastId` → Only send new-format fields (windSpeed, swellHeight, etc.)
- **Never** include legacy fields (wind, swell, timestamp)

### 2. **Backend Fix** (Needs Deployment)
- Remove legacy field definitions from schema
- Use `.passthrough()` to ignore any legacy fields that slip through
- Deploy to production

### 3. **Backend Service Logic**
The service (`createRaidLogEntry`) handles forecast lookup:
1. If `forecastId` provided → Look up by ID
2. If no `forecastId` but `forecast` object provided → Try to find/create by date/region
3. If neither → Try to find existing forecast by date/region
4. Link forecast to log entry via `forecastId` foreign key

## Data Flow

```
Frontend (useCreateLog.ts)
  ↓
Next.js API Route (/api/raid-logs/route.ts)
  ↓ (proxies body as-is)
Backend Route (backend/src/routes/raid-logs.ts)
  ↓ (validates with createRaidLogSchema)
Validation Middleware (backend/src/middleware/validation.ts)
  ↓ (if validation passes)
LogService.createRaidLogEntry()
  ↓
Prisma → Database
```

## Key Points

1. **Validation happens BEFORE service logic** - If validation fails, service never runs
2. **Production backend has old schema** - Still validates legacy fields
3. **Frontend must never send legacy fields** - Even if backend schema allows them
4. **forecastId takes precedence** - If provided, backend looks up forecast by ID, ignores forecast object

