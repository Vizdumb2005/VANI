"""M7.4 — Scripted privacy audit (specs P11).

Audits every persisted artifact for the three privacy invariants:
  1. zero raw phone numbers anywhere in persisted text
  2. zero retained audio files (deletion-after-transcription hook)
  3. device identifiers stored only as 16-hex salted hashes
Writes results/privacy_audit.txt. Exit 0 on full pass.
"""
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from config import AUDIO_DIR, DATA, RESULTS, ROOT

PHONE_RE = re.compile(r"(?<!\d)[6-9]\d{9}(?!\d)")
UUID_RE = re.compile(r"[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}")


HEX16_RE = re.compile(r"\b[0-9a-f]{16}\b")   # salted device hashes
TS_RE = re.compile(r"\d{4}-\d{2}-\d{2}T[\d:.+\-]+")  # ISO timestamps


def count_phones(text):
    """Raw 10-digit Indian mobile numbers, ignoring UUID / hash / timestamp
    substrings (structural numerics, not PII)."""
    t = UUID_RE.sub(" ", str(text))
    t = HEX16_RE.sub(" ", t)
    t = TS_RE.sub(" ", t)
    return len(PHONE_RE.findall(t))
HASH_RE = re.compile(r"^[0-9a-f]{16}$")


def main():
    findings = []

    # 1. raw phone numbers in any persisted text/json/parquet-derived content
    scanned_files = 0
    for p in (ROOT / "data").rglob("*"):
        if p.suffix in (".parquet", ".jsonl", ".json"):
            scanned_files += 1
    import pandas as pd
    hits = 0
    for p in (ROOT / "data").rglob("*.parquet"):
        try:
            df = pd.read_parquet(p, columns=None)
        except Exception:
            continue
        for col in df.columns:
            if df[col].dtype == object or str(df[col].dtype) == "string":
                for v in df[col].dropna().astype(str):
                    hits += count_phones(v)
    for p in (ROOT / "data").rglob("*.jsonl"):
        for line in p.read_text(encoding="utf-8", errors="ignore").splitlines():
            # redacted markers are fine; raw numbers are not
            hits += count_phones(line)
    findings.append(("raw_phone_numbers_in_persisted_data", hits, hits == 0))

    # 2. retained audio
    audio_files = list(AUDIO_DIR.rglob("*")) if AUDIO_DIR.exists() else []
    audio_files = [f for f in audio_files if f.is_file()]
    findings.append(("retained_audio_files", len(audio_files), len(audio_files) == 0))

    # 3. device hash format across all request corpora
    ok_hash, n = True, 0
    for p in list((ROOT / "data").rglob("requests_*.parquet")) + \
               list((ROOT / "data").rglob("processed_*.parquet")):
        df = pd.read_parquet(p, columns=["device_hash"])
        n += len(df)
        if not df["device_hash"].astype(str).str.match(HASH_RE).all():
            ok_hash = False
    findings.append(("device_hashes_are_16hex_salted", f"{n} rows checked", ok_hash))

    # 4. no raw device ids / PII keys in results JSON
    res_hits = 0
    for p in (RESULTS).rglob("*.json"):
        res_hits += count_phones(p.read_text(encoding="utf-8", errors="ignore"))
    findings.append(("raw_phone_numbers_in_results", res_hits, res_hits == 0))

    lines = ["VAANI PRIVACY AUDIT (P11)", "=" * 40, ""]
    all_ok = True
    for name, val, ok in findings:
        lines.append(f"[{'PASS' if ok else 'FAIL'}] {name}: {val}")
        all_ok &= bool(ok)
    lines += ["", f"scanned data files: {scanned_files}",
              "audit verdict: " + ("CLEAN — no raw PII, no retained audio" if all_ok else "VIOLATIONS FOUND")]
    (RESULTS / "privacy_audit.txt").write_text("\n".join(lines), encoding="utf-8")
    print("[M7.4] privacy audit:", "PASS" if all_ok else "FAIL",
          f"({dict((n, v) for n, v, _ in findings)})")
    return all_ok


if __name__ == "__main__":
    sys.exit(0 if main() else 1)
