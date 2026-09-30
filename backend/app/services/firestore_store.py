"""Operational persistence for citizen requests, tickets, and audit events.

Firestore is the source of truth for request lifecycle state. BigQuery remains
an analytical projection and must not be treated as the only operational write.
The in-memory store is deliberately limited to development/tests; Cloud Run
instances must use Firestore in production.
"""
from __future__ import annotations

import copy
import hashlib
import logging
import threading
from datetime import datetime, timezone
from typing import Any, Dict, Optional

from ..core.config import settings
from ..core.gcp_clients import get_firestore_client

logger = logging.getLogger("vaani.firestore")


class FirestoreStore:
    _local_requests: dict[str, dict[str, Any]] = {}
    _local_idempotency: dict[str, dict[str, Any]] = {}
    _local_audit: list[dict[str, Any]] = []
    _lock = threading.RLock()

    def __init__(self, client: Any | None = None) -> None:
        self.client = client if client is not None else get_firestore_client()

    @property
    def available(self) -> bool:
        return self.client is not None

    def _require_store(self) -> None:
        if not self.client and settings.ENVIRONMENT.lower() not in {"development", "test"}:
            raise RuntimeError("Firestore is required in production but is not configured")

    @staticmethod
    def _idempotency_document_id(idempotency_key: str) -> str:
        """Map arbitrary caller keys to safe, bounded Firestore document IDs."""
        return hashlib.sha256(idempotency_key.encode("utf-8")).hexdigest()

    def get_idempotent_response(self, idempotency_key: str | None) -> Optional[Dict[str, Any]]:
        if not idempotency_key:
            return None
        if self.client:
            document_id = self._idempotency_document_id(idempotency_key)
            snapshot = self.client.collection(settings.FIRESTORE_IDEMPOTENCY_COLLECTION).document(document_id).get()
            if not snapshot.exists:
                return None
            data = snapshot.to_dict() or {}
            return data.get("response")
        with self._lock:
            return copy.deepcopy(self._local_idempotency.get(idempotency_key, {}).get("response"))

    def save_request(
        self,
        record: Dict[str, Any],
        idempotency_key: str | None = None,
        response_payload: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Create or return an intake record without duplicating retries."""
        self._require_store()
        key = idempotency_key or str(record["request_id"])
        if self.client:
            # Import lazily so local tests do not require Firestore transaction
            # machinery merely to exercise deterministic fallbacks.
            from google.cloud import firestore

            document_id = self._idempotency_document_id(key)
            idempotency_ref = self.client.collection(settings.FIRESTORE_IDEMPOTENCY_COLLECTION).document(document_id)
            request_ref = self.client.collection(settings.FIRESTORE_REQUESTS_COLLECTION).document(str(record["request_id"]))
            transaction = self.client.transaction()

            @firestore.transactional
            def write_once(tx):
                snapshot = idempotency_ref.get(transaction=tx)
                if snapshot.exists:
                    existing = snapshot.to_dict() or {}
                    existing_id = str(existing.get("request_id", record["request_id"]))
                    existing_request_ref = self.client.collection(settings.FIRESTORE_REQUESTS_COLLECTION).document(existing_id)
                    existing_request = existing_request_ref.get(transaction=tx)
                    return existing_request.to_dict() if existing_request.exists else existing

                tx.create(request_ref, copy.deepcopy(record))
                tx.create(
                    idempotency_ref,
                    {
                        "request_id": record["request_id"],
                        "response": copy.deepcopy(response_payload),
                        "created_at": datetime.now(timezone.utc).isoformat(),
                    },
                )
                return copy.deepcopy(record)

            try:
                return write_once(transaction)
            except Exception:
                logger.exception("Firestore request write failed")
                raise

        with self._lock:
            if key in self._local_idempotency:
                existing_id = self._local_idempotency[key]["request_id"]
                return copy.deepcopy(self._local_requests[existing_id])
            stored = copy.deepcopy(record)
            self._local_requests[str(record["request_id"])] = stored
            self._local_idempotency[key] = {
                "request_id": str(record["request_id"]),
                "response": copy.deepcopy(response_payload),
            }
            return copy.deepcopy(stored)

    def write_audit_event(
        self,
        *,
        action: str,
        actor: Dict[str, Any],
        request_id: str | None = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> None:
        """Write a minimised audit event without storing raw credentials or tokens."""
        event = {
            "action": action,
            "actor": {
                "sub": actor.get("sub"),
                "email": actor.get("email"),
                "role": actor.get("role", "viewer"),
            },
            "request_id": request_id,
            "metadata": metadata or {},
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        if self.client:
            try:
                self.client.collection(settings.FIRESTORE_AUDIT_COLLECTION).add(event)
                return
            except Exception:
                logger.exception("Firestore audit write failed")
                raise
        with self._lock:
            self._local_audit.append(copy.deepcopy(event))

    def get_request(self, request_id: str) -> Optional[Dict[str, Any]]:
        if self.client:
            snapshot = self.client.collection(settings.FIRESTORE_REQUESTS_COLLECTION).document(request_id).get()
            return snapshot.to_dict() if snapshot.exists else None
        with self._lock:
            record = self._local_requests.get(request_id)
            return copy.deepcopy(record) if record else None

    def health(self) -> Dict[str, Any]:
        return {
            "configured": self.available,
            "store": "firestore" if self.available else "local-development-store",
            "database": settings.FIRESTORE_DATABASE,
        }
