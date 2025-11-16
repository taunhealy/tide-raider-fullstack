# Frontend Migration Status

## ✅ Updated to Use Backend API

The frontend has been updated to use the backend API instead of Next.js serverless functions.

### Updated Files:

1. **API Client** (`next/app/lib/api-client.ts`)

   - ✅ Added methods for all endpoints: alerts, logs, raid-logs
   - ✅ All methods use `NEXT_PUBLIC_API_URL` environment variable

2. **Hooks:**

   - ✅ `useRaidLogs.ts` - Now uses `api.getRaidLogs()`
   - ✅ `useUpdateLog.ts` - Now uses `api.updateRaidLog()`

3. **Components:**

   - ✅ `RecentRaidLogs.tsx` - Uses `api.getRaidLogs()`
   - ✅ `AlertsList.tsx` - Uses `api.getAlerts()`, `api.deleteAlert()`, `api.patchAlert()`
   - ✅ `ForecastAlertForm.tsx` - Uses `api.createAlert()`
   - ✅ `RaidLogTable.tsx` - Uses `api.deleteRaidLog()`

4. **Context:**

   - ✅ `AlertContext.tsx` - Uses `api.createAlert()`, `api.updateAlert()`

5. **Pages:**
   - ✅ `alerts/new/page.tsx` - Uses `api.getLogs()`

## 🔧 Configuration Required

Make sure your frontend `.env.local` has:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

For production:

```env
NEXT_PUBLIC_API_URL=https://tide-raider-backend.fly.dev
```

## 📝 Next Steps

1. **Test the connection:**

   - Start backend: `cd backend && npm run dev`
   - Start frontend: `cd next && npm run dev`
   - Check browser console for API calls

2. **Remove old Next.js API routes** (optional, after confirming everything works):

   - `next/app/api/alerts/`
   - `next/app/api/logs/`
   - `next/app/api/raid-logs/`

3. **Update any remaining direct fetch calls** to use the API client

## ⚠️ Important Notes

- All API calls now go through the backend at `NEXT_PUBLIC_API_URL`
- Authentication is handled via cookies (NextAuth session tokens)
- CORS is configured on the backend to allow requests from the frontend
