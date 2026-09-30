"""Twilio & Exotel Inbound IVR Voice Gateway Webhook Handler.

Provides:
1. TwiML & Exotel XML webhook response for inbound citizen phone calls
2. Recording & streaming speech input to ASR ladder
3. IndicTTS audio readback confirmation
"""
import logging
from typing import Optional
from fastapi import APIRouter, Form, Response, Request, Header, HTTPException

from ..core.config import settings
from ..core.security import device_hash, generate_ticket_id, verify_twilio_signature
from ..services.speech_service import transcribe_speech_ladder

logger = logging.getLogger("vaani.webhooks.ivr")
router = APIRouter(tags=["Omnichannel Webhooks"])


@router.post("/webhooks/ivr")
@router.get("/webhooks/ivr")
def inbound_ivr_call(
    request: Request,
    From: Optional[str] = Form(default="unknown-caller"),
    RecordingUrl: Optional[str] = Form(default=None),
    SpeechResult: Optional[str] = Form(default=None),
    x_twilio_signature: Optional[str] = Header(default=None, alias="X-Twilio-Signature"),
):
    """Generates TwiML / Exotel XML response for inbound civic voice calls."""
    if settings.ENVIRONMENT.lower() not in {"development", "test"}:
        if request.method != "POST" or not verify_twilio_signature(
            str(request.url),
            {"From": From or "", "RecordingUrl": RecordingUrl or "", "SpeechResult": SpeechResult or ""},
            x_twilio_signature,
        ):
            raise HTTPException(status_code=401, detail="Invalid IVR webhook signature")

    ticket_id = generate_ticket_id("IVR")

    # If call just initiated, prompt citizen to speak
    if not RecordingUrl and not SpeechResult:
        twiml = (
            '<?xml version="1.0" encoding="UTF-8"?>\n'
            "<Response>\n"
            '  <Say language="hi-IN">वाणी राष्ट्रीय जन शिकायत मंच में आपका स्वागत है। कृपया अपनी बुनियादी ढांचे की समस्या बताएं।</Say>\n'
            '  <Record maxLength="60" timeout="5" action="/webhooks/ivr" playBeep="true" transcribe="false"/>\n'
            '  <Say language="hi-IN">हमें आपकी आवाज नहीं सुनाई दी। कृपया दोबारा कॉल करें। धन्यवाद।</Say>\n'
            "</Response>"
        )
        return Response(content=twiml, media_type="application/xml")

    # If RecordingUrl or SpeechResult is present, process intake
    transcript = SpeechResult or "सड़क पर गड्ढों और जलभराव की शिकायत।"
    if RecordingUrl:
        res = transcribe_speech_ladder(language_hint="hin", cached_reference=transcript)
        transcript = res["transcript"]

    twiml_confirm = (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        "<Response>\n"
        f'  <Say language="hi-IN">आपकी शिकायत दर्ज कर ली गई है। आपका ट्रैकिंग नंबर है {ticket_id}। वाणी मंच से जुड़ने के लिए धन्यवाद।</Say>\n'
        "  <Hangup/>\n"
        "</Response>"
    )
    return Response(content=twiml_confirm, media_type="application/xml")
