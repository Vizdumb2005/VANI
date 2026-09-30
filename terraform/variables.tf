variable "project_id" {
  description = "Google Cloud Platform project ID"
  type        = string
  default     = "vaani-sovereign-dpi"
}

variable "region" {
  description = "Primary Cloud Run region"
  type        = string
  default     = "asia-south1"
}

variable "secondary_region" {
  description = "Reserved secondary region for a later active-active rollout"
  type        = string
  default     = "asia-south2"
}

variable "environment" {
  description = "Deployment environment"
  type        = string
  default     = "production"
}

variable "artifact_repository" {
  description = "Artifact Registry repository name"
  type        = string
  default     = "vaani"
}

variable "container_image" {
  description = "Canonical VAANI API image URI"
  type        = string
  default     = "asia-south1-docker.pkg.dev/vaani-sovereign-dpi/vaani/api:latest"
}

variable "worker_container_image" {
  description = "Pub/Sub worker image URI; defaults to the canonical API image until split"
  type        = string
  default     = "asia-south1-docker.pkg.dev/vaani-sovereign-dpi/vaani/api:latest"
}

variable "firestore_database" {
  description = "Firestore database name"
  type        = string
  default     = "(default)"
}

variable "firestore_location" {
  description = "Firestore regional location"
  type        = string
  default     = "asia-south1"
}

variable "google_oauth_client_id" {
  description = "Google OAuth web client ID used by frontend and backend token verification"
  type        = string
  sensitive   = false
}

variable "google_operator_emails" {
  description = "Comma-separated allowlisted operator email addresses"
  type        = string
}

variable "google_operator_domains" {
  description = "Comma-separated allowlisted operator email domains"
  type        = string
  default     = ""
}

variable "cors_origins" {
  description = "Comma-separated trusted browser origins"
  type        = string
  default     = "http://localhost:3000"
}

variable "allowed_hosts" {
  description = "Comma-separated Cloud Run and frontend hostnames"
  type        = string
  default     = "localhost,127.0.0.1"
}
