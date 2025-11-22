# Check YAML Tab for Authentication

## Steps

1. **Click on the "YAML" tab**

2. **Look for these sections:**

   **Option A: Look for `run.googleapis.com/ingress` annotation:**
   ```yaml
   metadata:
     annotations:
       run.googleapis.com/ingress: all
   ```
   - If you see `ingress: all` → Service is already public
   - If you see `ingress: internal` → Service is private

   **Option B: Look for IAM bindings:**
   ```yaml
   spec:
     template:
       metadata:
         annotations:
           run.googleapis.com/ingress: all
   ```

3. **If you see `ingress: internal` or no ingress setting:**
   - The service is private
   - You need to change it to `all` or grant IAM access

## Alternative: Use IAM Directly

If the Security tab doesn't have the option, use IAM directly:

1. **Go to IAM & Admin:**
   https://console.cloud.google.com/iam-admin/iam?project=surf-445620

2. **Click "GRANT ACCESS"**

3. **In "New principals":**
   - Type: `allUsers`

4. **Select role:**
   - Choose: **"Cloud Run Invoker"** (`roles/run.invoker`)

5. **Click "SAVE"**

6. **If it asks which resource:**
   - Select: `tide-raider-backend` in `africa-south1`

## Or Use gcloud (If Installed)

```powershell
gcloud run services add-iam-policy-binding tide-raider-backend `
  --region=africa-south1 `
  --member="allUsers" `
  --role="roles/run.invoker" `
  --project=surf-445620
```

