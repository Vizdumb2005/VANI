#!/usr/bin/env bash
# Deploy VAANI to Google Cloud Run (Linux/macOS)
set -euo pipefail

REGION="${REGION:-asia-south1}"
SERVICE_NAME="${SERVICE_NAME:-vaani-dpg}"

echo "=========================================================="
echo "  VAANI: Deploying to Google Cloud Run ($REGION)"
echo "=========================================================="

gcloud run deploy "$SERVICE_NAME" \
    --source . \
    --region "$REGION" \
    --platform managed \
    --allow-unauthenticated \
    --memory 1Gi \
    --cpu 1 \
    --timeout 300 \
    --set-env-vars="GEMINI_API_KEY=${GEMINI_API_KEY:-}"

SERVICE_URL=$(gcloud run services describe "$SERVICE_NAME" --region "$REGION" --format 'value(status.url)')
echo ""
echo "[SUCCESS] VAANI is live on Google Cloud Run!"
echo "Live URL: $SERVICE_URL"
echo "Policy Cockpit: $SERVICE_URL/"
echo "OpenAPI 3.1 Swagger: $SERVICE_URL/docs"
