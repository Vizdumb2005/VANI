terraform {
  required_version = ">= 1.5.0"

  backend "gcs" {
    # Bucket and prefix are supplied by CI/local deployment commands.
  }

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.30.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

resource "google_project_service" "required" {
  for_each = toset([
    "artifactregistry.googleapis.com",
    "aiplatform.googleapis.com",
    "bigquery.googleapis.com",
    "cloudresourcemanager.googleapis.com",
    "cloudtasks.googleapis.com",
    "compute.googleapis.com",
    "firestore.googleapis.com",
    "iam.googleapis.com",
    "iamcredentials.googleapis.com",
    "logging.googleapis.com",
    "monitoring.googleapis.com",
    "pubsub.googleapis.com",
    "run.googleapis.com",
    "secretmanager.googleapis.com",
    "serviceusage.googleapis.com",
    "storage.googleapis.com",
    "texttospeech.googleapis.com",
  ])
  project            = var.project_id
  service            = each.value
  disable_on_destroy = false
}

resource "google_artifact_registry_repository" "vaani" {
  project       = var.project_id
  location      = var.region
  repository_id = var.artifact_repository
  description   = "VAANI container images"
  format        = "DOCKER"
  depends_on    = [google_project_service.required]
}

resource "google_firestore_database" "vaani" {
  project     = var.project_id
  name        = var.firestore_database
  location_id = var.firestore_location
  type                        = "FIRESTORE_NATIVE"
  concurrency_mode            = "OPTIMISTIC"
  app_engine_integration_mode = "DISABLED"
  depends_on                  = [google_project_service.required]
}

# 1. Cloud Run: VAANI API & Core Gateway (Primary region)
resource "google_cloud_run_v2_service" "vaani_gateway_primary" {
  name     = "vaani-api-gateway-${var.region}"
  location = var.region
  ingress  = "INGRESS_TRAFFIC_ALL"

  depends_on = [
    google_project_service.required,
    google_project_iam_member.gateway_secrets,
  ]

  template {
    scaling {
      min_instance_count = 0
      max_instance_count = 100
    }

    max_instance_request_concurrency = 80

    containers {
      image = var.container_image

      resources {
        limits = {
          cpu    = "2"
          memory = "2Gi"
        }
        cpu_idle = true # CPU always allocated disabled for cost & scale efficiency
      }

      env {
        name  = "ENVIRONMENT"
        value = var.environment
      }
      env {
        name  = "GCP_PROJECT_ID"
        value = var.project_id
      }
      env {
        name  = "GCP_REGION"
        value = var.region
      }
      env {
        name  = "VERTEX_AI_LOCATION"
        value = var.region
      }
      env {
        name  = "APP_BASE_DIR"
        value = "/app"
      }
      env {
        name  = "USE_VERTEX_AI"
        value = "true"
      }
      env {
        name  = "ALLOW_DEV_AUTH"
        value = "false"
      }
      env {
        name  = "FIRESTORE_DATABASE"
        value = google_firestore_database.vaani.name
      }
      env {
        name  = "GOOGLE_OAUTH_CLIENT_ID"
        value = var.google_oauth_client_id
      }
      env {
        name  = "GOOGLE_OPERATOR_EMAILS"
        value = var.google_operator_emails
      }
      env {
        name  = "GOOGLE_OPERATOR_DOMAINS"
        value = var.google_operator_domains
      }
      env {
        name  = "CORS_ORIGINS"
        value = var.cors_origins
      }
      env {
        name  = "ALLOWED_HOSTS"
        value = var.allowed_hosts
      }
      env {
        name  = "BQ_DATASET"
        value = google_bigquery_dataset.vaani_lakehouse.dataset_id
      }
      env {
        name  = "PUBSUB_TOPIC_INTAKE"
        value = google_pubsub_topic.intake_events.name
      }
      env {
        name  = "PUBSUB_TOPIC_VISION"
        value = google_pubsub_topic.vision_queue.name
      }
      env {
        name  = "PUBSUB_TOPIC_CPGRAMS"
        value = google_pubsub_topic.cpgrams_queue.name
      }
      env {
        name  = "CPGRAMS_QUEUE_NAME"
        value = google_cloud_tasks_queue.cpgrams_rate_limiter.name
      }
      env {
        name  = "PUBSUB_PUSH_AUDIENCE"
        value = "${google_cloud_run_v2_service.vaani_worker.uri}/pubsub/intake"
      }
      env {
        name  = "PUBSUB_PUSH_SERVICE_ACCOUNT_EMAIL"
        value = google_service_account.vaani_gateway_sa.email
      }

      # Secrets mapped securely from Secret Manager
      env {
        name = "HMAC_SALT"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.hmac_salt.secret_id
            version = "latest"
          }
        }
      }
      env {
        name = "WHATSAPP_APP_SECRET"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.whatsapp_app_secret.secret_id
            version = "latest"
          }
        }
      }
      env {
        name = "TELEGRAM_BOT_SECRET"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.telegram_bot_secret.secret_id
            version = "latest"
          }
        }
      }
      env {
        name = "WHATSAPP_VERIFY_TOKEN"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.whatsapp_verify_token.secret_id
            version = "latest"
          }
        }
      }
      env {
        name = "RAPIDPRO_API_TOKEN"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.rapidpro_api_token.secret_id
            version = "latest"
          }
        }
      }
      env {
        name = "TWILIO_AUTH_TOKEN"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.twilio_auth_token.secret_id
            version = "latest"
          }
        }
      }

      liveness_probe {
        http_get {
          path = "/health"
          port = 8080
        }
        period_seconds = 30
      }
    }

    service_account = google_service_account.vaani_gateway_sa.email
  }

  traffic {
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
    percent = 100
  }
}

