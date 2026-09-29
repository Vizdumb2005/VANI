# Vertex AI Model Garden & Custom Prediction Endpoints

# 1. Vertex AI Endpoint for AI4Bharat IndicConformer ASR & IndicTTS
resource "google_vertex_ai_endpoint" "indic_speech_endpoint" {
  name         = "indic-speech-conformer-endpoint"
  display_name = "AI4Bharat IndicConformer & IndicTTS GPU Acceleration Ladder"
  description  = "Containerized TorchServe/Triton inference for 22 Scheduled Indian Languages with zero egress"
  location     = var.region

  labels = {
    workload  = "speech-intelligence"
    framework = "ai4bharat-nemo"
    managed_by = "terraform"
  }
}

# 2. Deployed Model on Vertex AI Endpoint with GPU Acceleration (NVIDIA L4 / T4)
# In production, connects the model archive to the endpoint with dynamic batching
# resource "google_vertex_ai_endpoint_deployed_model" "indicconformer_model" {
#   endpoint = google_vertex_ai_endpoint.indic_speech_endpoint.id
#   model    = google_vertex_ai_custom_model.indicconformer.id
#   display_name = "indicconformer-hindi-tamil-marathi"
#   dedicated_resources {
#     machine_spec {
#       machine_type      = "g2-standard-4"
#       accelerator_type  = "NVIDIA_L4"
#       accelerator_count = 1
#     }
#     min_replica_count = 1
#     max_replica_count = 5
#   }
# }
