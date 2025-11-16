# Quick Test Guide

## ✅ Yes, Backend is Set Up to Work with Next.js Frontend!

The backend is configured with:
- ✅ CORS enabled for frontend origin
- ✅ Cookie parser for NextAuth sessions
- ✅ JWT token validation from NextAuth
- ✅ API client ready in frontend

## 🚀 Quick Test (5 minutes)

### Step 1: Start Backend

```bash
cd backend
npm install          # First time only
npm run prisma:generate  # First time only
npm run dev
```

You should see:
```
🚀 Backend server running on port 3001
📡 Environment: development
```

### Step 2: Test Backend Directly

Open a new terminal and run:

```bash
# Test health endpoint
curl http://localhost:3001/health

# Should return: {"status":"ok","timestamp":"..."}
```

### Step 3: Start Frontend

```bash
cd next

# Add to .env.local (if not already there):
# NEXT_PUBLIC_API_URL=http://localhost:3001

npm run dev
```

### Step 4: Test from Browser

1. Open `http://localhost:3000`
2. Open browser console (F12)
3. Run:

```javascript
// Test backend connection
fetch('http://localhost:3001/health')
  .then(r => r.json())
  .then(data => console.log('✅ Backend connected:', data))
  .catch(err => console.error('❌ Backend error:', err));
```

### Step 5: Test Authenticated Endpoint

1. **Log in** to your Next.js app
2. In browser console, run:

```javascript
// This will use your session cookies automatically
fetch('http://localhost:3001/api/alerts', {
  credentials: 'include'
})
  .then(r => r.json())
  .then(data => console.log('✅ Alerts:', data))
  .catch(err => console.error('❌ Error:', err));
```

## 🐛 Troubleshooting

### "Cannot connect to backend"
- ✅ Check backend is running on port 3001
- ✅ Check `NEXT_PUBLIC_API_URL=http://localhost:3001` in frontend `.env.local`

### "CORS error"
- ✅ Check `FRONTEND_URL=http://localhost:3000` in backend `.env`
- ✅ Restart backend after changing `.env`

### "401 Unauthorized"
- ✅ Make sure you're logged in to Next.js app
- ✅ Check `NEXTAUTH_SECRET` matches in both frontend and backend `.env` files

### "Prisma errors"
```bash
cd backend
npm run prisma:generate
```

## 📝 Next Steps

Once basic connection works:

1. **Test each endpoint:**
   - `GET /api/beaches` ✅ (public)
   - `GET /api/alerts` ✅ (requires auth)
   - `GET /api/logs` ✅ (requires auth)
   - `GET /api/raid-logs` ✅ (public with filters)

2. **Update frontend components** to use `api-client` instead of direct `/api/*` calls

3. **See full testing guide:** `TESTING_GUIDE.md`

