variable "project_id" {
  description = "Google Cloud Platform Project ID"
  type        = string
  default     = "vaani-sovereign-dpi"
}

variable "region" {
  description = "Primary GCP Region (India Mumbai)"
  type        = string
  default     = "asia-south1"
}

variable "secondary_region" {
  description = "Secondary GCP Region (India Delhi)"
  type        = string
  default     = "asia-south2"
}

variable "environment" {
  description = "Deployment Environment (staging / production)"
  type        = string
  default     = "production"
}

variable "container_image" {
  description = "Artifact Registry Container Image URI for VAANI Gateway"
  type        = string
  default     = "asia-south1-docker.pkg.dev/vaani-sovereign-dpi/vaani/gateway:v2.0.0"
}

variable "worker_container_image" {
  description = "Artifact Registry Container Image URI for VAANI Async Worker"
  type        = string
  default     = "asia-south1-docker.pkg.dev/vaani-sovereign-dpi/vaani/worker:v2.0.0"
}
