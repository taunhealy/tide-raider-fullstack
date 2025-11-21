# Forecast Linking Fixes

## Changes Made

### 1. Frontend: `useCreateLog.ts`
- **Improved forecast ID extraction**: Now handles multiple forecast data structures
- **Added fallback**: Sends forecast object if ID is missing
- **Added logging**: Logs forecast data structure for debugging

### 2. Frontend: `useUpdateLog.ts`
- **Improved forecast ID extraction**: Better handling of different data types
- **Added logging**: More detailed logging of forecast data

### 3. Backend: `logService.ts` - `createRaidLogEntry`
- **Improved forecast lookup**: 
  - First tries to find by `forecastId` if provided
  - Falls back to date/region lookup if ID not found
  - Tries WINDFINDER source first, then any source
  - Uses exact date match (UTC midnight) instead of range
- **Added logging**: Comprehensive logging of forecast lookup process

### 4. Backend: `logService.ts` - `updateLogEntry`
- **Improved forecast lookup**: Same improvements as create
- **Better date handling**: Uses UTC midnight for exact date matching
- **Added logging**: Detailed logging of forecast lookup

## How It Works Now

### Creating a Log Entry

1. **Frontend sends:**
   - `forecastId`: Extracted from `forecastData.id` if available
   - `forecast`: Full forecast object if ID is missing (for fallback)

2. **Backend processes:**
   - If `forecastId` provided → Look up forecast by ID
   - If not found or not provided → Look up by date/region
   - Try WINDFINDER source first, then any source
   - Link forecast if found

### Updating a Log Entry

1. **Frontend sends:**
   - `forecastId`: Extracted from `forecastData.id` if available
   - `date` and `regionId`: For fallback lookup

2. **Backend processes:**
   - If `forecastId` provided → Look up forecast by ID
   - If not found or not provided → Look up by date/region
   - Link forecast if found

## Key Improvements

1. **Robust ID extraction**: Handles string IDs, object with ID, or full forecast objects
2. **Fallback lookup**: Always tries to find forecast by date/region if ID lookup fails
3. **Better date matching**: Uses UTC midnight for exact date matching
4. **Source priority**: Tries WINDFINDER first (most common), then any source
5. **Comprehensive logging**: Easy to debug forecast linking issues

## Testing

After these changes, when creating/updating a log entry:

1. Check browser console for `[useCreateLog]` or `[useUpdateLog]` logs
2. Check backend logs for `[createRaidLogEntry]` or `[updateLogEntry]` logs
3. Verify the log entry has `forecastId` set in database
4. Verify the forecast relation works when fetching log entries

## Expected Behavior

- ✅ If forecast ID is provided → Uses it directly
- ✅ If forecast ID missing but date/region provided → Looks up forecast automatically
- ✅ If forecast exists → Links it to log entry
- ✅ If forecast doesn't exist → Log entry created without forecast (logs warning)

