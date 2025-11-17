# Debug OAuth When Already a Test User

If you're already a test user but still getting "Access blocked", check these:

## 1. Backend Not Restarted After Code Changes

The `GoogleStrategy` is initialized when the server starts. If you added secrets or changed code, the server needs to restart.

**Fix:**
```powershell
cd backend
flyctl deploy
```

Or restart:
```powershell
flyctl apps restart tide-raider-backend
```

## 2. Check Backend Logs

When you try to sign in, check what callback URL is being used:

```powershell
flyctl logs --app tide-raider-backend --follow
```

Look for:
- `[auth] 📍 Callback URL: ...` - Should be `https://tide-raider-backend.fly.dev/api/auth/google/callback`
- `[auth] 🔑 Client ID: ...` - Should match Google Cloud Console

## 3. Verify Secrets Are Set

Check that secrets are actually set in Fly.io:

```powershell
flyctl secrets list --app tide-raider-backend
```

Must have:
- `GOOGLE_CLIENT_ID` - Must match Google Cloud Console
- `GOOGLE_CLIENT_SECRET` - Must match Google Cloud Console
- `BACKEND_URL` - Should be `https://tide-raider-backend.fly.dev`
- `FRONTEND_URL` - Should be `https://www.tideraider.com`

## 4. Verify Callback URL Matches Exactly

In Google Cloud Console → Credentials → Your OAuth Client:

**Authorized redirect URIs** must have EXACTLY:
```
https://tide-raider-backend.fly.dev/api/auth/google/callback
```

Check for:
- ✅ No trailing slash
- ✅ Exact path: `/api/auth/google/callback`
- ✅ `https://` not `http://`
- ✅ No extra spaces or characters

## 5. Clear Browser State

Sometimes Google caches the error. Try:
1. Clear cookies for `accounts.google.com`
2. Use incognito/private mode
3. Try a different browser

## 6. Check OAuth Consent Screen Status

Go to **OAuth consent screen** and verify:
- Status shows "Testing" (not "In production")
- Your email is in the test users list
- Scopes are added: `userinfo.email` and `userinfo.profile`

## 7. Most Common Issue: Client ID Mismatch

The Client ID/Secret in Fly.io must match the OAuth client in Google Cloud Console.

**To verify:**
1. In Google Cloud Console, find the OAuth client that has the redirect URI: `https://tide-raider-backend.fly.dev/api/auth/google/callback`
2. Copy the Client ID
3. Check Fly.io secrets: `flyctl secrets list --app tide-raider-backend`
4. They must match exactly

**If they don't match:**
```powershell
flyctl secrets set GOOGLE_CLIENT_ID="your-actual-client-id" --app tide-raider-backend
flyctl secrets set GOOGLE_CLIENT_SECRET="your-actual-client-secret" --app tide-raider-backend
flyctl apps restart tide-raider-backend
```

## 8. Check the Exact Error Message

The error message from Google sometimes gives clues:
- "invalid_request" = Usually redirect URI mismatch
- "access_denied" = User denied access (but you're clicking through)
- "unauthorized_client" = Client ID/Secret mismatch

## Quick Debug Steps

1. **Restart backend**: `flyctl apps restart tide-raider-backend`
2. **Check logs**: `flyctl logs --app tide-raider-backend --follow`
3. **Try signing in** and watch the logs
4. **Verify callback URL** in logs matches Google Cloud Console exactly
5. **Verify Client ID** in logs matches Google Cloud Console

## Still Not Working?

If none of the above works, the issue might be:
- Google's OAuth consent screen needs to be republished (even in testing mode)
- There's a delay in Google's systems (wait 10-15 minutes)
- The OAuth client was created incorrectly

Try creating a new OAuth 2.0 Client ID in Google Cloud Console and updating Fly.io secrets with the new credentials.

