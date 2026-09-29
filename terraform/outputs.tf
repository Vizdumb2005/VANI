output "gateway_uri" {
  description = "Cloud Run Core Gateway URI"
  value       = google_cloud_run_v2_service.vaani_gateway_primary.uri
}

output "lakehouse_dataset" {
  description = "BigQuery Lakehouse Dataset ID"
  value       = google_bigquery_dataset.vaani_lakehouse.dataset_id
}

output "ephemeral_audio_bucket" {
  description = "Cloud Storage Ephemeral Audio Intake Bucket"
  value       = google_storage_bucket.ephemeral_audio.name
}

output "pubsub_intake_topic" {
  description = "Pub/Sub Intake Events Topic"
  value       = google_pubsub_topic.intake_events.id
}
