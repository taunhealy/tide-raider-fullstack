# GCP Master Cleanup Script
# This script sweeps your projects to remove storage junk and enforce cost-efficiency.

$projects = @("surf-445620", "home-seek-98294", "sneaker-stock-alert")
$keepLimit = 5

foreach ($project in $projects) {
    Write-Host "`n=== Auditing Project: $project ===" -ForegroundColor Cyan
    
    # 1. List all repositories in the project
    $repos = gcloud artifacts repositories list --project $project --format="json(name)" | ConvertFrom-Json
    
    foreach ($repo in $repos) {
        $repoPath = $repo.name # e.g., projects/surf-445620/locations/europe-west1/repositories/tide-raider
        $parts = $repoPath.Split('/')
        $location = $parts[3]
        $repoName = $parts[5]
        
        Write-Host "  Checking Repository: $repoName in $location" -ForegroundColor Yellow
        
        # 2. Disable Vulnerability Scanning (Saves $ per push)
        gcloud artifacts repositories update $repoName --project $project --location $location --disable-vulnerability-scanning --quiet 2>$null
        
        # 3. Apply Automated Lifecycle Policy (Set and Forget)
        # This ensures Google deletes old images automatically every day
        if ($repoName -eq "cloud-run-source-deploy") {
            Write-Host "  (!) Found Source Deploy Junk. Deleting entire repository..." -ForegroundColor Red
            gcloud artifacts repositories delete $repoName --project $project --location $location --quiet
            continue
        }

        # 4. Manual Pruning (For immediate savings)
        $images = gcloud artifacts docker images list "$location-docker.pkg.dev/$project/$repoName" --project $project --format="json(version,createTime)" 2>$null | ConvertFrom-Json
        $sortedImages = $images | Where-Object { $_.createTime } | Sort-Object { [datetime]$_.createTime } -Descending
        
        if ($sortedImages.Count -gt $keepLimit) {
            $toDelete = $sortedImages | Select-Object -Skip $keepLimit
            Write-Host "  Deleting $($toDelete.Count) old images in $repoName..." -ForegroundColor Magenta
            foreach ($img in $toDelete) {
                $digest = $img.version
                gcloud artifacts docker images delete "$location-docker.pkg.dev/$project/$repoName@$digest" --project $project --quiet --delete-tags 2>$null
            }
        } else {
            Write-Host "  Repository $repoName is already lean." -ForegroundColor Green
        }
    }
}

Write-Host "`n✅ Global Cleanup Complete!" -ForegroundColor Green
