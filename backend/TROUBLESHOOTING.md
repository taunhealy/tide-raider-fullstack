# Troubleshooting Backend Connection Issues

## Issue: "Unable to connect to the remote server"

If you see the server start message but can't connect, try these solutions:

### 1. Check if Server is Actually Running

**PowerShell:**
```powershell
# Check if port 3001 is listening
netstat -ano | findstr :3001

# Look for LISTENING state (not TIME_WAIT)
```

**What to look for:**
- `LISTENING` = Server is running ✅
- `TIME_WAIT` = Server stopped/crashed ❌
- Nothing = Server never started ❌

### 2. Check for Startup Errors

Look at the terminal where you ran `npm run dev`. Check for:
- ❌ Import errors
- ❌ Prisma client not generated
- ❌ Missing environment variables
- ❌ Database connection errors

### 3. Common Fixes

**Fix 1: Generate Prisma Client**
```powershell
cd backend
npm run prisma:generate
npm run dev
```

**Fix 2: Check for Import Errors**
```powershell
cd backend
npm run build
# This will show TypeScript errors
```

**Fix 3: Check Environment Variables**
```powershell
# Make sure .env file exists
cd backend
if (Test-Path .env) {
    Write-Host "✅ .env exists"
} else {
    Write-Host "❌ Create .env file from .env.example"
}
```

**Fix 4: Try Different Port**
If port 3001 is in use:
```powershell
# In backend/.env
PORT=3002

# Then test
Invoke-RestMethod -Uri http://localhost:3002/health
```

### 4. Test with PowerShell Script

```powershell
cd backend
.\test-health.ps1
```

This will give you detailed error messages.

### 5. Check Server Logs

The server should show:
```
🚀 Backend server running on port 3001
📡 Environment: development
🌐 Server accessible at http://localhost:3001
```

If you don't see all three lines, the server may have crashed after starting.

### 6. Verify Server Binding

The server now binds to `0.0.0.0` which means it listens on all network interfaces. This should fix IPv6/IPv4 issues.

### 7. Test with Browser

Sometimes PowerShell's `curl` alias has issues. Try:
1. Open browser
2. Go to: `http://localhost:3001/health`
3. Should see: `{"status":"ok","timestamp":"..."}`

### 8. Check Firewall

Windows Firewall might be blocking:
```powershell
# Check firewall status
Get-NetFirewallProfile | Select-Object Name, Enabled
```

If needed, allow Node.js through firewall.

## Still Not Working?

1. **Kill any existing processes:**
   ```powershell
   # Find Node processes
   Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
   ```

2. **Clean and restart:**
   ```powershell
   cd backend
   Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
   npm install
   npm run prisma:generate
   npm run dev
   ```

3. **Check for port conflicts:**
   ```powershell
   # See what's using port 3001
   netstat -ano | findstr :3001
   ```

