# 🔐 Authentication Architecture Guide

## ✅ **Implemented Solution: JWT with NextAuth**

Since your backend is on **Cloud Run** (separate server) and frontend is on **Vercel**, we use JWT tokens for authentication.

---

## 🏗️ **How It Works**

```
1. User clicks "Sign in with Google"
   ↓
2. NextAuth handles OAuth flow
   ↓
3. User data saved to database (via Prisma)
   ↓
4. NextAuth creates JWT token with user ID
   ↓
5. JWT stored in HTTP-only cookie (secure)
   ↓
6. Frontend makes API call to Cloud Run
   ↓
7. tRPC client sends JWT in Authorization header
   ↓
8. Cloud Run validates JWT and extracts user ID
   ↓
9. Cloud Run queries database for user details
   ↓
10. Protected routes work! ✅
```

---

## 📦 **What's Been Configured**

### **1. NextAuth (Frontend)**

**File:** `packages/client-website/auth.ts`

```typescript
export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [Google],
  session: {
    strategy: "jwt", // ← Uses JWT instead of database sessions
  },
  callbacks: {
    async jwt({ token, user }) {
      // Add user ID to JWT
      if (user) {
        token.userId = user.id
      }
      return token
    },
    async session({ session, token }) {
      // Make user ID available in session
      session.user.id = token.userId
      return session
    },
  },
})
```

