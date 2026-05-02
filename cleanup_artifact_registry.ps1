$repo = "africa-south1-docker.pkg.dev/surf-445620/tide-raider/tide-raider-backend"
$keepLimit = 5

Write-Host "Fetching images from $repo..."
# Use correct field names: version (digest), tags, createTime
$jsonOutput = gcloud artifacts docker images list $repo --format="json(version,tags,createTime)" 2>$null

if (-not $jsonOutput) {
    Write-Host "No images found or gcloud failed."
    exit
}

$images = $jsonOutput | ConvertFrom-Json

# Sort by createTime descending
$sortedImages = $images | Where-Object { $_.createTime } | Sort-Object { [datetime]$_.createTime } -Descending

Write-Host "Found $($sortedImages.Count) images."

if ($sortedImages.Count -le $keepLimit) {
    Write-Host "Image count ($($sortedImages.Count)) is within limit ($keepLimit). No cleanup needed."
    exit
}

# Keep the first $keepLimit images
$keepImages = $sortedImages | Select-Object -First $keepLimit
$deleteImages = $sortedImages | Select-Object -Skip $keepLimit

Write-Host "Keeping $($keepImages.Count) latest images:"
foreach ($img in $keepImages) {
    $tags = if ($img.tags) { $img.tags -join ', ' } else { "<no tags>" }
    Write-Host "  $($img.createTime) - $tags" -ForegroundColor Green
}

Write-Host "`nDeleting $($deleteImages.Count) old images..."
foreach ($img in $deleteImages) {
    $digest = $img.version
    Write-Host "Deleting $digest ($($img.createTime))..."
    # Execute directly
    gcloud artifacts docker images delete "$repo@$digest" --quiet --delete-tags 2>$null
}

Write-Host "Cleanup complete."
