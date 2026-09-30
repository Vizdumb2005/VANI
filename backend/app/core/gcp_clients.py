"""Google Cloud client factories with explicit production configuration.

All clients use Application Default Credentials in Cloud Run. Local tests may
run without ADC and receive a None client so deterministic fixtures can be used.
"""
from __future__ import annotations

import json
import logging
from functools import lru_cache
from typing import Any, Dict

from .config import settings

logger = logging.getLogger("vaani.gcp")


@lru_cache(maxsize=1)
def get_vertex_gemini_client() -> Any | None:
    """Return a Google GenAI client configured for Vertex AI or the API key path."""
    try:
        from google import genai

        if settings.USE_VERTEX_AI:
            return genai.Client(
                vertexai=True,
                project=settings.GCP_PROJECT_ID,
                location=settings.VERTEX_AI_LOCATION,
            )
        if settings.GEMINI_API_KEY:
            return genai.Client(api_key=settings.GEMINI_API_KEY)
        logger.warning("Gemini client disabled: neither Vertex AI nor an API key is configured")
    except Exception as exc:  # pragma: no cover - depends on runtime credentials
        logger.warning("Gemini client initialization failed: %s", exc)
    return None


@lru_cache(maxsize=1)
def get_bigquery_client() -> Any | None:
    """Return a BigQuery client or None when local ADC is unavailable."""
    try:
        from google.cloud import bigquery

        return bigquery.Client(project=settings.GCP_PROJECT_ID)
    except Exception as exc:  # pragma: no cover - depends on runtime credentials
        logger.warning("BigQuery client initialization failed: %s", exc)
        return None


@lru_cache(maxsize=1)
def get_firestore_client() -> Any | None:
    """Return the Firestore client used for operational state."""
    try:
        from google.cloud import firestore

        return firestore.Client(
            project=settings.GCP_PROJECT_ID,
            database=settings.FIRESTORE_DATABASE,
        )
    except Exception as exc:  # pragma: no cover - depends on runtime credentials
        logger.warning("Firestore client initialization failed: %s", exc)
        return None


@lru_cache(maxsize=1)
def get_pubsub_publisher() -> Any | None:
    """Return the Pub/Sub publisher client."""
    try:
        from google.cloud import pubsub_v1

        return pubsub_v1.PublisherClient()
    except Exception as exc:  # pragma: no cover - depends on runtime credentials
        logger.warning("Pub/Sub client initialization failed: %s", exc)
        return None


@lru_cache(maxsize=1)
def get_cloud_tasks_client() -> Any | None:
    """Return a Cloud Tasks client."""
    try:
        from google.cloud import tasks_v2

        return tasks_v2.CloudTasksClient()
    except Exception as exc:  # pragma: no cover - depends on runtime credentials
        logger.warning("Cloud Tasks client initialization failed: %s", exc)
        return None


def publish_intake_event(event_dict: Dict[str, Any]) -> bool:
    """Publish one sanitized event to Pub/Sub and wait for its server ack."""
    publisher = get_pubsub_publisher()
    if not publisher:
        logger.warning("Pub/Sub unavailable; event was not published")
        return False
    try:
        topic_path = publisher.topic_path(settings.GCP_PROJECT_ID, settings.PUBSUB_TOPIC_INTAKE)
        data = json.dumps(event_dict, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
        future = publisher.publish(topic_path, data, request_id=str(event_dict.get("request_id", "")))
        future.result(timeout=10)
        return True
    except Exception as exc:  # pragma: no cover - depends on runtime credentials
        logger.exception("Pub/Sub publish failed: %s", exc)
        return False
