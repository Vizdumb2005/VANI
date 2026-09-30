"""Pydantic v2 schemas for citizen intake requests and webhooks."""
from typing import Optional, Dict, Any, Literal
from pydantic import BaseModel, Field


class VisionInspectionResult(BaseModel):
    infrastructure_category: str = Field(..., description="roads | water_sanitation | power | health | education | public_safety | other")
    damage_type: str = Field(..., description="Standardized engineering damage classification")
    severity_score: float = Field(..., ge=1.0, le=5.0, description="Damage severity score from 1.0 to 5.0")
    hazard_level: Literal["low", "medium", "high", "critical"] = Field(..., description="Risk tier")
    visual_verification_passed: bool = Field(..., description="True if image shows authentic physical damage")
    ai_damage_assessment: str = Field(..., description="Two-sentence civil engineering summary")
    recommended_remediation: str = Field(..., description="Recommended engineering fix under IRC/PMGSY/JJM specs")
    model_used: str = Field(default="gemini-2.0-flash", description="Model version utilized")
    source: str = Field(default="live_gemini", description="Inference source (live_gemini or calibrated_simulation)")


class CitizenRequest(BaseModel):
    channel: str = Field(
        ...,
        description="whatsapp_voice | whatsapp_text | web_voice | web_text | telegram_text | telegram_voice | ivr_voice",
    )
    text: Optional[str] = Field(None, description="Message text (text channels)")
    audio_uri: Optional[str] = Field(None, description="Ephemeral audio reference (16kHz mono WAV)")
    audio_base64: Optional[str] = Field(None, description="Inline base64 audio payload")
    cached_reference: Optional[str] = Field(None, description="Demo-mode cached transcript identifier")
    device_id: str = Field(..., description="Device or phone identifier; persisted only as salted HMAC-SHA256")
    image_base64: Optional[str] = Field(None, description="Base64 encoded photo of physical infrastructure damage")
    image_mime_type: Optional[str] = Field("image/jpeg", description="MIME type for image payload")
    received_at: Optional[str] = None


class CitizenRequestResponse(BaseModel):
    request_id: str = Field(..., description="Deterministic or UUID4 request identifier")
    language: str = Field(..., description="Auto-detected ISO-639-1/3 code (never user-declared)")
    transcript_preview: str = Field(..., description="Redacted transcript snippet (max 120 chars)")
    asr_rung: str = Field(..., description="ASR degradation ladder rung used")
    ticket_id: str = Field(..., description="Sovereign citizen tracking ticket (e.g. TKT-VNS-8842)")
    gemini_vision_inspection: Optional[VisionInspectionResult] = None
    text_reply: Optional[str] = Field(None, description="Formatted WhatsApp/SMS text confirmation message")
    voice_reply: Optional[Dict[str, Any]] = Field(None, description="TTS voice note payload with audio_base64 and spoken script")
    persisted_at: str = Field(..., description="ISO 8601 timestamp of persistence")
    operational_store: str = Field(default="firestore", description="Operational persistence backend")
    event_published: bool = Field(default=False, description="Whether Pub/Sub acknowledged the event")
    analytics_persisted: bool = Field(default=False, description="Whether BigQuery acknowledged the analytic projection")


class WhatsAppWebhookChallenge(BaseModel):
    hub_mode: str
    hub_challenge: str
    hub_verify_token: str


class TelegramMessageUpdate(BaseModel):
    update_id: int
    message: Optional[Dict[str, Any]] = None
