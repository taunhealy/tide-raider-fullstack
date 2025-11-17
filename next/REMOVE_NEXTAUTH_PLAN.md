# Plan to Remove NextAuth and Use Backend Auth

## Current Status
- ✅ Backend OAuth is working
- ✅ Backend sets `auth-token` cookie
- ✅ Backend proxy reads `auth-token` cookie
- ✅ Navbar updated to use `useBackendAuth` hook

## What's Done
1. Created `useBackendAuth` hook - replaces `useSession()`
2. Updated Navbar to use backend auth
3. Backend proxy already handles `auth-token` cookie

## What Needs to Be Done

### 1. Update All Components Using NextAuth
Replace `useSession()` with `useBackendAuth()` in:
- `next/app/components/notifications/NotificationBadge.tsx`
- `next/app/components/raid-logs/RaidLogForm.tsx`
- `next/app/components/raid-logs/RaidLogTable.tsx`
- `next/app/components/alerts/ForecastAlertForm.tsx`
- And other components (see grep results)

### 2. Update API Routes
Replace `getServerSession()` with backend cookie check in:
- `next/app/api/subscription/status/route.ts` (already updated)
- `next/app/api/user/current/route.ts`
- Other API routes using NextAuth

### 3. Remove NextAuth Dependencies
- Remove `next-auth` package
- Remove `next-auth/react` imports
- Remove `SessionProvider` from layout
- Remove `next/app/api/auth/[...nextauth]/route.ts`
- Remove `next/app/lib/authOptions.ts`
- Remove `next/app/lib/auth-adapter.ts`

### 4. Update Sign In Flow
- Already using backend OAuth (`/api/auth/google`)
- No changes needed

### 5. Update Sign Out
- Use backend `/api/auth/logout` endpoint
- Already implemented in `useBackendAuth` hook

## Quick Migration Steps

### Step 1: Update useAuth hook
Replace `next/app/hooks/useAuth.ts` to use backend auth:

```typescript
import { useBackendAuth } from "./useBackendAuth";

export function useAuth() {
  const { data: session, status } = useBackendAuth();
  return {
    session,
    isLoading: status === "loading",
    isAuthenticated: status === "authenticated",
  };
}
```

### Step 2: Update Components
Find and replace:
- `import { useSession } from "next-auth/react"` → `import { useBackendAuth } from "../hooks/useBackendAuth"`
- `useSession()` → `useBackendAuth()`
- `signOut()` from next-auth → `signOut()` from useBackendAuth

### Step 3: Update API Routes
Replace `getServerSession(authOptions)` with:
```typescript
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

const cookieStore = await cookies();
const authToken = cookieStore.get("auth-token")?.value;
const secret = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET;

if (!authToken) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

const decoded = jwt.verify(authToken, secret) as any;
const userId = decoded.id || decoded.sub;
```

### Step 4: Remove NextAuth Provider
Remove from `next/app/layout.tsx`:
```typescript
import { SessionProvider } from "next-auth/react";
// Remove SessionProvider wrapper
```

### Step 5: Clean Up
- Remove NextAuth files
- Remove `next-auth` from package.json
- Run `npm install`

## Benefits
- ✅ Single source of truth (backend)
- ✅ Simpler architecture
- ✅ No session sync issues
- ✅ Backend OAuth already working

## Testing
After migration:
1. Test sign in flow
2. Test sign out flow
3. Test protected routes
4. Test API routes that require auth
5. Verify user info displays correctly

