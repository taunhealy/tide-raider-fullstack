# Connection Pool Optimization Guide

## Problem
- Fly.io Postgres has ~100 connection limit
- Next.js Server Components create many connections
- Risk of connection pool exhaustion

## Solution: Optimize Without Migrating

### 1. Add Connection Pooling to Prisma

**Backend** (`backend/src/lib/prisma.ts`):
```typescript
// Connection limit: 10 per instance
// With 2-3 Fly.io instances = 20-30 connections total
// Leaves 70+ connections for Next.js
```

**Frontend** (`next/app/lib/prisma.ts`):
```typescript
// Use even smaller pool for Next.js
// Limit: 5 connections per Server Component instance
```

### 2. Route More Queries Through Backend API

**Current**: 261 Prisma calls in Next.js
**Target**: Reduce to <50 by routing through backend

**Priority routes to migrate:**
- `/api/forecasts/route.ts` → Use backend API
- `/api/comments/route.ts` → Use backend API  
- `/api/raid-logs/*` → Use backend API
- `/api/alerts/*` → Use backend API

### 3. Implement Query Caching

**Use React Query caching:**
- Cache forecast data (5-10 min)
- Cache beach data (30 min)
- Cache region data (1 hour)

**Reduces database load by 60-80%**

### 4. Monitor Connection Usage

**Add logging:**
```typescript
// Log active connections
prisma.$on('query', (e) => {
  console.log('Query:', e.query);
  console.log('Duration:', e.duration);
});
```

**Set up alerts:**
- Alert if connections > 80
- Alert if query time > 1s

### 5. Use PgBouncer (Advanced)

If still hitting limits:
- Add PgBouncer connection pooler
- Fly.io supports PgBouncer
- Can handle 1000+ client connections
- Pools to 100 database connections

## Expected Results

**Before optimization:**
- 100+ connections under load
- Risk of pool exhaustion
- Slow queries

**After optimization:**
- 30-50 connections typical
- 70+ connections headroom
- Faster queries (cached)
- **Cost: $0** (just code changes)

## Migration Priority

1. ✅ **Add connection limits** (5 min)
2. ✅ **Route forecasts through backend** (30 min)
3. ✅ **Add React Query caching** (1 hour)
4. ⚠️ **Monitor and adjust** (ongoing)
5. 🔄 **Add PgBouncer if needed** (if still issues)


