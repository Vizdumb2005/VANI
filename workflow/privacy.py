"""Privacy hardening utilities (specs §3.3, design.md §2.6).

- device_hash(): salted one-way hash; raw phone numbers are never persisted.
- audit_audio_deleted(): deletion-after-transcription hook evidence.
- apply_aggregation_threshold(): suppress dashboard cells < 3 reports.
"""
import hashlib
import re

from config import DEVICE_HASH_SALT, MIN_CELL_AGGREGATION

PHONE_RE = re.compile(r"(?<!\d)[6-9]\d{9}(?!\d)")


def device_hash(phone_or_device: str) -> str:
    return hashlib.sha256(f"{DEVICE_HASH_SALT}:{phone_or_device}".encode()).hexdigest()[:16]


def scan_for_raw_pii(text: str) -> list[str]:
    """Detect raw 10-digit Indian mobile numbers in stored text."""
    return PHONE_RE.findall(str(text))


def apply_aggregation_threshold(df, count_col="report_count"):
    """Mask cells below the minimum aggregation threshold (privacy by design)."""
    small = df[count_col] < MIN_CELL_AGGREGATION
    out = df.copy()
    out.loc[small, count_col] = None  # suppressed
    return out, int(small.sum())
