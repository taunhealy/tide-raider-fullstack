# Fix Docker WSL2 Block Device Error

The error `preparing block device /dev/sde: running mkfs: exit status 1` indicates Docker Desktop's WSL2 backend is corrupted.

## Solution 1: Reset WSL2 and Docker (Recommended)

### Step 1: Shutdown WSL
```powershell
wsl --shutdown
```

### Step 2: Restart Docker Desktop
- Close Docker Desktop completely
- Wait 10 seconds
- Restart Docker Desktop
- Wait for it to fully initialize

### Step 3: If still failing, reset Docker's WSL distribution
```powershell
# List WSL distributions
wsl --list --verbose

# Unregister Docker's WSL distribution (if it exists)
wsl --unregister docker-desktop
wsl --unregister docker-desktop-data

# Restart Docker Desktop (it will recreate them)
```

## Solution 2: Use Hyper-V Backend Instead (Alternative)

If WSL2 keeps failing, switch Docker Desktop to use Hyper-V:

1. Open Docker Desktop
2. Go to **Settings** → **General**
3. Uncheck **"Use the WSL 2 based engine"**
4. Click **"Apply & Restart"**
5. Wait for Docker to restart

## Solution 3: Clean Reinstall Docker Desktop

If nothing works:

1. **Uninstall Docker Desktop**
   - Settings → Apps → Docker Desktop → Uninstall

2. **Clean up WSL distributions**
   ```powershell
   wsl --unregister docker-desktop
   wsl --unregister docker-desktop-data
   ```

3. **Reinstall Docker Desktop**
   - Download from: https://www.docker.com/products/docker-desktop
   - Install fresh

## Solution 4: Use Different Port (Quick Workaround)

If you need to work immediately, change the Docker Postgres port:

1. Edit `docker-compose.yml`:
   ```yaml
   ports:
     - "5433:5432"  # Use 5433 instead
   ```

2. Update `.env`:
   ```env
   DATABASE_URL="postgresql://tide_raider:tide_raider_dev@localhost:5433/tide_raider_dev?schema=public"
   ```

3. Start: `npm run db:start`

## Recommended Order

1. Try **Solution 1** first (WSL shutdown + Docker restart)
2. If that fails, try **Solution 2** (switch to Hyper-V)
3. If still failing, use **Solution 4** (different port) as temporary workaround
4. Last resort: **Solution 3** (clean reinstall)

