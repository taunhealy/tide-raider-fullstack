# Reducing Artifact Registry Costs (May 2026 Update)

Artifact Registry is costing ~$18/month because it is storing ~275 GB of data across Europe, Africa, and the US.

## Current Storage Breakdown

| Repository | Location | Size | Status |
| :--- | :--- | :--- | :--- |
| `tide-raider` | `europe-west1` | **146 GB** | **ACTIVE** |
| `tide-raider` | `africa-south1` | 53 GB | Redundant |
| `cloud-run-source-deploy` | `africa-south1` | 35 GB | System Junk |
| `cloud-run-source-deploy` | `europe-west1` | 26 GB | System Junk |
| `tide-raider` | `us-central1` | 16 GB | Redundant |

## Solutions Implemented

1. **Aggressive Cleanup Policies**: I have applied the `cleanup-policies.json` to ALL repositories. This will automatically:
   - Keep only the **5 latest versions**.
   - Delete untagged images older than **7 days**.
   - Delete all images older than **30 days**.

2. **Vulnerability Scanning**: Verified as **DISABLED** in Europe to save on per-scan costs.

## Recommended "Africa First" Strategy

To reduce costs to near-zero and improve performance for South African users:

### Step 1: Migrate to Africa
1. Deploy the backend to `africa-south1`:
   ```bash
   gcloud run deploy tide-raider-backend --region africa-south1 --image europe-west1-docker.pkg.dev/surf-445620/tide-raider/tide-raider-backend:latest
   ```
2. Update Vercel `NEXT_PUBLIC_API_URL` to the new `.af.a.run.app` URL.

### Step 2: Delete Redundant Regions
Once verified, delete everything outside Africa:
```bash
# Delete Europe repository
gcloud artifacts repositories delete tide-raider --location=europe-west1 --quiet

# Delete US repository
gcloud artifacts repositories delete tide-raider --location=us-central1 --quiet

# Delete source deploy junk
gcloud artifacts repositories delete cloud-run-source-deploy --location=africa-south1 --quiet
gcloud artifacts repositories delete cloud-run-source-deploy --location=europe-west1 --quiet
```

## Dockerfile Optimization
The current image is 2GB. We can reduce this by:
1. Using multi-stage builds more effectively.
2. Only copying the `dist` and production `node_modules` to the final stage.
3. Avoiding `npx playwright install` in the final image if possible (use a pre-built playwright image).

Currently, the image size is large because `node_modules` and `pw-browsers` are being copied from the build stage which includes devDependencies.
