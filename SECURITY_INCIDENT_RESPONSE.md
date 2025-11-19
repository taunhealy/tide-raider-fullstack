# Security Incident Response - Exposed Secrets

## 🚨 CRITICAL: Secrets Exposed in Git History

**Date:** 2025-11-19  
**Severity:** HIGH  
**Status:** Remediation in progress

## What Was Exposed

The following production secrets were committed to the GitHub repository:

1. **Database Password** - Production PostgreSQL credentials
   - Password: `CgTmIxiwjbinc22DO8GYUAV5`
   - Host: `pgbouncer.vmkq6098l4pr35ln.flympg.net`

2. **Google OAuth Credentials**
   - Client ID: `82632174665-tlmshrjeeahbb3giec045o009u8ag67j.apps.googleusercontent.com`
   - Client Secret: `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`

3. **JWT Secret (NEXTAUTH_SECRET)**
   - Secret: `gdfdsddsadsadghhhhsdsdsdansa`

## Immediate Actions Required

### 1. Rotate All Exposed Credentials ⚠️

**Database Password:**
```powershell
# Connect to Fly Postgres and change password
fly postgres connect -a your-postgres-app
# Then change password in PostgreSQL
ALTER USER "fly-user" WITH PASSWORD 'NEW_SECURE_PASSWORD';
# Update Fly secrets
fly secrets set DATABASE_URL="postgresql://fly-user:NEW_SECURE_PASSWORD@pgbouncer.vmkq6098l4pr35ln.flympg.net/fly-db" --app tide-raider-backend
```

**Google OAuth:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to APIs & Services → Credentials
3. Revoke the old OAuth Client Secret
4. Generate a new Client Secret
5. Update Fly secrets:
```powershell
fly secrets set GOOGLE_CLIENT_SECRET="NEW_CLIENT_SECRET" --app tide-raider-backend
```

**JWT Secret:**
```powershell
# Generate new secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Update in both Fly.io and Vercel
fly secrets set NEXTAUTH_SECRET="NEW_SECRET" --app tide-raider-backend
# Also update in Vercel environment variables
```

### 2. Remove Secrets from Git History

**Option A: Using git-filter-repo (Recommended)**

```powershell
# Install git-filter-repo if needed
pip install git-filter-repo

# Remove secrets from entire git history
git filter-repo --path backend/update-env-for-docker.ps1 --invert-paths
git filter-repo --path backend/QUICK_START_DOCKER.md --invert-paths
git filter-repo --path backend/DOCKER_SETUP.md --invert-paths
git filter-repo --path FLY_SECRETS_COMMANDS.txt --invert-paths
git filter-repo --path FLY_SECRETS_SINGLE_COMMAND.txt --invert-paths

# OR use BFG Repo-Cleaner (faster for large repos)
# Download from: https://rtyley.github.io/bfg-repo-cleaner/
java -jar bfg.jar --replace-text passwords.txt
```

**Option B: Force Push (⚠️ Only if you're the only contributor)**

```powershell
# After removing secrets from files
git add -A
git commit -m "Remove exposed secrets"
git push --force
```

**Option C: Contact GitHub Support**
- They can help remove secrets from history
- Use GitHub's secret scanning feature

### 3. Verify .gitignore is Correct

Ensure these files are in `.gitignore`:
```
.env
.env.local
.env.*.local
*.pem
```

### 4. Scan for Other Exposed Secrets

```powershell
# Use git-secrets or similar tool
npm install -g git-secrets
git secrets --install
git secrets --scan-history
```

## Files That Were Fixed

✅ `backend/update-env-for-docker.ps1` - Secrets replaced with placeholders  
✅ `backend/QUICK_START_DOCKER.md` - Secrets replaced with placeholders  
✅ `backend/DOCKER_SETUP.md` - Secrets replaced with placeholders  
✅ `FLY_SECRETS_COMMANDS.txt` - Secrets replaced with placeholders  
✅ `FLY_SECRETS_SINGLE_COMMAND.txt` - Secrets replaced with placeholders  

## Prevention

1. **Never commit secrets to git** - Always use environment variables
2. **Use secret management tools** - Fly.io secrets, Vercel env vars
3. **Enable pre-commit hooks** - Use `git-secrets` or similar
4. **Regular audits** - Use GitHub's secret scanning
5. **Use .env.example** - Template files with placeholders only

## Next Steps

1. ✅ Secrets removed from current files
2. ⏳ Rotate all exposed credentials
3. ⏳ Remove from git history
4. ⏳ Verify no other secrets exposed
5. ⏳ Set up secret scanning

## Resources

- [GitHub: Removing sensitive data](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)
- [Fly.io: Managing secrets](https://fly.io/docs/reference/secrets/)
- [OWASP: Secrets Management](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)

