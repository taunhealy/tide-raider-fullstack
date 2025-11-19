# Fix Docker I/O Error

The error `input/output error` when creating a container usually means Docker Desktop needs attention.

## Quick Fixes (Try in order):

### 1. Restart Docker Desktop
- Right-click Docker Desktop icon in system tray
- Click "Restart Docker Desktop"
- Wait for it to fully restart
- Try again: `npm run db:start`

### 2. Clean Docker System
```powershell
# Clean up Docker
docker system prune -a --volumes

# Then try again
npm run db:start
```

### 3. Check Disk Space
```powershell
# Check available disk space
Get-PSDrive C
```

If disk space is low (< 5GB free), free up space.

### 4. Reset Docker Desktop (Last Resort)
- Open Docker Desktop
- Settings → Troubleshoot → Clean / Purge data
- Restart Docker Desktop
- Try again

### 5. Check WSL2 (If using WSL2 backend)
```powershell
wsl --list --verbose
wsl --shutdown
# Restart Docker Desktop
```

## After Fixing:

Once Docker is working, run:
```powershell
npm run db:start
npm run prisma:migrate
```

