"""Security, pseudonymization, PII sanitization, and cryptographic verification."""
import hmac
import hashlib
import re
import random
from typing import Optional
from .config import settings


def device_hash(device_id: str) -> str:
    """Computes a one-way HMAC-SHA256 salted hash for citizen device/phone identifiers.
    
    In accordance with Section 8(7) of India's DPDP Act 2023, raw identifiers are NEVER
    persisted to disk, memory logs, or lakehouse tables.
    """
    key = settings.HMAC_SALT.encode("utf-8")
    msg = str(device_id).strip().encode("utf-8")
    return hmac.new(key, msg, hashlib.sha256).hexdigest()


def redact_pii(text: str) -> str:
    """Sanitizes PII from citizen intake transcripts before persistence.
    
    Removes:
    - 10-digit Indian mobile numbers (starting with 6-9, with or without +91 / 0)
    - 12-digit Aadhaar number sequences
    - Standard email addresses
    """
    if not text:
        return ""
    s = str(text)
    # Redact Indian phone numbers
    s = re.sub(r"(?:\+?91[\-\s]?)?[6-9]\d{9}\b", "[REDACTED-PHONE]", s)
    # Redact Aadhaar 12-digit pattern (e.g. 1234 5678 9012 or 1234-5678-9012)
    s = re.sub(r"\b\d{4}[\s\-]?\d{4}[\s\-]?\d{4}\b", "[REDACTED-AADHAAR]", s)
    # Redact emails
    s = re.sub(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b", "[REDACTED-EMAIL]", s)
    return s


def verify_whatsapp_signature(payload: bytes, signature_header: Optional[str]) -> bool:
    """Verifies X-Hub-Signature-256 for Meta WhatsApp Cloud API webhooks."""
    if not signature_header:
        # Permitted in local sandbox/test environments without webhook secret
        return settings.ENVIRONMENT != "production"
    
    if not signature_header.startswith("sha256="):
        return False
    
    expected_hash = signature_header.split("sha256=")[-1].strip()
    secret = settings.WHATSAPP_APP_SECRET.encode("utf-8")
    mac = hmac.new(secret, payload, hashlib.sha256).hexdigest()
    return hmac.compare_digest(mac, expected_hash)


def verify_telegram_token(header_token: Optional[str]) -> bool:
    """Verifies X-Telegram-Bot-Api-Secret-Token on incoming Telegram updates."""
    if not header_token:
        return settings.ENVIRONMENT != "production"
    return hmac.compare_digest(header_token.strip(), settings.TELEGRAM_BOT_SECRET.strip())


def generate_ticket_id(district_name: Optional[str] = None) -> str:
    """Generates an official citizen tracking ticket (e.g. TKT-VNS-8842)."""
    dist_code = "IND"
    if district_name and len(district_name) >= 3:
        # Filter vowels if possible or take first 3 consonants
        cons = "".join([c.upper() for c in district_name if c.upper() not in "AEIOU \t\r\n-_"])
        dist_code = (cons[:3] if len(cons) >= 3 else district_name[:3].upper())
    rand_num = random.randint(1000, 9999)
    return f"TKT-{dist_code}-{rand_num}"
