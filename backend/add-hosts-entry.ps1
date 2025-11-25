# add-hosts-entry.ps1
# This script adds a temporary hosts file entry for Supabase
# Run as Administrator

$hostsPath = "C:\Windows\System32\drivers\etc\hosts"
$hostname = "db.pffssccmdbopnlgjdhwh.supabase.co"

Write-Host "This script needs to run as Administrator to modify the hosts file."
Write-Host ""
Write-Host "Steps to manually add the hosts entry:"
Write-Host "1. Right-click Notepad and select 'Run as administrator'"
Write-Host "2. Open: C:\Windows\System32\drivers\etc\hosts"
Write-Host "3. Add this line at the end:"
Write-Host ""
Write-Host "   34.102.123.62  db.pffssccmdbopnlgjdhwh.supabase.co"
Write-Host ""
Write-Host "4. Save and close"
Write-Host "5. Run: ipconfig /flushdns"
Write-Host "6. Run: node test-db.js"
Write-Host ""
Write-Host "Or try using the pooler connection instead (port 6543)"
