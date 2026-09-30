"""Application configuration for VAANI.

Production secrets are injected by Cloud Run from Secret Manager or by the
runtime environment. Development-only defaults exist solely to keep the local
seeded demo and unit tests deterministic; they are rejected in production.
"""
from __future__ import annotations

import os
from pathlib import Path
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=True,
    )

    # Platform and runtime
    PROJECT_NAME: str = "VAANI — Voice-to-Network Aggregated National Intelligence"
    ENVIRONMENT: str = "development"
    DEBUG: bool = False
    APP_BASE_DIR: Path | None = None
    PORT: int = 8080
    API_V1_STR: str = ""
    PUBLIC_BASE_URL: str = "http://localhost:8000"
    MAX_BODY_BYTES: int = 8 * 1024 * 1024
    MAX_TEXT_LENGTH: int = 20_000
    MAX_IMAGE_BYTES: int = 5 * 1024 * 1024
    RATE_LIMIT_PER_MINUTE: int = 60

    # Google Cloud Platform
    GCP_PROJECT_ID: str = "vaani-sovereign-dpi"
    GCP_REGION: str = "asia-south1"
    GCP_SECONDARY_REGION: str = "asia-south2"
    VERTEX_AI_LOCATION: str = "asia-south1"
    GOOGLE_APPLICATION_CREDENTIALS: str | None = None

    # Vertex AI / Gemini
    GEMINI_MODEL_VISION: str = "gemini-2.0-flash"
    GEMINI_MODEL_POLICY: str = "gemini-2.0-flash"
    GEMINI_API_KEY: str = ""
    USE_VERTEX_AI: bool = True
    INDICCONFORMER_ENDPOINT_ID: str = ""

    # Firestore operational store
    FIRESTORE_DATABASE: str = "(default)"
    FIRESTORE_REQUESTS_COLLECTION: str = "citizen_requests"
    FIRESTORE_IDEMPOTENCY_COLLECTION: str = "idempotency_keys"
    FIRESTORE_AUDIT_COLLECTION: str = "audit_events"

    # BigQuery analytical lakehouse
    BQ_DATASET: str = "vaani_lakehouse"
    BQ_RAW_TABLE: str = "raw_requests_partitioned"
    BQ_SIGNALS_TABLE: str = "deduplicated_signals"
    BQ_SPATIAL_TABLE: str = "lgd_spatial_registry"
    BQ_SCM_TABLE: str = "impact_counterfactuals"

    # Pub/Sub and Cloud Tasks
    PUBSUB_TOPIC_INTAKE: str = "citizen-intake-events"
    PUBSUB_TOPIC_VISION: str = "multimodal-vision-queue"
    PUBSUB_TOPIC_CPGRAMS: str = "cpgrams-dispatch-queue"
    PUBSUB_PUSH_AUDIENCE: str = ""
    PUBSUB_PUSH_SERVICE_ACCOUNT_EMAIL: str = ""
    CPGRAMS_QUEUE_NAME: str = "cpgrams-dispatch-rate-limiter"
    CPGRAMS_DISPATCH_RATE_LIMIT: int = 10

    # Secret Manager-backed values. Never provide production fallbacks here.
    HMAC_SALT: str = ""
    WHATSAPP_APP_SECRET: str = ""
    WHATSAPP_VERIFY_TOKEN: str = ""
    TELEGRAM_BOT_SECRET: str = ""
    BHASHINI_API_KEY: str = ""

    # Google login and authorization
    GOOGLE_OAUTH_CLIENT_ID: str = ""
    GOOGLE_OPERATOR_EMAILS: str = ""
    GOOGLE_OPERATOR_DOMAINS: str = ""
    ALLOW_DEV_AUTH: bool = True
    DEV_OPERATOR_TOKEN: str = "dev-operator"

    # Provider credentials/signing configuration
    RAPIDPRO_API_URL: str = ""
    RAPIDPRO_API_TOKEN: str = ""
    TWILIO_AUTH_TOKEN: str = ""

    # Runtime paths. APP_BASE_DIR is /app in the container and the repository
    # root in a local checkout.
    RESULTS_DIR_NAME: str = "results"
    DATA_DIR_NAME: str = "data"
    DOCS_DIR_NAME: str = "docs"
    WORKFLOW_DIR_NAME: str = "workflow"

    # Comma-separated values keep Cloud Run environment injection simple.
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:8000"
    ALLOWED_HOSTS: str = "localhost,127.0.0.1,testserver"

    @property
    def BASE_DIR(self) -> Path:
        if self.APP_BASE_DIR:
            return Path(self.APP_BASE_DIR)
        # config.py -> core -> app -> backend -> repository root
        return Path(__file__).resolve().parents[3]

    @property
    def RESULTS_DIR(self) -> Path:
        return self.BASE_DIR / self.RESULTS_DIR_NAME

    @property
    def DATA_DIR(self) -> Path:
        return self.BASE_DIR / self.DATA_DIR_NAME

    @property
    def DOCS_DIR(self) -> Path:
        return self.BASE_DIR / self.DOCS_DIR_NAME

    @property
    def WORKFLOW_DIR(self) -> Path:
        return self.BASE_DIR / self.WORKFLOW_DIR_NAME

    @property
    def cors_origins(self) -> List[str]:
        return [item.strip() for item in self.CORS_ORIGINS.split(",") if item.strip()]

    @property
    def allowed_hosts(self) -> List[str]:
        return [item.strip() for item in self.ALLOWED_HOSTS.split(",") if item.strip()]

    @property
    def operator_emails(self) -> set[str]:
        return {item.strip().lower() for item in self.GOOGLE_OPERATOR_EMAILS.split(",") if item.strip()}

    @property
    def operator_domains(self) -> set[str]:
        return {item.strip().lower() for item in self.GOOGLE_OPERATOR_DOMAINS.split(",") if item.strip()}

    def model_post_init(self, __context: object) -> None:
        # Deterministic local values are intentionally scoped to non-production.
        # They are not accepted by validate_runtime() when ENVIRONMENT is prod.
        if self.ENVIRONMENT.lower() in {"development", "test"}:
            self.HMAC_SALT = self.HMAC_SALT or "local-development-only-hmac-salt"
            self.WHATSAPP_APP_SECRET = self.WHATSAPP_APP_SECRET or "local-development-only-whatsapp-secret"
            self.WHATSAPP_VERIFY_TOKEN = self.WHATSAPP_VERIFY_TOKEN or "local-development-only-whatsapp-token"
            self.TELEGRAM_BOT_SECRET = self.TELEGRAM_BOT_SECRET or "local-development-only-telegram-secret"

    def validate_runtime(self) -> None:
        """Fail fast on unsafe production configuration."""
        if self.ENVIRONMENT.lower() in {"development", "test"}:
            return

        required = {
            "HMAC_SALT": self.HMAC_SALT,
            "WHATSAPP_APP_SECRET": self.WHATSAPP_APP_SECRET,
            "WHATSAPP_VERIFY_TOKEN": self.WHATSAPP_VERIFY_TOKEN,
            "TELEGRAM_BOT_SECRET": self.TELEGRAM_BOT_SECRET,
            "GOOGLE_OAUTH_CLIENT_ID": self.GOOGLE_OAUTH_CLIENT_ID,
            "PUBSUB_PUSH_AUDIENCE": self.PUBSUB_PUSH_AUDIENCE,
            "PUBSUB_PUSH_SERVICE_ACCOUNT_EMAIL": self.PUBSUB_PUSH_SERVICE_ACCOUNT_EMAIL,
        }
        missing = sorted(name for name, value in required.items() if not value)
        if not self.operator_emails and not self.operator_domains:
            missing.append("GOOGLE_OPERATOR_EMAILS or GOOGLE_OPERATOR_DOMAINS")
        if missing:
            raise RuntimeError(
                "Missing required production configuration: " + ", ".join(missing)
            )
        if "*" in self.cors_origins:
            raise RuntimeError("Wildcard CORS is not permitted in production")
        if self.ALLOW_DEV_AUTH:
            raise RuntimeError("ALLOW_DEV_AUTH must be false in production")


settings = Settings()