# 2. Cloud Run: Asynchronous Worker Microservice (Pub/Sub consumer)
resource "google_cloud_run_v2_service" "vaani_worker" {
  name     = "vaani-worker-${var.region}"
  location = var.region
  ingress  = "INGRESS_TRAFFIC_INTERNAL_ONLY"

  depends_on = [
    google_project_service.required,
    google_project_iam_member.worker_secrets,
  ]

  template {
    scaling {
      min_instance_count = 0
      max_instance_count = 50
    }

    containers {
      image = var.worker_container_image

      resources {
        limits = {
          cpu    = "4"
          memory = "4Gi"
        }
        cpu_idle = true
      }

      env {
        name  = "ENVIRONMENT"
        value = var.environment
      }
      env {
        name  = "GCP_PROJECT_ID"
        value = var.project_id
      }
      env {
        name  = "GCP_REGION"
        value = var.region
      }
      env {
        name  = "VERTEX_AI_LOCATION"
        value = var.region
      }
      env {
        name  = "APP_BASE_DIR"
        value = "/app"
      }
      env {
        name  = "USE_VERTEX_AI"
        value = "true"
      }
      env {
        name  = "ALLOW_DEV_AUTH"
        value = "false"
      }
      env {
        name  = "FIRESTORE_DATABASE"
        value = google_firestore_database.vaani.name
      }
      env {
        name  = "PUBSUB_TOPIC_INTAKE"
        value = google_pubsub_topic.intake_events.name
      }
      env {
        name  = "PUBSUB_TOPIC_VISION"
        value = google_pubsub_topic.vision_queue.name
      }
      env {
        name  = "PUBSUB_TOPIC_CPGRAMS"
        value = google_pubsub_topic.cpgrams_queue.name
      }
      env {
        name  = "CPGRAMS_QUEUE_NAME"
        value = google_cloud_tasks_queue.cpgrams_rate_limiter.name
      }
      env {
        name  = "GOOGLE_OAUTH_CLIENT_ID"
        value = var.google_oauth_client_id
      }
      env {
        name  = "GOOGLE_OPERATOR_EMAILS"
        value = var.google_operator_emails
      }
      env {
        name  = "GOOGLE_OPERATOR_DOMAINS"
        value = var.google_operator_domains
      }
      env {
        name  = "ALLOWED_HOSTS"
        value = "*.run.app"
      }
      env {
        name  = "PUBSUB_PUSH_AUDIENCE"
        value = "${google_cloud_run_v2_service.vaani_worker.uri}/pubsub/intake"
      }
      env {
        name  = "PUBSUB_PUSH_SERVICE_ACCOUNT_EMAIL"
        value = google_service_account.vaani_gateway_sa.email
      }

      dynamic "env" {
        for_each = {
          HMAC_SALT             = google_secret_manager_secret.hmac_salt.secret_id
          WHATSAPP_APP_SECRET   = google_secret_manager_secret.whatsapp_app_secret.secret_id
          WHATSAPP_VERIFY_TOKEN = google_secret_manager_secret.whatsapp_verify_token.secret_id
          TELEGRAM_BOT_SECRET   = google_secret_manager_secret.telegram_bot_secret.secret_id
        }
        content {
          name = env.key
          value_source {
            secret_key_ref {
              secret  = env.value
              version = "latest"
            }
          }
        }
      }
    }

    service_account = google_service_account.vaani_worker_sa.email
  }
}

# 3. Cloud Pub/Sub Ingestion & Queuing Topics
resource "google_pubsub_topic" "intake_events" {
  name = "citizen-intake-events"
}

resource "google_pubsub_topic" "vision_queue" {
  name = "multimodal-vision-queue"
}

resource "google_pubsub_topic" "cpgrams_queue" {
  name = "cpgrams-dispatch-queue"
}

# Push Subscription delivering intake events to Worker
resource "google_pubsub_subscription" "worker_subscription" {
  name  = "vaani-worker-intake-sub"
  topic = google_pubsub_topic.intake_events.name

  push_config {
    push_endpoint = "${google_cloud_run_v2_service.vaani_worker.uri}/pubsub/intake"
    oidc_token {
      service_account_email = google_service_account.vaani_gateway_sa.email
      audience             = "${google_cloud_run_v2_service.vaani_worker.uri}/pubsub/intake"
    }
  }

  ack_deadline_seconds = 60
}

