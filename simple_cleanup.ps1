$repo = "europe-west1-docker.pkg.dev/surf-445620/tide-raider/tide-raider-backend"
Write-Host "Fetching image list..."
$images = gcloud artifacts docker images list $repo --format="value(digest)" --sort-by=~create_time --limit=100
if ($images.Count -eq 0) { Write-Host "No images found."; exit }

# Keep the first 3 (latest)
$keepCount = 3
if ($images.Count -le $keepCount) {
    Write-Host "Only $($images.Count) images found. Keeping all."
    exit
}

$imagesToDelete = $images | Select-Object -Skip $keepCount
Write-Host "Found $($images.Count) images. Keeping $keepCount. Deleting $($imagesToDelete.Count)..."

foreach ($digest in $imagesToDelete) {
    if (-not $digest) { continue }
    Write-Host "Deleting $digest..."
    gcloud artifacts docker images delete "$repo@$digest" --quiet --delete-tags 2>$null
}
Write-Host "Cleanup Complete!"
