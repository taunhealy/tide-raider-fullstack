$repo = "europe-west1-docker.pkg.dev/surf-445620/tide-raider/tide-raider-backend"
$keepLimit = 5

Write-Host "Fetching images from $repo..."
# Redirect stderr to null to avoid pollution, force UTF8 encoding for JSON
$jsonOutput = gcloud artifacts docker images list $repo --format="json(digest,tags,create_time)" 2>$null

if (-not $jsonOutput) {
    Write-Host "No images found or gcloud failed."
    exit
}

$images = $jsonOutput | ConvertFrom-Json

# Sort by create_time descending
$sortedImages = $images | Sort-Object { [datetime]$_.create_time } -Descending

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
    Write-Host "  $($img.create_time) - $($img.tags -join ', ')" -ForegroundColor Green
}

Write-Host "`nDeleting $($deleteImages.Count) old images..."
foreach ($img in $deleteImages) {
    $digest = $img.digest
    Write-Host "Deleting $digest ($($img.create_time))..."
    # Execute directly
    gcloud artifacts docker images delete "$repo@$digest" --quiet --delete-tags 2>$null
}

Write-Host "Cleanup complete."
