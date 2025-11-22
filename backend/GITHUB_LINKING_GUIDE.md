# Linking GitHub to Cloud Run

This guide explains how to set up automatic deployments from GitHub to Google Cloud Run.

## Option 1: Link GitHub Repo in Cloud Run UI (Easiest)

### Steps:

1. **Go to Cloud Run Console**
   - Navigate to [Cloud Run](https://console.cloud.google.com/run)
   - Select your project
   - Click **"Create Service"** (or edit existing)

2. **Deploy from Source**
   - Select **"Deploy from source repository"** or **"Continuously deploy new revisions"**
   - Click **"Connect Repository"**

3. **Connect GitHub**
   - Choose **GitHub** as the source
   - Authorize Google Cloud to access your GitHub account
   - Select your repository: `tide-raider-fullstack`
   - Select branch: `main` (or your default branch)

4. **Configure Build Settings**
   - **Service name**: `tide-raider-backend`
   - **Region**: `us-central1`
   - **Authentication**: Allow unauthenticated invocations
   - **Build type**: **Dockerfile**
   - **Dockerfile location**: `backend/Dockerfile`
   - **Build context**: `backend/` (important!)
   - **Port**: `8080` (or use PORT env var)

5. **Set Environment Variables**
   - Add these environment variables:
     - `NODE_ENV` = `production`
     - `PORT` = `8080`

6. **Configure Secrets**
   - Go to **"Variables and Secrets"** tab
   - Under **"Secrets"**, add references to your secrets:
     - `DATABASE_URL` → Select secret `DATABASE_URL:latest`
     - `GOOGLE_CLIENT_ID` → Select secret `GOOGLE_CLIENT_ID:latest`
     - `GOOGLE_CLIENT_SECRET` → Select secret `GOOGLE_CLIENT_SECRET:latest`
     - `JWT_SECRET` → Select secret `JWT_SECRET:latest`
     - `NEXTAUTH_SECRET` → Select secret `NEXTAUTH_SECRET:latest`
     - `FRONTEND_URL` → Select secret `FRONTEND_URL:latest`

7. **Set Resource Limits**
   - **Memory**: 512 MiB
   - **CPU**: 1
   - **Timeout**: 300 seconds
   - **Max instances**: 10
   - **Min instances**: 0 (for cost savings)

8. **Click "Create"** or **"Deploy"**

### Result:

✅ Every push to `main` branch will automatically:
- Build the Docker image from `backend/Dockerfile`
- Deploy to Cloud Run
- Update your service with the new revision

## Option 2: Use Cloud Build Triggers (More Control)

This option uses your `cloudbuild.yaml` file and gives you more control.

### Steps:

1. **Enable Cloud Build API**
   ```bash
   gcloud services enable cloudbuild.googleapis.com
   ```

2. **Connect GitHub Repository**
   ```bash
   # This opens a browser to connect GitHub
   gcloud builds triggers create github \
     --name="deploy-tide-raider-backend" \
     --repo-name="tide-raider-fullstack" \
     --repo-owner="YOUR_GITHUB_USERNAME" \
     --branch-pattern="^main$" \
     --build-config="backend/cloudbuild.yaml" \
     --substitutions="_REGION=us-central1,_SERVICE_NAME=tide-raider-backend"
   ```

   Replace `YOUR_GITHUB_USERNAME` with your actual GitHub username.

3. **Test the Trigger**
   ```bash
   # Test by manually running the trigger
   gcloud builds triggers run deploy-tide-raider-backend \
     --branch=main
   ```

### Result:

✅ Every push to `main` branch will:
- Use your `cloudbuild.yaml` configuration
- Build and push Docker image to Artifact Registry
- Deploy to Cloud Run with your exact configuration

## Which Option Should You Choose?

### Choose Option 1 (Link GitHub) if:
- ✅ You want the simplest setup
- ✅ You want to get started quickly
- ✅ You're okay with Cloud Run's default build process
- ✅ You prefer UI-based configuration

### Choose Option 2 (Cloud Build Triggers) if:
- ✅ You want more control over the build process
- ✅ You want to use the `cloudbuild.yaml` file we created
- ✅ You prefer command-line configuration
- ✅ You want to customize build steps

## Important Notes

### Build Context

When linking GitHub, make sure the **build context** is set to `backend/` (not the root directory), because:
- Your `Dockerfile` is in the `backend/` directory
- The Dockerfile expects to find `package.json`, `prisma/`, and `src/` relative to the build context

### Dockerfile Location

Set **Dockerfile location** to `backend/Dockerfile` or just `Dockerfile` (if build context is `backend/`).

### Secrets Must Exist First

Before linking GitHub, make sure you've created all secrets in Google Secret Manager:
- `DATABASE_URL`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `JWT_SECRET`
- `NEXTAUTH_SECRET`
- `FRONTEND_URL`

See `DEPLOY_TO_CLOUD_RUN.md` Step 3 for creating secrets.

## Troubleshooting

### Build Fails: "Cannot find Dockerfile"
- Make sure build context is `backend/`
- Make sure Dockerfile location is correct (relative to build context)

### Build Fails: "Cannot find package.json"
- Check that build context includes the `backend/` directory
- Verify your repository structure matches the build context

### Deployment Succeeds but Service Fails
- Check Cloud Run logs: `gcloud run services logs read tide-raider-backend --region us-central1`
- Verify secrets are correctly referenced
- Check that `PORT` environment variable is set to `8080`

## Switching Between Options

You can always switch:
- If you started with Option 1, you can later set up Option 2
- If you started with Option 2, you can still use Option 1 for manual deployments
- Both methods deploy to the same Cloud Run service

## Next Steps

After linking GitHub:
1. ✅ Push a test commit to trigger deployment
2. ✅ Verify deployment in Cloud Run console
3. ✅ Test your API endpoint
4. ✅ Set up monitoring and alerts


