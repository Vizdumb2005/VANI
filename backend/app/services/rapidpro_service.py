"""RapidPro Sovereign Omnichannel Service & API v2 Client.

Integrates VAANI with the RapidPro Digital Public Good (DPG) messaging engine.
Provides:
1. Outbound WhatsApp & SMS broadcasts for citizen updates.
2. Programmatic flow triggering (e.g., grievance resolution satisfaction surveys).
3. Contact synchronization with LGD 6-digit codes and preferred Indic language.
4. Omnichannel message dispatch with dual voice & text payload delivery.
"""
import logging
import os
from typing import Dict, Any, List, Optional
import httpx

from ..core.config import settings
from ..core.security import redact_pii

logger = logging.getLogger("vaani.services.rapidpro")


class RapidProClient:
    """Client for RapidPro REST API v2."""

    def __init__(self, api_url: Optional[str] = None, api_token: Optional[str] = None):
        self.api_url = (api_url or os.getenv("RAPIDPRO_API_URL") or "https://app.rapidpro.io/api/v2").rstrip("/")
        self.api_token = api_token or os.getenv("RAPIDPRO_API_TOKEN") or "dummy_rapidpro_token"
        self.headers = {
            "Authorization": f"Token {self.api_token}",
            "Content-Type": "application/json",
            "User-Agent": "VAANI-Sovereign-DPI/2.0",
        }

    def is_configured(self) -> bool:
        """Returns True if a non-dummy API token is configured."""
        return bool(self.api_token and self.api_token != "dummy_rapidpro_token")

    async def get_workspace_info(self) -> Dict[str, Any]:
        """Fetches workspace metadata from RapidPro."""
        if not self.is_configured():
            return {
                "name": "VAANI Sovereign Grievance Desk",
                "country": "IN",
                "languages": ["hin", "tam", "tel", "kan", "ben", "mar", "guj", "eng"],
                "status": "simulation_active",
            }

        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(f"{self.api_url}/org.json", headers=self.headers)
            resp.raise_for_status()
            return resp.json()

    async def sync_contact(
        self,
        urn: str,
        name: Optional[str] = None,
        language: str = "hin",
        district: Optional[str] = None,
        lgd_code: Optional[int] = None,
    ) -> Dict[str, Any]:
        """Creates or updates a citizen contact with language and LGD spatial fields."""
        fields = {
            "preferred_language": language,
            "district": district or "Unknown",
            "lgd_code": str(lgd_code or ""),
        }
        payload = {
            "urns": [urn],
            "name": redact_pii(name or ""),
            "fields": fields,
            "language": language,
        }

        if not self.is_configured():
            logger.info(f"[RapidPro Mock] Synced contact {urn} with language={language}, district={district}")
            return {"urn": urn, "status": "synced_mock", "fields": fields}

        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(f"{self.api_url}/contacts.json", json=payload, headers=self.headers)
            resp.raise_for_status()
            return resp.json()

    async def send_broadcast(
        self,
        text: str,
        urns: List[str],
        media_url: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Dispatches an outbound broadcast message (SMS or WhatsApp) via RapidPro."""
        payload: Dict[str, Any] = {
            "text": text,
            "urns": urns,
        }
        if media_url:
            payload["attachments"] = [media_url]

        if not self.is_configured():
            logger.info(f"[RapidPro Mock] Broadcast sent to {len(urns)} contacts. Media: {bool(media_url)}")
            return {
                "id": 99901,
                "text": text,
                "urns": urns,
                "status": "delivered_mock",
                "attachments": [media_url] if media_url else [],
            }

        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(f"{self.api_url}/broadcasts.json", json=payload, headers=self.headers)
            resp.raise_for_status()
            return resp.json()

    async def start_flow(
        self,
        flow_uuid: str,
        urns: List[str],
        extra: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Initiates an interactive flow (e.g. feedback survey post-remediation) for contacts."""
        payload: Dict[str, Any] = {
            "flow": flow_uuid,
            "urns": urns,
            "extra": extra or {},
        }

        if not self.is_configured():
            logger.info(f"[RapidPro Mock] Started flow {flow_uuid} for {len(urns)} URNs with extra={extra}")
            return {
                "flow": flow_uuid,
                "runs": len(urns),
                "status": "started_mock",
            }

        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(f"{self.api_url}/flow_starts.json", json=payload, headers=self.headers)
            resp.raise_for_status()
            return resp.json()

    async def notify_cpgrams_resolution(
        self,
        urn: str,
        ticket_id: str,
        resolution_status: str,
        remediation_details: str,
        language: str = "hin",
        flow_survey_uuid: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Proactively notifies a citizen of DARPG CPGRAMS resolution and triggers feedback flow."""
        text_msg = (
            f"VAANI Grievance Update ({ticket_id}): Your petition has been resolved by the competent authority. "
            f"Status: {resolution_status}. Details: {remediation_details}."
        )

        broadcast_res = await self.send_broadcast(text=text_msg, urns=[urn])

        if flow_survey_uuid:
            await self.start_flow(
                flow_uuid=flow_survey_uuid,
                urns=[urn],
                extra={"ticket_id": ticket_id, "status": resolution_status},
            )

        return broadcast_res


rapidpro_client = RapidProClient()