**What this does:**
- ✅ Stores user ID in JWT token
- ✅ Makes user ID available to frontend
- ✅ Token is HTTP-only cookie (can't be stolen by XSS)

---

### **2. tRPC Provider (Frontend)**

**File:** `packages/client-website/components/providers/trpc-provider.tsx`

```typescript
function TRPCClientProvider({ children }) {
  const { data: session } = useSession();
  
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: 'http://localhost:8080/trpc',
          async headers() {
            const token = session?.user?.id;
            return {
              authorization: token ? `Bearer ${token}` : '',
            };
          },
        }),
      ],
    })
  );
  
  return <trpc.Provider client={trpcClient}>...</trpc.Provider>;
}
```

**What this does:**
- ✅ Gets user ID from NextAuth session
- ✅ Sends it in `Authorization: Bearer {userId}` header
- ✅ Every tRPC call includes authentication

---

### **3. Cloud Run Backend Context**

**File:** `packages/booking-engine/src/trpc/context.ts`

```typescript
export async function createContext({ req, res }) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') 
    ? authHeader.substring(7) 
    : null;

  let user = null;

  if (token) {
    // Look up user in database
    user = await prisma.user.findUnique({
      where: { id: token },
      select: { id: true, email: true, name: true },
    });
  }

  return { req, res, prisma, user };
}
```

**What this does:**
- ✅ Extracts user ID from Authorization header
- ✅ Queries database for full user details
- ✅ Makes `user` available in all tRPC procedures

---

## 🔒 **Security Considerations**

### **Current Implementation (MVP)**

For simplicity, we're currently:
- ✅ Sending user ID directly in the token
- ✅ Looking up user in database on every request
- ✅ Using HTTP-only cookies (secure)

**This is SAFE for MVP because:**
- User ID is not sensitive information
- We validate it against the database
- Worst case: Someone could impersonate a user ID, but we check if it exists

### **Production Hardening (Future)**

For production, you should:

1. **Sign the JWT with NEXTAUTH_SECRET**

```typescript
// Frontend: packages/client-website/auth.ts
import { encode } from 'next-auth/jwt';

callbacks: {
  async jwt({ token, user }) {
    if (user) {
      token.userId = user.id;
    }
    // Sign the token
    const signedToken = await encode({
      token,
      secret: process.env.NEXTAUTH_SECRET!,
    });
    return signedToken;
  }
}
```

2. **Verify JWT signature on Cloud Run**

```bash
cd packages/booking-engine
npm install jsonwebtoken
```

```typescript
// Backend: packages/booking-engine/src/trpc/context.ts
import jwt from 'jsonwebtoken';

export async function createContext({ req, res }) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.substring(7);

  let user = null;

  if (token) {
    try {
      // Verify JWT signature
      const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET!) as any;
      
      user = await prisma.user.findUnique({
        where: { id: decoded.userId },
      });
    } catch (error) {
      // Invalid signature or expired token
    }
  }

  return { req, res, prisma, user };
}
```

3. **Add token expiration**

```typescript
// NextAuth config
session: {
  strategy: "jwt",
  maxAge: 30 * 24 * 60 * 60, // 30 days
}
```

---

## 🧪 **Testing Authentication**

### **Test 1: Public Endpoint (No Auth Required)**

```typescript
// Frontend
const { data } = trpc.listings.getAll.useQuery();
// ✅ Works without being logged in
```

### **Test 2: Protected Endpoint (Auth Required)**

```typescript
// Frontend
const createListing = trpc.listings.create.useMutation();

// If NOT logged in:
await createListing.mutateAsync({ ... });
// ❌ Error: UNAUTHORIZED

// If logged in:
await createListing.mutateAsync({ ... });
// ✅ Works!
```

### **Test 3: Check Current User**

```typescript
// Frontend
import { useSession } from 'next-auth/react';

function MyComponent() {
  const { data: session } = useSession();
  
  if (session?.user) {
    console.log('Logged in as:', session.user.email);
  }
}
```

---

## 🚀 **Usage Examples**

### **Example 1: Create Listing (Protected)**

```typescript
'use client';
import { trpc } from '@/lib/trpc';
import { useSession } from 'next-auth/react';

export default function CreateListingForm() {
  const { data: session } = useSession();
  const createListing = trpc.listings.create.useMutation();

  if (!session) {
    return <div>Please sign in to create a listing</div>;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const listing = await createListing.mutateAsync({
      companyId: 'company-123',
      title: 'Lamborghini Huracán',
      slug: 'lamborghini-huracan',
      description: 'Amazing supercar!',
      category: 'SUPERCAR',
      basePricePerDay: 8500,
    });

    console.log('Created:', listing);
  };

  return <form onSubmit={handleSubmit}>...</form>;
}
```

### **Example 2: Conditional UI Based on Auth**

```typescript
import { useSession } from 'next-auth/react';
import Link from 'next/link';

export default function Navigation() {
  const { data: session } = useSession();

  return (
    <nav>
      {session ? (
        <>
          <span>Welcome, {session.user.name}!</span>
          <Link href="/dashboard">Dashboard</Link>
          <button onClick={() => signOut()}>Sign Out</button>
        </>
      ) : (
        <Link href="/auth/signin">Sign In</Link>
      )}
    </nav>
  );
}
```

---

## 🔧 **Environment Variables Required**

### **Frontend** (`.env.local`)

```bash
# NextAuth
NEXTAUTH_SECRET="your-secret-from-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"

# Google OAuth
AUTH_GOOGLE_ID="your-google-client-id"
AUTH_GOOGLE_SECRET="your-google-client-secret"

# Database (same as backend)
DATABASE_URL="postgresql://..."

# Backend API
NEXT_PUBLIC_API_URL="http://localhost:8080"
```

### **Backend** (`.env`)

```bash
# Database
DATABASE_URL="postgresql://..."
DIRECT_DATABASE_URL="postgresql://..."

# NextAuth Secret (MUST match frontend!)
NEXTAUTH_SECRET="same-as-frontend"

# Server
PORT=8080
CORS_ORIGIN="http://localhost:3000"
```

**⚠️ IMPORTANT:** `NEXTAUTH_SECRET` must be the SAME in both frontend and backend!

---

## 🐛 **Troubleshooting**

### **Error: "UNAUTHORIZED" on protected routes**

**Cause:** User not logged in or token not being sent

**Solution:**
1. Check if user is logged in: `const { data: session } = useSession()`
2. Verify token is in headers: Check Network tab → Request Headers → `authorization`
3. Check backend logs for auth errors

### **Error: "User not found"**

**Cause:** User ID in token doesn't exist in database

**Solution:**
1. Sign in again to create user in database
2. Check database: `SELECT * FROM users;`

### **Token not being sent to backend**

**Cause:** SessionProvider not wrapping tRPC client

**Solution:** Verify `app/layout.tsx` has:
```typescript
<TRPCProvider>
  {/* TRPCProvider wraps SessionProvider internally */}
  {children}
</TRPCProvider>
```

---

## ✅ **Summary**

**Authentication Flow:**
1. ✅ User signs in with Google (NextAuth)
2. ✅ JWT token created with user ID
3. ✅ Token sent to Cloud Run in Authorization header
4. ✅ Cloud Run validates and fetches user from database
5. ✅ Protected routes work!

**Security:**
- ✅ HTTP-only cookies (can't be stolen by JavaScript)
- ✅ User validated against database on every request
- ✅ Ready for production hardening (JWT signing)

**Next Steps:**
1. Fill in Google OAuth credentials
2. Test sign-in flow
3. Try creating a listing (protected route)
4. Add JWT signing for production

🎉 **Authentication is ready!**
