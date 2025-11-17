# Verify OAuth Configuration - Step by Step

## The Error
"Access blocked: Authorization Error" + "Error 400: invalid_request"

This means Google is rejecting the OAuth request. Let's verify everything step by step.

## Step 1: Check Backend Logs

When you try to sign in, check what callback URL the backend is using:

```powershell
flyctl logs --app tide-raider-backend --follow
```

Then try to sign in and look for:
- `[auth] 📍 Callback URL: ...`
- `[auth] 🔑 Client ID: ...`

**The callback URL MUST be exactly:**
```
https://tide-raider-backend.fly.dev/api/auth/google/callback
```

## Step 2: Verify Google Cloud Console

Go to [Google Cloud Console](https://console.cloud.google.com/) → **APIs & Services** → **Credentials**

### A. Check OAuth 2.0 Client ID

1. Click on your OAuth 2.0 Client ID
2. Under **Authorized redirect URIs**, verify you have EXACTLY:
   ```
   https://tide-raider-backend.fly.dev/api/auth/google/callback
   ```
   - ✅ Must be `https://` (not `http://`)
   - ✅ No trailing slash
   - ✅ Exact path: `/api/auth/google/callback`

3. Under **Authorized JavaScript origins**, verify you have:
   ```
   https://www.tideraider.com
   ```

### B. Verify Client ID/Secret Match

1. Copy the **Client ID** from Google Cloud Console
2. Check Fly.io secrets:
   ```powershell
   flyctl secrets list --app tide-raider-backend
   ```
3. The `GOOGLE_CLIENT_ID` in Fly.io MUST match the Client ID in Google Cloud Console exactly

4. Do the same for `GOOGLE_CLIENT_SECRET`

## Step 3: OAuth Consent Screen

Go to **APIs & Services** → **OAuth consent screen**

### Verify:
1. **Publishing status**: Should be "Testing" (if you're a test user)
2. **Test users**: Your email (`taunhealy@gmail.com`) must be in the list
3. **Scopes**: Must include:
   - `.../auth/userinfo.email`
   - `.../auth/userinfo.profile`

## Step 4: Most Common Issues

### Issue 1: Callback URL Mismatch
**Symptom**: Error 400: invalid_request

**Fix**: 
- Backend logs show: `https://tide-raider-backend.fly.dev/api/auth/google/callback`
- Google Cloud Console must have EXACTLY the same URL
- Check for:
  - Trailing slashes
  - `http://` vs `https://`
  - Extra spaces
  - Wrong path

### Issue 2: Client ID/Secret Mismatch
**Symptom**: Error 400: invalid_request

**Fix**:
- Get Client ID from Google Cloud Console (the one with the backend redirect URI)
- Update Fly.io:
  ```powershell
  flyctl secrets set GOOGLE_CLIENT_ID="your-actual-client-id" --app tide-raider-backend
  flyctl secrets set GOOGLE_CLIENT_SECRET="your-actual-client-secret" --app tide-raider-backend
  ```
- Restart: `flyctl apps restart tide-raider-backend`

### Issue 3: App in Testing Mode
**Symptom**: "Access blocked" even though you're a test user

**Fix**:
- Go to OAuth consent screen
- Scroll to "Test users"
- Verify `taunhealy@gmail.com` is in the list
- If not, add it and wait 5-10 minutes

## Step 5: Quick Test

1. **Check backend logs** for the callback URL
2. **Compare** with Google Cloud Console redirect URI
3. **Verify** they match EXACTLY (character for character)
4. **Check** Client ID matches between Google Cloud Console and Fly.io
5. **Verify** you're in test users list (if app is in Testing mode)

## Step 6: Still Not Working?

If everything matches but it still doesn't work:

1. **Wait 10-15 minutes** after making changes (Google needs time to propagate)
2. **Clear browser cookies** for `accounts.google.com`
3. **Try incognito/private mode**
4. **Check if you have multiple OAuth clients** - make sure you're using the right one
5. **Try creating a new OAuth 2.0 Client ID** in Google Cloud Console and update Fly.io secrets

## Debug Checklist

- [ ] Backend logs show callback URL: `https://tide-raider-backend.fly.dev/api/auth/google/callback`
- [ ] Google Cloud Console has EXACTLY the same redirect URI
- [ ] Google Cloud Console has JavaScript origin: `https://www.tideraider.com`
- [ ] Client ID in Fly.io matches Google Cloud Console
- [ ] Client Secret in Fly.io matches Google Cloud Console
- [ ] OAuth consent screen is configured
- [ ] You're in test users list (if Testing mode)
- [ ] Waited 10-15 minutes after changes
- [ ] Cleared browser cookies

