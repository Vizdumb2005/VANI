# Deploy VAANI to Google Cloud Run (PowerShell)
# Prerequisites: Google Cloud SDK (gcloud) installed and authenticated.

param (
    [string]$ProjectId = "",
    [string]$Region = "asia-south1",
    [string]$ServiceName = "vaani-dpg"
)

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  VAANI: Deploying to Google Cloud Run ($Region)" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

if ($ProjectId -ne "") {
    gcloud config set project $ProjectId
}

Write-Host "Building and deploying container to Google Cloud Run..." -ForegroundColor Yellow
gcloud run deploy $ServiceName `
    --source . `
    --region $Region `
    --platform managed `
    --allow-unauthenticated `
    --memory 1Gi `
    --cpu 1 `
    --timeout 300 `
    --set-env-vars="GEMINI_API_KEY=$env:GEMINI_API_KEY"

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n[SUCCESS] VAANI is live on Google Cloud Run!" -ForegroundColor Green
    $ServiceUrl = gcloud run services describe $ServiceName --region $Region --format 'value(status.url)'
    Write-Host "Live URL: $ServiceUrl" -ForegroundColor Cyan
    Write-Host "Policy Cockpit: $ServiceUrl/" -ForegroundColor White
    Write-Host "OpenAPI 3.1 Swagger: $ServiceUrl/docs" -ForegroundColor White
} else {
    Write-Host "`n[ERROR] Deployment failed. Check gcloud credentials and permissions." -ForegroundColor Red
}
