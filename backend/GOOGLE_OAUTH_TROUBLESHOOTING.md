# Google OAuth 2.0 Troubleshooting Guide

## Error: "Access blocked: Authorization Error" + "Error 400: invalid_request"

This error means Google is rejecting your OAuth request. This is **NOT a code issue** - it's a Google Cloud Console configuration problem.

## Step-by-Step Fix

### 1. Verify Your Callback URL

The callback URL must be **EXACTLY**:
```
https://tide-raider-backend.fly.dev/api/auth/google/callback
```

**Critical points:**
- ✅ Must use `https://` (not `http://`)
- ✅ No trailing slash
- ✅ Exact path: `/api/auth/google/callback`
- ✅ Must match what's in your code

### 2. Check Fly.io Logs for Actual Callback URL

Check your backend logs to see what callback URL is being used:

```powershell
flyctl logs --app tide-raider-backend | Select-String "Callback URL"
```

Look for: `[auth] 📍 Callback URL: ...`

### 3. Configure Google Cloud Console

Go to [Google Cloud Console](https://console.cloud.google.com/) → **APIs & Services** → **Credentials**

#### A. OAuth 2.0 Client ID Settings

1. Click on your OAuth 2.0 Client ID (Web application type)
2. Under **Authorized redirect URIs**, add:
   ```
   https://tide-raider-backend.fly.dev/api/auth/google/callback
   ```
   - ⚠️ **NO trailing slash**
   - ⚠️ **Exact match** (case-sensitive)
   - ⚠️ **Must be `https://`** (not `http://`)

3. Under **Authorized JavaScript origins**, add:
   ```
   https://www.tideraider.com
   ```
   - This is where users initiate OAuth (your frontend)
   - Must match your `FRONTEND_URL` environment variable

#### B. OAuth Consent Screen

Go to **APIs & Services** → **OAuth consent screen**

**For Testing (Internal/Testing Mode):**
1. **User Type**: Choose "Internal" (if using Google Workspace) or "External"
2. **App name**: Your app name (e.g., "Surf Wiz" or "Tide Raider")
3. **User support email**: Your email
4. **Developer contact information**: Your email
5. **Scopes**: Add at minimum:
   - `.../auth/userinfo.email`
   - `.../auth/userinfo.profile`
6. **Test users**: Add your email (`taunhealy@gmail.com`) to test users list
7. **Publishing status**: Can stay in "Testing" mode

**For Production:**
1. Complete all required fields
2. Add privacy policy URL
3. Add terms of service URL
4. Submit for verification (if using external users)

### 4. Verify Environment Variables in Fly.io

Check that all secrets are set correctly:

```powershell
flyctl secrets list --app tide-raider-backend
```

Required secrets:
- ✅ `GOOGLE_CLIENT_ID` - Must match the Client ID in Google Cloud Console
- ✅ `GOOGLE_CLIENT_SECRET` - Must match the Client Secret in Google Cloud Console
- ✅ `BACKEND_URL` - Should be `https://tide-raider-backend.fly.dev`
- ✅ `FRONTEND_URL` - Should be `https://www.tideraider.com`

### 5. Common Mistakes

❌ **Wrong redirect URI format:**
- `https://tide-raider-backend.fly.dev/api/auth/google/callback/` (trailing slash)
- `http://tide-raider-backend.fly.dev/api/auth/google/callback` (http instead of https)
- `https://tide-raider-backend.fly.dev/auth/google/callback` (missing `/api`)

✅ **Correct:**
- `https://tide-raider-backend.fly.dev/api/auth/google/callback`

❌ **App in Testing mode without test user:**
- If your app is in "Testing" mode, you MUST add your email to the test users list
- Go to OAuth consent screen → Test users → Add your email

❌ **Wrong Client ID/Secret:**
- Using development credentials in production
- Using wrong OAuth client (different project)

✅ **Solution:**
- Use the same Client ID/Secret that's configured in Google Cloud Console
- Verify they match in Fly.io secrets

### 6. Verify Configuration

After making changes:

1. **Wait 5-10 minutes** for Google to propagate changes
2. **Clear browser cache/cookies** for Google
3. **Try again** from your frontend

### 7. Debug Checklist

- [ ] Redirect URI in Google Cloud Console matches exactly: `https://tide-raider-backend.fly.dev/api/auth/google/callback`
- [ ] JavaScript origin in Google Cloud Console: `https://www.tideraider.com`
- [ ] `GOOGLE_CLIENT_ID` in Fly.io matches Google Cloud Console
- [ ] `GOOGLE_CLIENT_SECRET` in Fly.io matches Google Cloud Console
- [ ] `BACKEND_URL` in Fly.io is set to `https://tide-raider-backend.fly.dev`
- [ ] `FRONTEND_URL` in Fly.io is set to `https://www.tideraider.com`
- [ ] OAuth consent screen is configured
- [ ] If in Testing mode, your email is in test users list
- [ ] Waited 5-10 minutes after making changes
- [ ] Cleared browser cache/cookies

### 8. Check Backend Logs

Look for these log messages when you try to sign in:

```powershell
flyctl logs --app tide-raider-backend --follow
```

You should see:
- `[auth] 🔐 Google OAuth route accessed`
- `[auth] 📍 Callback URL: https://tide-raider-backend.fly.dev/api/auth/google/callback`
- `[auth] 🔑 Client ID: ...`

If you see errors, they'll help identify the issue.

### 9. Still Not Working?

If you've verified everything above and it still doesn't work:

1. **Double-check the exact redirect URI** - Copy/paste from Google Cloud Console to ensure no hidden characters
2. **Try creating a new OAuth 2.0 Client ID** - Sometimes old configurations have issues
3. **Check if your app needs verification** - If using external users, Google may require app verification
4. **Check Google Cloud Console audit logs** - See what error Google is actually returning

### 10. Quick Test

To verify your configuration is correct, you can test the OAuth flow manually:

1. Go to: `https://tide-raider-backend.fly.dev/api/auth/google`
2. You should be redirected to Google's OAuth page
3. If you see an error immediately, it's a configuration issue
4. If you can sign in but get redirected back with an error, it's likely a callback URL mismatch

## Need More Help?

If you're still stuck, check:
- Google Cloud Console → APIs & Services → OAuth consent screen → Error details
- Backend logs: `flyctl logs --app tide-raider-backend`
- The exact error message from Google (it sometimes provides more details)

