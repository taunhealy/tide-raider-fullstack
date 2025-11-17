# Google OAuth: Testing vs Production Mode

## Current Status: Testing Mode

If you see a "Publish app" button in the Google Cloud Console, your app is in **Testing** mode.

### What This Means

**Testing Mode:**
- ✅ Only test users can sign in
- ✅ No verification required
- ✅ Quick to set up
- ❌ Limited to 100 test users
- ❌ Only works for users you explicitly add

**Production Mode:**
- ✅ Anyone can sign in
- ✅ No user limit
- ❌ Requires app verification (can take days/weeks)
- ❌ Requires privacy policy and terms of service URLs
- ❌ May require additional security reviews

## Quick Fix: Add Test Users

If you want to keep Testing mode (recommended for now):

1. Go to **Google Cloud Console** → **APIs & Services** → **OAuth consent screen**
2. Scroll down to **"Test users"** section
3. Click **"Add Users"**
4. Add your email: `taunhealy@gmail.com`
5. Click **"Add"**
6. Click **"Save"** at the bottom

**Important:** After adding test users, wait 5-10 minutes for changes to propagate.

## Publishing to Production

If you want anyone to sign in (not just test users):

### Step 1: Complete Required Fields

1. Go to **OAuth consent screen**
2. Fill in all required fields:
   - **App name**: Your app name
   - **User support email**: Your email
   - **Developer contact information**: Your email
   - **Application home page**: `https://www.tideraider.com`
   - **Privacy policy link**: **REQUIRED** - Must be a valid URL
   - **Terms of service link**: **REQUIRED** - Must be a valid URL

### Step 2: Add Scopes

1. Click **"Add or Remove Scopes"**
2. Ensure these scopes are added:
   - `.../auth/userinfo.email`
   - `.../auth/userinfo.profile`
3. Click **"Update"** then **"Save and Continue"**

### Step 3: Publish

1. Click **"Publish App"** button
2. Confirm the action
3. Your app will be in **"In production"** status

### Step 4: Verification (May Be Required)

If Google flags your app for verification:
- You'll need to provide additional information
- May require a security review
- Can take several days to weeks
- You'll receive email updates on the status

## Recommendation

**For now, stay in Testing mode and add test users:**
- ✅ Faster setup
- ✅ No verification needed
- ✅ Works immediately
- ✅ Can publish later when ready

**When to publish:**
- When you're ready for public access
- When you have privacy policy and terms of service URLs
- When you're ready to go through verification if needed

## Current Action Required

1. **Add yourself as a test user** (if not already added)
2. **Wait 5-10 minutes** for changes to propagate
3. **Clear browser cookies** for `accounts.google.com`
4. **Try signing in again**

This should resolve the "Access blocked" error immediately.

