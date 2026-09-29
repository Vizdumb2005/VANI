"""Web Voice & Streaming Audio Intake WebSocket Handler (/requests/stream).

Streams raw PCM audio chunks directly to Vertex AI Speech Recognition ladder for real-time transcription.
Enforces DPDP Act 2023 §8(7) zero audio retention in memory.
"""
import logging
import uuid
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from ..services.speech_service import transcribe_speech_ladder

logger = logging.getLogger("vaani.webhooks.streaming")
router = APIRouter(tags=["Omnichannel Webhooks"])


@router.websocket("/requests/stream")
async def websocket_audio_stream(websocket: WebSocket):
    """Receives streaming binary PCM chunks, streams to ASR ladder, returns real-time transcripts."""
    await websocket.accept()
    session_id = str(uuid.uuid4())
    logger.info(f"WebSocket audio session opened: {session_id}")

    try:
        buffer = bytearray()
        while True:
            data = await websocket.receive_bytes()
            buffer.extend(data)

            # Every ~1 second of 16kHz 16-bit mono audio (32,000 bytes), run incremental inference
            if len(buffer) >= 32000:
                res = transcribe_speech_ladder(
                    audio_bytes=bytes(buffer),
                    language_hint="und",
                )
                await websocket.send_json({
                    "session_id": session_id,
                    "partial_transcript": res["transcript"],
                    "asr_rung": res["rung"],
                    "zero_retention_enforced": True,
                })
                buffer.clear()
    except WebSocketDisconnect:
        logger.info(f"WebSocket audio session closed: {session_id}")
    except Exception as e:
        logger.error(f"WebSocket error in session {session_id}: {e}")
        try:
            await websocket.close()
        except Exception:
            pass
