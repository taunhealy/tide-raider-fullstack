# How to Allow Unauthenticated Invocations in Cloud Run

## The Setting is NOT in the Edit/Deploy Page

The "Allow unauthenticated invocations" setting is **NOT** in the "Edit & Deploy New Revision" page. It's in the **main service page**.

## Step-by-Step Instructions

### Method 1: Via Service Page (Easiest)

1. **Go to Cloud Run Console:**
   https://console.cloud.google.com/run?project=surf-445620

2. **Click on "tide-raider-backend"** service (in the list, NOT "Edit")

3. **Look for the "PERMISSIONS" tab** (at the top, next to "REVISIONS", "METRICS", etc.)

4. **Click "PERMISSIONS" tab**

5. **Click "GRANT ACCESS"** button (or "ADD PRINCIPAL")

6. **In the "New principals" field:**

   - Type: `allUsers`
   - Or select: **"allUsers"** from the dropdown

7. **Select role:**

   - Choose: **"Cloud Run Invoker"** (`roles/run.invoker`)

8. **Click "SAVE"**

9. **Confirm** when prompted (it will warn you about making the service public)

### Method 2: Via IAM & Admin (Alternative)

1. **Go to IAM & Admin:**
   https://console.cloud.google.com/iam-admin/iam?project=surf-445620

2. **Click "GRANT ACCESS"** (top of page)

3. **In "New principals":**

   - Type: `allUsers`

4. **Select role:**

   - Choose: **"Cloud Run Invoker"**

5. **Click "SAVE"**

6. **If prompted, select the service:**
   - Choose: `tide-raider-backend` in `africa-south1`

### Method 3: Via gcloud CLI (If you install it)

```powershell
gcloud run services add-iam-policy-binding tide-raider-backend `
  --region=africa-south1 `
  --member="allUsers" `
  --role="roles/run.invoker" `
  --project=surf-445620
```

## What This Does

- ✅ Makes your Cloud Run service publicly accessible
- ✅ Allows anyone to call the API endpoints
- ✅ Your backend still has authentication for protected routes (JWT tokens)
- ✅ CORS protection still applies (only your frontend domain can call it)

## After Granting Access

Test the health endpoint:

```powershell
curl https://tide-raider-backend-82632174665.africa-south1.run.app/health
```

Should return: `{"status":"ok","timestamp":"..."}`

## Note

The "Security" tab in the Edit page is for:

- Service accounts
- Encryption keys
- NOT for authentication settings

The authentication setting is in **IAM/Permissions**, not in the deployment configuration.
