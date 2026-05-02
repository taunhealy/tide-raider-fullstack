# Migration Plan: Move to Europe West (`europe-west1`)

We are migrating the Tide Raider backend from South Africa (`africa-south1`) to Europe West (`europe-west1`) to resolve deployment issues and potentially improve reliability.

## 1. Completed Changes

- ✅ **Update Cloud Build**: Modified `cloudbuild.yaml` to set `europe-west1` as the default region.
- ✅ **Consolidate API URL Logic**: Updated `next/app/lib/backend-api.ts` to use the centralized `getBackendUrl` from `api-config.ts`. This ensures we only have one place to change the backend URL in the future.

## 2. Deployment Steps

✅ **Step A: Deploy to Europe West**
Completed successfully via Cloud Build.

✅ **Step B: Verify the Service URL**
Verified: `https://tide-raider-backend-82632174665.europe-west1.run.app`
Status: 🚀 LIVE

## 3. Cleanup: Remove South African Deployment

✅ **Step A: Delete Cloud Run Service**
Deleted service `tide-raider-backend` from `africa-south1`.

✅ **Step B: Delete Artifact Registry Images**
Deleted repository `tide-raider` from `africa-south1` (saved ~12.4 GB of storage).

## 4. Final Verification

1. **Vercel Update**: ⚠️ **ACTION REQUIRED**: Update `NEXT_PUBLIC_API_URL` to `https://tide-raider-backend-82632174665.europe-west1.run.app` in Vercel.
2. ✅ **Health Check**: Verified at `https://tide-raider-backend-82632174665.europe-west1.run.app/health`.
3. ✅ **Frontend Check**: Backend is responding correctly.
