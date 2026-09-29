"""Application configuration for VAANI on Google Cloud Platform."""
import os
from pathlib import Path
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # Platform & Environment
    PROJECT_NAME: str = "VAANI — Voice-to-Network Aggregated National Intelligence"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "production")
    DEBUG: bool = os.getenv("DEBUG", "false").lower() == "true"
    API_V1_STR: str = ""

    # Google Cloud Platform Infrastructure
    GCP_PROJECT_ID: str = os.getenv("GCP_PROJECT_ID", "vaani-sovereign-dpi")
    GCP_REGION: str = os.getenv("GCP_REGION", "asia-south1")
    GCP_SECONDARY_REGION: str = os.getenv("GCP_SECONDARY_REGION", "asia-south2")

    # Vertex AI Configuration
    VERTEX_AI_LOCATION: str = os.getenv("VERTEX_AI_LOCATION", "asia-south1")
    GEMINI_MODEL_VISION: str = os.getenv("GEMINI_MODEL_VISION", "gemini-2.0-flash")
    GEMINI_MODEL_POLICY: str = os.getenv("GEMINI_MODEL_POLICY", "gemini-2.0-flash")
    INDICCONFORMER_ENDPOINT_ID: str = os.getenv("INDICCONFORMER_ENDPOINT_ID", "projects/vaani/endpoints/indicconformer-gpu")

    # BigQuery Lakehouse & Storage
    BQ_DATASET: str = os.getenv("BQ_DATASET", "vaani_lakehouse")
    BQ_RAW_TABLE: str = os.getenv("BQ_RAW_TABLE", "raw_requests_partitioned")
    BQ_SIGNALS_TABLE: str = os.getenv("BQ_SIGNALS_TABLE", "deduplicated_signals")
    BQ_SPATIAL_TABLE: str = os.getenv("BQ_SPATIAL_TABLE", "lgd_spatial_registry")
    BQ_SCM_TABLE: str = os.getenv("BQ_SCM_TABLE", "impact_counterfactuals")
    EPHEMERAL_AUDIO_BUCKET: str = os.getenv("EPHEMERAL_AUDIO_BUCKET", "vaani-ephemeral-audio-intake")

    # Cloud Pub/Sub Topics
    PUBSUB_TOPIC_INTAKE: str = os.getenv("PUBSUB_TOPIC_INTAKE", "citizen-intake-events")
    PUBSUB_TOPIC_VISION: str = os.getenv("PUBSUB_TOPIC_VISION", "multimodal-vision-queue")
    PUBSUB_TOPIC_CPGRAMS: str = os.getenv("PUBSUB_TOPIC_CPGRAMS", "cpgrams-dispatch-queue")

    # Cloud Tasks
    CPGRAMS_QUEUE_NAME: str = os.getenv("CPGRAMS_QUEUE_NAME", "cpgrams-dispatch-rate-limiter")
    CPGRAMS_DISPATCH_RATE_LIMIT: int = 10  # 10 req/s

    # Secrets & Cryptographic Salts
    HMAC_SALT: str = os.getenv("HMAC_SALT", "vaani-sovereign-dpi-salt-2026-brics")
    WHATSAPP_APP_SECRET: str = os.getenv("WHATSAPP_APP_SECRET", "vaani-whatsapp-secret-prod-token")
    WHATSAPP_VERIFY_TOKEN: str = os.getenv("WHATSAPP_VERIFY_TOKEN", "vaani_sovereign_verify_token")
    TELEGRAM_BOT_SECRET: str = os.getenv("TELEGRAM_BOT_SECRET", "vaani-tg-secret-production-token-9912")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", os.getenv("GOOGLE_API_KEY", ""))
    BHASHINI_API_KEY: str = os.getenv("BHASHINI_API_KEY", "")

    # Local Path References for Pipeline Artifacts
    BASE_DIR: Path = Path(__file__).resolve().parents[3]
    RESULTS_DIR: Path = BASE_DIR / "results"
    DATA_DIR: Path = BASE_DIR / "data"
    DOCS_DIR: Path = BASE_DIR / "docs"
    WORKFLOW_DIR: Path = BASE_DIR / "workflow"

    # CORS Configuration
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:8000",
        "https://vaani.gov.in",
        "https://vaani-dpi.web.app",
        "*"
    ]


settings = Settings()
