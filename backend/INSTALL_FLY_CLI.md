# Installing Fly CLI on Windows

## ✅ Installation Complete!

The Fly CLI has been installed to: `C:\Users\taunh\.fly\bin\flyctl.exe`

## 🔧 Add to PATH (Optional but Recommended)

To use `fly` or `flyctl` commands without the full path, add it to your PATH:

### Option 1: Add to PATH for Current Session

```powershell
$env:PATH += ";C:\Users\taunh\.fly\bin"
```

### Option 2: Add to PATH Permanently

1. Open System Properties:
   - Press `Win + X` → System → Advanced system settings
   - Or search "Environment Variables" in Start menu

2. Edit PATH:
   - Click "Environment Variables"
   - Under "User variables", select "Path" → "Edit"
   - Click "New" → Add: `C:\Users\taunh\.fly\bin`
   - Click OK on all dialogs

3. Restart PowerShell/Terminal

### Option 3: Use Full Path

You can always use the full path:
```powershell
C:\Users\taunh\.fly\bin\flyctl.exe auth login
```

## 🚀 Next Steps

After adding to PATH (or restarting terminal), you can:

```powershell
# Login to Fly.io
flyctl auth login
# or just: fly auth login (if alias is set)

# Check if it works
flyctl version
```

## 📝 Note

Some systems may have `fly` as an alias for `flyctl`. If `fly` doesn't work, use `flyctl` instead.

