# IAM Service Accounts, Roles, Secret Manager & Cloud Armor

# 1. Dedicated Service Accounts
resource "google_service_account" "vaani_gateway_sa" {
  account_id   = "vaani-gateway-sa"
  display_name = "VAANI API Core Gateway Service Account"
}

resource "google_service_account" "vaani_worker_sa" {
  account_id   = "vaani-worker-sa"
  display_name = "VAANI Async Background Worker Service Account"
}

# 2. Least-Privilege IAM Bindings for Gateway
resource "google_project_iam_member" "gateway_vertex" {
  project = var.project_id
  role    = "roles/aiplatform.user"
  member  = "serviceAccount:${google_service_account.vaani_gateway_sa.email}"
}

resource "google_project_iam_member" "gateway_bigquery" {
  project = var.project_id
  role    = "roles/bigquery.dataEditor"
  member  = "serviceAccount:${google_service_account.vaani_gateway_sa.email}"
}

resource "google_project_iam_member" "gateway_pubsub" {
  project = var.project_id
  role    = "roles/pubsub.publisher"
  member  = "serviceAccount:${google_service_account.vaani_gateway_sa.email}"
}

resource "google_project_iam_member" "gateway_secrets" {
  project = var.project_id
  role    = "roles/secretmanager.secretAccessor"
  member  = "serviceAccount:${google_service_account.vaani_gateway_sa.email}"
}

# 3. Secret Manager Secrets
resource "google_secret_manager_secret" "hmac_salt" {
  secret_id = "vaani-hmac-salt"
  replication {
    auto {}
  }
}

resource "google_secret_manager_secret" "whatsapp_app_secret" {
  secret_id = "vaani-whatsapp-app-secret"
  replication {
    auto {}
  }
}

resource "google_secret_manager_secret" "telegram_bot_secret" {
  secret_id = "vaani-telegram-bot-secret"
  replication {
    auto {}
  }
}

resource "google_secret_manager_secret" "gemini_api_key" {
  secret_id = "vaani-gemini-api-key"
  replication {
    auto {}
  }
}

resource "google_secret_manager_secret" "bhashini_api_key" {
  secret_id = "vaani-bhashini-api-key"
  replication {
    auto {}
  }
}

# 4. Google Cloud Armor WAF & Rate Limiting Policy
resource "google_compute_security_policy" "vaani_cloud_armor" {
  name        = "vaani-cloud-armor-policy"
  description = "Cloud Armor WAF protecting VAANI against OWASP Top 10, volumetric DDoS, and rate limiting"

  # Rate limiting rule: Max 100 requests per minute per IP
  rule {
    action   = "rate_based_ban"
    priority = "1000"
    match {
      versioned_expr = "SRC_IPS_V1"
      config {
        src_ip_ranges = ["*"]
      }
    }
    rate_limit_options {
      conform_action = "allow"
      exceed_action  = "deny(429)"
      enforce_on_key = "IP"
      rate_limit_threshold {
        count        = 100
        interval_sec = 60
      }
      ban_duration_sec = 300
    }
    description = "Rate limit civic webhooks & API intake"
  }

  # OWASP Core Rule Set: Block SQLi & XSS
  rule {
    action   = "deny(403)"
    priority = "2000"
    match {
      expr {
        expression = "evaluatePreconfiguredExpr('sqli-v33-stable') || evaluatePreconfiguredExpr('xss-v33-stable')"
      }
    }
    description = "Block OWASP Top 10 SQLi and XSS payloads"
  }

  # Default allow
  rule {
    action   = "allow"
    priority = "2147483647"
    match {
      versioned_expr = "SRC_IPS_V1"
      config {
        src_ip_ranges = ["*"]
      }
    }
    description = "Default allow verified incoming traffic"
  }
}
