# Fix OAuth Client Not Found Error for Localhost

## Error
```
Error 401: invalid_client
The OAuth client was not found.
Client ID: 82632174665-tlmshrjeeahbb3giec045o009u8ag67j.apps.googleusercontent.com
```

## Solution

### Step 1: Check Google Cloud Console

1. Go to [Google Cloud Console - Credentials](https://console.cloud.google.com/apis/credentials?project=surf-445620)
2. Make sure you're in the correct project: **surf-445620**
3. Look for an OAuth 2.0 Client ID with the ID: `82632174665-tlmshrjeeahbb3giec045o009u8ag67j`

### Step 2A: If OAuth Client EXISTS

1. Click on the OAuth client to edit it
2. **Check Authorized JavaScript origins:**
   - Must include: `http://localhost:3000`
   - Must NOT include paths (e.g., `/api/auth/google`)
3. **Check Authorized redirect URIs:**
   - Must include: `http://localhost:4001/api/auth/google/callback`
   - Must match EXACTLY (including protocol, no trailing slash)
4. Click **Save**

### Step 2B: If OAuth Client DOES NOT EXIST

1. Click **+ CREATE CREDENTIALS** → **OAuth client ID**
2. If prompted, configure OAuth consent screen first
3. Select **Application type**: **Web application**
4. **Name**: `Tide Raider OAuth (Localhost)`
5. **Authorized JavaScript origins:**
   ```
   http://localhost:3000
   ```
6. **Authorized redirect URIs:**
   ```
   http://localhost:4001/api/auth/google/callback
   ```
7. Click **Create**
8. **Copy the Client ID and Client Secret**

### Step 3: Update Backend Environment

Update `backend/.env` with the correct credentials:

```env
GOOGLE_CLIENT_ID=your-actual-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-actual-client-secret
```

**Important:**
- If you created a NEW OAuth client, use the NEW Client ID and Secret
- If the OAuth client already exists, verify the Client ID matches exactly

### Step 4: Restart Backend

```bash
cd backend
# If using Docker:
docker-compose restart backend

# If running directly:
npm run dev
```

### Step 5: Test OAuth

1. Go to `http://localhost:3000`
2. Try to sign in with Google
3. Should redirect to Google OAuth
4. After authorization, should redirect back to your app

## Common Issues

### Issue: "Redirect URI mismatch"
**Fix:** Make sure the redirect URI in Google Cloud Console EXACTLY matches:
```
http://localhost:4001/api/auth/google/callback
```
- No trailing slash
- Must be `http://` (not `https://`) for localhost
- Must include the full path `/api/auth/google/callback`

### Issue: "Invalid origin"
**Fix:** Authorized JavaScript origins must be:
```
http://localhost:3000
```
- No paths
- No trailing slash
- Must be `http://` for localhost

### Issue: Client ID still not found
**Fix:** 
1. Verify you're in the correct Google Cloud project (`surf-445620`)
2. Check the Client ID is copied correctly (no extra spaces)
3. Make sure the OAuth client is **enabled** (not deleted)

## Verification Checklist

- [ ] OAuth client exists in Google Cloud Console
- [ ] Client ID matches `backend/.env` exactly
- [ ] Authorized JavaScript origins includes `http://localhost:3000`
- [ ] Authorized redirect URIs includes `http://localhost:4001/api/auth/google/callback`
- [ ] Backend `.env` file has correct `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
- [ ] Backend has been restarted after updating `.env`