# 4. Cloud Tasks Queue (Rate-Limited to 10 req/s for DARPG CPGRAMS v2)
resource "google_cloud_tasks_queue" "cpgrams_rate_limiter" {
  name     = "cpgrams-dispatch-rate-limiter"
  location = var.region

  rate_limits {
    max_dispatches_per_second = 10
    max_concurrent_dispatches = 5
  }

  retry_config {
    max_attempts       = 5
    min_backoff        = "2s"
    max_backoff        = "30s"
    max_doublings      = 3
  }
}

# 5. BigQuery Data Lakehouse & Geospatial Tables
resource "google_bigquery_dataset" "vaani_lakehouse" {
  dataset_id                  = "vaani_lakehouse"
  friendly_name               = "VAANI Sovereign Data Lakehouse"
  description                 = "Lakehouse storing anonymized citizen telemetry, LGD GIS registries, and SCM counterfactuals"
  location                    = var.region
  default_table_expiration_ms = null
}

# Partitioned raw requests table (Zero PII, salted device hash)
resource "google_bigquery_table" "raw_requests_partitioned" {
  dataset_id = google_bigquery_dataset.vaani_lakehouse.dataset_id
  table_id   = "raw_requests_partitioned"

  time_partitioning {
    type  = "DAY"
    field = "received_at"
  }

  clustering = ["language", "lgd_district_code"]

  schema = jsonencode([
    { name = "request_id", type = "STRING", mode = "REQUIRED" },
    { name = "ticket_id", type = "STRING", mode = "REQUIRED" },
    { name = "channel", type = "STRING", mode = "REQUIRED" },
    { name = "language", type = "STRING", mode = "REQUIRED" },
    { name = "lgd_district_code", type = "INTEGER", mode = "NULLABLE" },
    { name = "device_hash", type = "STRING", mode = "REQUIRED" },
    { name = "raw_text", type = "STRING", mode = "NULLABLE" },
    { name = "received_at", type = "TIMESTAMP", mode = "REQUIRED" },
    { name = "vision_inspection", type = "JSON", mode = "NULLABLE" }
  ])
}

# Deduplicated demand signals table
resource "google_bigquery_table" "deduplicated_signals" {
  dataset_id = google_bigquery_dataset.vaani_lakehouse.dataset_id
  table_id   = "deduplicated_signals"

  clustering = ["district", "category"]

  schema = jsonencode([
    { name = "signal_id", type = "STRING", mode = "REQUIRED" },
    { name = "lgd_district_code", type = "INTEGER", mode = "REQUIRED" },
    { name = "district", type = "STRING", mode = "REQUIRED" },
    { name = "category", type = "STRING", mode = "REQUIRED" },
    { name = "device_hash", type = "STRING", mode = "NULLABLE" },
    { name = "report_count", type = "INTEGER", mode = "REQUIRED" },
    { name = "urgency", type = "FLOAT", mode = "REQUIRED" },
    { name = "centroid", type = "GEOGRAPHY", mode = "NULLABLE" }
  ])
}

# LGD GIS Spatial Registry (765+ district polygons)
resource "google_bigquery_table" "lgd_spatial_registry" {
  dataset_id = google_bigquery_dataset.vaani_lakehouse.dataset_id
  table_id   = "lgd_spatial_registry"

  schema = jsonencode([
    { name = "lgd_district_code", type = "INTEGER", mode = "REQUIRED" },
    { name = "district_name", type = "STRING", mode = "REQUIRED" },
    { name = "state_name", type = "STRING", mode = "REQUIRED" },
    { name = "district_geom", type = "GEOGRAPHY", mode = "REQUIRED" },
    { name = "centroid", type = "GEOGRAPHY", mode = "REQUIRED" },
    { name = "population_census_2011", type = "INTEGER", mode = "REQUIRED" },
    { name = "nfhs5_deprivation_index", type = "FLOAT", mode = "REQUIRED" }
  ])
}

# SCM Impact Counterfactuals
resource "google_bigquery_table" "impact_counterfactuals" {
  dataset_id = google_bigquery_dataset.vaani_lakehouse.dataset_id
  table_id   = "impact_counterfactuals"

  schema = jsonencode([
    { name = "district", type = "STRING", mode = "REQUIRED" },
    { name = "category", type = "STRING", mode = "REQUIRED" },
    { name = "lgd_district_code", type = "INTEGER", mode = "REQUIRED" },
    { name = "treatment_completed", type = "DATE", mode = "REQUIRED" },
    { name = "decay_pct", type = "FLOAT", mode = "REQUIRED" },
    { name = "inspace_placebo_pvalue", type = "FLOAT", mode = "REQUIRED" }
  ])
}

# 6. Ephemeral Audio Ingestion Cloud Storage Bucket (DPDP Act §8(7) Compliance)
# Enforces automated 1-day object deletion lifecycle rule
resource "google_storage_bucket" "ephemeral_audio" {
  name          = "vaani-ephemeral-audio-intake-${var.project_id}"
  location      = var.region
  force_destroy = true

  uniform_bucket_level_access = true

  lifecycle_rule {
    condition {
      age = 1 # Destroyed automatically after 24 hours
    }
    action {
      type = "Delete"
    }
  }
}
