"""Webhooks package for omnichannel citizen intake."""
from .whatsapp import router as whatsapp_router
from .telegram import router as telegram_router
from .ivr_twiml import router as ivr_router
from .streaming import router as streaming_router
from .rapidpro import router as rapidpro_router

__all__ = [
    "whatsapp_router",
    "telegram_router",
    "ivr_router",
    "streaming_router",
    "rapidpro_router",
]
