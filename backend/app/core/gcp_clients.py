"""Google Cloud Platform managed client wrappers with resilient fallback handling."""
import logging
from typing import Optional, Dict, Any
from .config import settings

logger = logging.getLogger("vaani.gcp")


# 1. Google GenAI / Vertex AI Client Initialization
def get_vertex_gemini_client():
    """Returns Google GenAI / Vertex AI client instance."""
    api_key = settings.GEMINI_API_KEY
    try:
        from google import genai
        if api_key:
            return genai.Client(api_key=api_key)
        # Attempt Google Cloud Application Default Credentials (ADC) on Cloud Run
        return genai.Client()
    except Exception as e:
        logger.warning(f"Vertex AI Client ADC fallback: {e}")
        return None


# 2. BigQuery Client Initialization
def get_bigquery_client():
    """Returns google.cloud.bigquery.Client or None if running locally without GCP ADC."""
    try:
        from google.cloud import bigquery
        return bigquery.Client(project=settings.GCP_PROJECT_ID)
    except Exception as e:
        logger.warning(f"BigQuery Client initialization: {e}")
        return None


# 3. Cloud Pub/Sub Publisher Client
def get_pubsub_publisher():
    """Returns google.cloud.pubsub_v1.PublisherClient or None."""
    try:
        from google.cloud import pubsub_v1
        return pubsub_v1.PublisherClient()
    except Exception as e:
        logger.warning(f"PubSub Client initialization: {e}")
        return None


# 4. Cloud Tasks Client
def get_cloud_tasks_client():
    """Returns google.cloud.tasks_v2.CloudTasksClient or None."""
    try:
        from google.cloud import tasks_v2
        return tasks_v2.CloudTasksClient()
    except Exception as e:
        logger.warning(f"Cloud Tasks Client initialization: {e}")
        return None


def publish_intake_event(event_dict: Dict[str, Any]) -> bool:
    """Publishes a citizen intake event to Google Cloud Pub/Sub."""
    publisher = get_pubsub_publisher()
    if not publisher:
        return False
    try:
        import json
        topic_path = publisher.topic_path(settings.GCP_PROJECT_ID, settings.PUBSUB_TOPIC_INTAKE)
        data = json.dumps(event_dict).encode("utf-8")
        future = publisher.publish(topic_path, data)
        return bool(future.result())
    except Exception as e:
        logger.error(f"Failed to publish to Pub/Sub: {e}")
        return False
