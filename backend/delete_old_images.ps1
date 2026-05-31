$PROJECT_ID = "surf-445620"
$IMAGES = gcloud artifacts docker images list `
  europe-west1-docker.pkg.dev/$PROJECT_ID/tide-raider/tide-raider-backend `
  --project $PROJECT_ID `
  --format="value(package)" `
  --sort-by=~create_time

$IMAGES_TO_DELETE = $IMAGES | Select-Object -Skip 3
$COUNT = ($IMAGES_TO_DELETE | Measure-Object).Count

if ($COUNT -gt 0) {
    Write-Host "Deleting $COUNT old images..." -ForegroundColor Yellow
    foreach ($image in $IMAGES_TO_DELETE) {
        Write-Host "Deleting: $image"
        gcloud artifacts docker images delete $image --quiet --project $PROJECT_ID
    }
} else {
    Write-Host "No old images to delete." -ForegroundColor Green
}
