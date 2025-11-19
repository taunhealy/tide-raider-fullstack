# Fix Docker "No Space Left on Device" Error

## Quick Fix: Free Up Docker Disk Space

### Option 1: Clean Up Docker (Recommended)

Run these commands to free up space:

```powershell
# Remove all stopped containers, unused networks, and dangling images
docker system prune -a --volumes

# This will free up significant space
```

### Option 2: Increase Docker Disk Size

1. Open **Docker Desktop**
2. Go to **Settings** → **Resources** → **Advanced**
3. Increase **Disk image size** (default is often 60GB)
4. Click **Apply & Restart**

### Option 3: Clean Up WSL2 Disk

```powershell
# Shutdown WSL
wsl --shutdown

# Optimize WSL2 disk
wsl --disk-compact
```

### Option 4: Check Your Disk Space

```powershell
# Check available disk space
Get-PSDrive C | Select-Object Used,Free,@{Name="FreeGB";Expression={[math]::Round($_.Free/1GB,2)}}
```

If you have less than 5GB free, free up Windows disk space first.

## After Freeing Space

1. Restart Docker Desktop
2. Try starting the database again:
   ```powershell
   cd backend
   npm run db:start
   ```

## Alternative: Use Hyper-V Backend

If disk space issues persist, switch Docker to Hyper-V backend (uses less disk space):

1. Docker Desktop → Settings → General
2. Uncheck "Use the WSL 2 based engine"
3. Apply & Restart

