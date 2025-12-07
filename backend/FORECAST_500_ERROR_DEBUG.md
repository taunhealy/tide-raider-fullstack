# Forecast Endpoint 500 Error Debugging

## Issue
The forecast endpoint (`/api/forecast`) was returning 500 errors instead of proper 404 responses when forecast data doesn't exist.

## Changes Made

### 1. Improved Error Handling
- Added detailed error logging for Prisma query errors
- Added date parsing validation with clear error messages
- Separated error handling for different failure points:
  - Date parsing errors → 400 Bad Request
  - Prisma query errors → 500 with detailed logging
  - No forecast found → 404 Not Found (correct behavior)

### 2. Source Parameter Validation
- Added validation for the `source` query parameter
- Ensures only valid sources are accepted: `WINDFINDER`, `WINDGURU`, `WINDY`
- Defaults to `WINDFINDER` if invalid or missing
- Logs warnings for invalid source parameters

### 3. Better Error Messages
- Error responses now include:
  - Clear error type
  - Descriptive message
  - Request parameters (regionId, date, source)
  - Development-only stack traces (in dev mode)

## Testing Results

✅ **Database Query Test**: Prisma queries work correctly
- Queries for non-existent dates return `null` (not errors)
- Queries for existing dates return forecast data correctly
- Unique constraint `date_regionId_source` works as expected

✅ **Date Parsing Test**: Date parsing logic works correctly
- Valid dates are parsed correctly
- Invalid dates return 400 errors with clear messages

## Current Database State

- **2025-12-06**: No forecast data (expected - was deleted)
- **2025-12-05**: WINDGURU forecast exists
- **Earlier dates**: Multiple forecasts exist for all sources

## Next Steps to Debug 500 Errors

1. **Check Cloud Run Logs** for detailed error messages:
   ```bash
   gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=tide-raider-backend" --limit 50 --format json
   ```

2. **Look for these log patterns**:
   - `[forecast] Prisma query error:` - Database query issues
   - `[forecast] Date parsing error:` - Date format issues
   - `[forecast] Unexpected error:` - Other unexpected errors

3. **Common causes of 500 errors**:
   - Database connection issues
   - Prisma client not initialized correctly
   - Timeout issues (query taking too long)
   - Invalid date format in request
   - Missing unique constraint in database

## Expected Behavior Now

- **No forecast data**: Returns 404 with message "No forecast data available for [SOURCE] on [DATE]"
- **Invalid date**: Returns 400 with message "Invalid date format"
- **Database error**: Returns 500 with detailed error logged to console
- **Invalid source**: Defaults to WINDFINDER, logs warning

## Frontend Handling

The frontend's `api.getForecast()` function already handles 404 responses correctly:
- Returns `null` for 404 errors
- Displays "No forecast data available for source [A/B/C]"
- Throws errors for other status codes (which will now have better error messages)

## Files Modified

- `backend/src/routes/forecast.ts` - Improved error handling and validation
- `backend/scripts/check-forecast-data.ts` - Diagnostic script
- `backend/scripts/test-forecast-query.ts` - Query testing script

