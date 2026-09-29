"""M1.3 — Schema validator + data-quality gates (specs.md §2.4).

Validates the raw citizen-request ingestion contract (specs.md §2.1) over both
corpora; rejects (never silently coerces) malformed rows; writes
results/M1_data_audit.json. Exit 0 on pass.
"""
import json
import sys

import pandas as pd

from config import (CHANNELS, GEOCODE_UNRESOLVED_MAX, MIN_LANG_SHARE, RESULTS,
                    RUNS, SYNTH, TEST_END, TEST_START, TRAIN_END, TRAIN_START)

REQUIRED = ["request_id", "channel", "language", "audio_uri", "raw_text",
            "received_at", "device_hash"]
UUID_LEN = 36
rejects = []


def validate(df: pd.DataFrame, name: str) -> dict:
    r = {"corpus": name, "rows": len(df), "schema_errors": 0, "quarantined": 0}

    # required columns present
    missing = [c for c in REQUIRED if c not in df.columns]
    assert not missing, f"{name}: missing columns {missing}"

    # field-level checks
    bad = pd.Series(False, index=df.index)
    bad |= df["request_id"].astype(str).str.len() != UUID_LEN
    bad |= ~df["channel"].isin(CHANNELS)
    bad |= df["received_at"].isna()
    bad |= df["device_hash"].isna()

    # audio_uri required for voice channels
    voice = df["channel"].str.endswith("voice")
    bad |= voice & df["audio_uri"].isna()

    # mutually-nullable audio/text at intake, but neither-after-processing is
    # QUARANTINED (counted, not dropped)
    neither = df["audio_uri"].isna() & (df["raw_text"].isna() | (df["raw_text"].astype(str).str.strip() == ""))
    r["quarantined"] = int(neither.sum())
    r["schema_errors"] = int(bad.sum())
    r["reject_rate"] = round((bad.sum()) / max(len(df), 1), 5)

    # temporal window integrity
    ts = pd.to_datetime(df["received_at"])
    if name == "train":
        ok_win = (ts >= TRAIN_START) & (ts <= TRAIN_END)
    else:
        ok_win = (ts >= TEST_START) & (ts <= TEST_END)
    r["window_violations"] = int((~ok_win).sum())

    # language distribution gate (on ground-truth language at generation time)
    if "gt_language" in df.columns:
        share = df["gt_language"].value_counts(normalize=True)
        r["language_shares"] = {k: round(float(v), 3) for k, v in share.items()}
        r["language_imbalance_flag"] = bool((share < MIN_LANG_SHARE).any())
    rejects.append({"corpus": name, "quarantined_rows": r["quarantined"],
                    "schema_error_rows": r["schema_errors"]})
    return r


def main():
    train = pd.read_parquet(SYNTH / "requests_train.parquet")
    test = pd.read_parquet(SYNTH / "requests_test.parquet")
    report = [validate(train, "train"), validate(test, "test")]

    # geocode-resolvability proxy: does the text mention a registry district?
    # (actual geocoding happens in M4; this gate reports raw resolvability)
    reg = pd.read_parquet("data/open/lgd_registry.parquet" if False else
                          __import__("config").OPEN_DATA / "lgd_registry.parquet")
    def resolve_rate(df):
        import re
        aliases = []
        for _, row in reg.iterrows():
            for a in (row["district_name_en"], row["district_name_hi"], row["district_name_ta"]):
                if isinstance(a, str) and a:
                    aliases.append(a)
        found = df["raw_text"].apply(lambda t: any(a in str(t) for a in aliases))
        return round(float(found.mean()), 4)
    report.append({"geocode_mention_rate_train": resolve_rate(train),
                   "geocode_mention_rate_test": resolve_rate(test)})

    audit = {"validator": "workflow/validate_schema.py", "sections": report,
             "rejects": rejects,
             "gates": {"language_min_share": MIN_LANG_SHARE,
                        "geocode_unresolved_max": GEOCODE_UNRESOLVED_MAX}}
    # merge into the M1 audit file
    path = RUNS / "M1_data_audit.json"
    prev = json.loads(path.read_text(encoding="utf-8")) if path.exists() else {}
    prev["validation"] = audit
    path.write_text(json.dumps(prev, indent=2, ensure_ascii=False), encoding="utf-8")

    ok = all(s["schema_errors"] == 0 and s["window_violations"] == 0 for s in report[:2])
    ok = ok and all(s["quarantined"] == 0 for s in report[:2])
    print(f"[M1.3] validation {'PASS' if ok else 'FAIL'}: "
          + "; ".join(f"{s['corpus']}: {s['rows']} rows, {s['schema_errors']} schema errors, "
                      f"{s['quarantined']} quarantined, {s['window_violations']} window violations"
                      for s in report[:2])
          + f"; geocode mention rate train={report[2]['geocode_mention_rate_train']}")
    return ok


if __name__ == "__main__":
    sys.exit(0 if main() else 1)
