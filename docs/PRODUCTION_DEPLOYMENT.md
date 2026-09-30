# VAANI production deployment runbook

This release uses Cloud Run as the authoritative compute target, Firestore as the operational source of truth, BigQuery as the analytical projection, Pub/Sub for event delivery, Vertex AI for Gemini, and GitLab OIDC + Cloud Build for delivery. GKE is intentionally not the live target in this release.

## Runtime contract

- Public viewers may read dashboard, signals, priorities, health, and policy views.
- CPGRAMS dispatch requires a verified Google ID token and an allowlisted operator email/domain.
- `POST /requests` is a citizen intake endpoint. It is bounded by payload limits and is retry-safe when the caller supplies `Idempotency-Key`.
- Firestore owns request state, idempotency keys, and audit events.
- BigQuery failures are reported as `analytics_persisted: false`; a local JSONL file is never used as production durability.
- Gemini uses Vertex AI ADC with the configured project and location. The deterministic simulator is only for development/test environments.

## One-time GCP setup

Use the intended project explicitly; do not rely on the repository default if it is not yours.

```powershell
$env:GCP_PROJECT_ID = "vaani-sovereign-dpi"
gcloud auth application-default login
gcloud config set project $env:GCP_PROJECT_ID
```

Create Secret Manager containers and add values from files outside the repository. Never commit the files or put their contents in Terraform variables/state.

```powershell
$secrets = @(
  "vaani-hmac-salt",
  "vaani-whatsapp-app-secret",
  "vaani-whatsapp-verify-token",
  "vaani-telegram-bot-secret",
  "vaani-rapidpro-api-token",
  "vaani-twilio-auth-token"
)
foreach ($name in $secrets) {
  gcloud secrets describe $name 2>$null
  if ($LASTEXITCODE -ne 0) { gcloud secrets create $name --replication-policy=automatic }
}
# Example: the source file must remain outside this checkout.
# gcloud secrets versions add vaani-hmac-salt --data-file=C:\secure\vaani-hmac-salt.txt
```

Create a Google OAuth web client and record its client ID. Configure the deployed frontend origin in the OAuth consent screen and authorized JavaScript origins. Set the same client ID in `google_oauth_client_id` for Terraform and `NEXT_PUBLIC_GOOGLE_CLIENT_ID` for the frontend build. Public viewers do not receive operator permissions; the backend derives the operator role from `GOOGLE_OPERATOR_EMAILS` and `GOOGLE_OPERATOR_DOMAINS`.

## Terraform

1. Build or select the canonical image in Artifact Registry.
2. Supply the OAuth client ID and trusted origins; do not use wildcard CORS.
3. Review the plan with a human before applying.

```powershell
cd terraform
terraform init
terraform fmt -check -recursive
terraform validate
terraform plan `
  -var="project_id=$env:GCP_PROJECT_ID" `
  -var="google_oauth_client_id=$env:GOOGLE_OAUTH_CLIENT_ID" `
  -var="cors_origins=https://dashboard.example.gov" `
  -var="allowed_hosts=dashboard.example.gov,vaani-api.example.run.app" `
  -out=tfplan
terraform apply tfplan
```

Terraform creates required Google APIs, Artifact Registry, Firestore, Cloud Run services, Pub/Sub, BigQuery tables, service accounts, IAM bindings, and Secret Manager containers. Secret versions remain an explicit out-of-band operation so their values are not committed to source control or ordinary Terraform state.

The intake subscription delivers to the internal worker with an OIDC token issued for the dedicated gateway service account. The worker validates both the token audience (`/pubsub/intake`) and the service-account email in application code; a request without that identity is rejected outside development/test. Terraform also permits the managed `*.run.app` worker host through trusted-host middleware.

The `terraform` block uses a GCS backend. Bootstrap a dedicated, versioned state bucket once (outside this repository), then provide its name as `TF_STATE_BUCKET`; CI uses a branch-scoped prefix. Terraform plan and apply are separate manual gates, and apply must only run after a human reviews the saved plan.

Before applying, confirm that every `latest` secret referenced by Cloud Run has at least one version. Confirm the runtime service account has `roles/secretmanager.secretAccessor` and `roles/datastore.user`.

## GitLab CI/CD

Configure protected/masked GitLab variables:

- `GCP_PROJECT_ID`
- `GCP_WIF_PROVIDER`
- `GCP_DEPLOYER_SERVICE_ACCOUNT`
- `GOOGLE_OAUTH_CLIENT_ID`
- `GOOGLE_OPERATOR_EMAILS`
- `GOOGLE_OPERATOR_DOMAINS` (optional if explicit emails are used)
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
- `TF_STATE_BUCKET`
- `CORS_ORIGINS`
- `ALLOWED_HOSTS`

The deployer service account must be allowed to impersonate through the Workload Identity Federation provider. The runtime service account is separate and is used by Cloud Run. The pipeline fails on tests, Bandit, Safety, Gitleaks, frontend type-checking, Cloud Build, and Terraform validation. Staging and production deploy jobs are manual.

## Local verification

```powershell
Copy-Item .env.example .env
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r backend\requirements.txt
$env:PYTHONPATH = "$PWD\backend"
python -m pytest tests -q
cd frontend
npm ci
npm run type-check
npm run build
```

For a local operator-only action, `ALLOW_DEV_AUTH=true` and `DEV_OPERATOR_TOKEN=dev-operator` allow a test bearer token. Never enable those settings in staging or production.

## Container smoke test

```powershell
docker build -t vaani-api:local .
docker run --rm -p 8080:8080 `
  -e ENVIRONMENT=development `
  -e APP_BASE_DIR=/app `
  vaani-api:local
Invoke-WebRequest http://localhost:8080/health
```

The image is built from the repository root. The old `backend/Dockerfile` is retained only as a compatibility path and must also be built with the repository root as context. No `COPY ..` escape is used.

## GKE migration boundary

GKE is not part of the first live release. If Cloud Run no longer meets latency, networking, or workload isolation requirements, create a separate migration change that adds a Kubernetes deployment, Workload Identity, HPA, NetworkPolicy, ingress, and a tested cutover plan. Do not run Cloud Run and an unreviewed GKE path as two competing production authorities.
