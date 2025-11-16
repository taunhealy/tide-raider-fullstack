# API Route Migration Helper

This is a guide for manually migrating API routes from Next.js to Express.

## Steps

1. **Identify the route:**
   - Location: `next/app/api/[route-name]/route.ts`
   - Methods: GET, POST, PUT, DELETE, etc.

2. **Create Express route:**
   - Location: `backend/src/routes/[route-name].ts`
   - Use Express Router

3. **Convert the handler:**
   - `NextResponse.json()` → `res.json()`
   - `request.json()` → `req.body`
   - `new URL(request.url).searchParams` → `req.query`
   - `request.headers` → `req.headers`
   - `NextResponse` status codes → `res.status().json()`

4. **Add authentication:**
   - Import `authenticateToken` or `optionalAuth` from middleware
   - Add as middleware: `router.get("/", authenticateToken, handler)`

5. **Register route:**
   - Add to `backend/src/routes/index.ts`:
     ```typescript
     import routeNameRouter from "./route-name";
     router.use("/route-name", routeNameRouter);
     ```

6. **Update frontend:**
   - Replace fetch calls to `/api/route-name` with `api.request()` or specific method
   - Update in `next/app/lib/api-client.ts` if it's a common endpoint

## Example Conversion

### Before (Next.js)
```typescript
// next/app/api/beaches/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const regionId = searchParams.get("regionId");
  
  const beaches = await prisma.beach.findMany({
    where: regionId ? { regionId } : undefined,
  });
  
  return NextResponse.json({ beaches });
}
```

### After (Express)
```typescript
// backend/src/routes/beaches.ts
import { Router } from "express";
import { prisma } from "../lib/prisma";
import { optionalAuth, AuthRequest } from "../middleware/auth";

const router = Router();

router.get("/", optionalAuth, async (req: AuthRequest, res) => {
  const regionId = req.query.regionId as string | undefined;
  
  const beaches = await prisma.beach.findMany({
    where: regionId ? { regionId } : undefined,
  });
  
  res.json({ beaches });
});

export default router;
```

### Register in index.ts
```typescript
// backend/src/routes/index.ts
import beachesRouter from "./beaches";
router.use("/beaches", beachesRouter);
```

