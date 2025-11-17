# Verify OAuth Setup - Quick Checklist

## Issue Identified

You have **multiple redirect URIs** configured, which suggests you might have:
1. A NextAuth.js setup (frontend): `https://www.tideraider.com/api/auth/callback/google`
2. A backend Passport.js setup: `https://tide-raider-backend.fly.dev/api/auth/google/callback`

**These are DIFFERENT OAuth clients!** Make sure you're using the correct Client ID/Secret for the backend.

## Step 1: Verify Which OAuth Client You're Using

Your backend uses Passport.js and expects:
- **Redirect URI**: `https://tide-raider-backend.fly.dev/api/auth/google/callback` ✅ (You have this)
- **JavaScript Origin**: `https://www.tideraider.com` ✅ (You have this)

## Step 2: Check Your OAuth Client ID in Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **Credentials**
3. Find the OAuth 2.0 Client ID that has this redirect URI:
   - `https://tide-raider-backend.fly.dev/api/auth/google/callback`
4. **Copy the Client ID** (it looks like: `123456789-abcdefghijklmnop.apps.googleusercontent.com`)

## Step 3: Verify Fly.io Secrets Match

Check that the Client ID in Fly.io matches the one from Step 2:

```powershell
flyctl secrets list --app tide-raider-backend
```

Look for:
- `GOOGLE_CLIENT_ID` - Should match the Client ID from Google Cloud Console
- `GOOGLE_CLIENT_SECRET` - Should match the Client Secret from Google Cloud Console

## Step 4: OAuth Consent Screen Configuration

The "Access blocked" error usually means the OAuth consent screen isn't configured correctly.

### Go to: APIs & Services → OAuth consent screen

**Required Settings:**

1. **User Type**: 
   - If using Google Workspace: Choose "Internal"
   - If public app: Choose "External"

2. **App information**:
   - App name: "Tide Raider" or "Surf Wiz"
   - User support email: Your email
   - App logo: (optional)
   - Application home page: `https://www.tideraider.com`
   - Privacy policy link: (required for external apps)
   - Terms of service link: (required for external apps)

3. **Scopes**:
   - Click "Add or Remove Scopes"
   - Ensure these are added:
     - `.../auth/userinfo.email`
     - `.../auth/userinfo.profile`
   - Click "Update" then "Save and Continue"

4. **Test users** (if app is in Testing mode):
   - Click "Add Users"
   - Add: `taunhealy@gmail.com`
   - Click "Add"
   - Click "Save and Continue"

5. **Summary**:
   - Review everything
   - Click "Back to Dashboard"

## Step 5: Publishing Status

If your app is **External** and in **Testing** mode:
- Only test users can sign in
- Make sure `taunhealy@gmail.com` is in the test users list

If you want anyone to sign in:
- You need to submit for verification (requires privacy policy and terms of service)

## Step 6: Clean Up Unused Redirect URIs (Optional)

You can remove redirect URIs you're not using to avoid confusion:
- Keep: `https://tide-raider-backend.fly.dev/api/auth/google/callback` (backend)
- Keep: `http://localhost:3001/api/auth/google/callback` (local dev)
- You can remove the NextAuth ones if you're not using NextAuth for OAuth

## Step 7: Test Again

After making changes:
1. **Wait 5-10 minutes** for Google to propagate
2. **Clear browser cookies** for `accounts.google.com`
3. **Try signing in again** from `https://www.tideraider.com`

## Quick Verification Commands

```powershell
# Check Fly.io secrets
flyctl secrets list --app tide-raider-backend

# Check backend logs when you try to sign in
flyctl logs --app tide-raider-backend --follow

# You should see:
# [auth] 📍 Callback URL: https://tide-raider-backend.fly.dev/api/auth/google/callback
# [auth] 🔑 Client ID: 123456789-...
```

## Most Common Issue

**The Client ID/Secret in Fly.io doesn't match the OAuth client in Google Cloud Console.**

To fix:
1. Get the correct Client ID/Secret from Google Cloud Console (the one with the backend redirect URI)
2. Update Fly.io secrets:
   ```powershell
   flyctl secrets set GOOGLE_CLIENT_ID="your-client-id" --app tide-raider-backend
   flyctl secrets set GOOGLE_CLIENT_SECRET="your-client-secret" --app tide-raider-backend
   ```
3. The app will automatically restart and use the new credentials

