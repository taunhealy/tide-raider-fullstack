$ErrorActionPreference = "Stop"
try {
    $PROJECT_ID = gcloud config get-value project
    Write-Host "Project ID: $PROJECT_ID"
    $REPO = "europe-west1-docker.pkg.dev/$PROJECT_ID/tide-raider/tide-raider-backend"
    
    Write-Host "Fetching images from $REPO..."
    $IMAGES = gcloud artifacts docker images list $REPO --format="value(package)" --sort-by=~create_time
    
    # Ensure $IMAGES is an array even if 1 or 0 items
    if ($IMAGES -is [string]) { $IMAGES = @($IMAGES) }
    if ($null -eq $IMAGES) { $IMAGES = @() }

    $COUNT = $IMAGES.Count
    Write-Host "Total images found: $COUNT"

    if ($COUNT -le 5) {
        Write-Host "Less than 5 images found. No cleanup needed."
        exit
    }

    $IMAGES_TO_DELETE = $IMAGES | Select-Object -Skip 5
    # Force array again if Select-Object returns single item
    if ($IMAGES_TO_DELETE -is [string]) { $IMAGES_TO_DELETE = @($IMAGES_TO_DELETE) }
    
    $DELETE_COUNT = $IMAGES_TO_DELETE.Count
    Write-Host "Deleting $DELETE_COUNT old images (keeping top 5)..."

    foreach ($image in $IMAGES_TO_DELETE) {
        if (-not [string]::IsNullOrWhiteSpace($image)) {
            Write-Host "Deleting: $image"
            gcloud artifacts docker images delete $image --quiet
        }
    }
    Write-Host "Cleanup complete."
} catch {
    Write-Error $_
    exit 1
}
