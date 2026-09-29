"""M3 — Ingestion & ASR benchmark (tasks.md M3.1, M3.2, M3.3, M3.4).

1. Live-ingest round-trip test through the FastAPI app (TestClient):
   web text, web voice (ladder), WhatsApp text + voice webhook (mock).
2. ASR benchmark: WER per language on the 50-utterance held-out set,
   transcripts written to results/demo_transcripts.jsonl (P1 artifact).
3. Privacy preliminary audit run (M3.4).
"""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import pandas as pd
from fastapi.testclient import TestClient

import asr_service
from config import RESULTS, RUNS, SYNTH
from app.main import app


def ingest_roundtrip() -> dict:
    client = TestClient(app)

    # web text
    r = client.post("/requests", json={
        "channel": "web_text",
        "text": "रामपुर गाँव की सड़क बहुत टूटी है, वाराणसी में मानसून में कोई मरम्मत नहीं हुई। सड़क पर गड्ढे भरे हैं",
        "device_id": "9876543210"})
    assert r.status_code == 200, r.text
    web_text = r.json()

    # whatsapp text (webhook mock)
    r = client.post("/webhook/whatsapp", data={
        "Body": "எங்க கிராமத்து ரோடு மோசமா உடைந்து இருக்கு, சேலம் ல யாரும் சரி பண்ணல. ரோட்டுல குழிகள் நிறைய இருக்கு",
        "From": "9000000001"})
    assert r.status_code == 200, r.text
    wa_text = r.json()

    # web voice (degradation ladder, cached-simulated rung)
    r = client.post("/requests", json={
        "channel": "web_voice", "audio_uri": "audio/demo1.wav",
        "cached_reference": "पुणे मध्ये पिण्याचे पाणी मिळत नाही, पुणे चे लोक त्रस्त आहेत. हॅन्डपंप तीन महिन्यांपासून बिघडला आहे",
        "device_id": "9000000002"})
    assert r.status_code == 200, r.text
    web_voice = r.json()

    # whatsapp voice webhook (mock media)
    r = client.post("/webhook/whatsapp", data={
        "Body": "மதுரை ல தினமும் 6 மணி கரண்ட் கட் வருது",
        "MediaUrl": "https://sandbox.provider/vn/demo2.wav", "From": "9000000003"})
    assert r.status_code == 200, r.text
    wa_voice = r.json()

    return {"web_text": web_text, "whatsapp_text": wa_text,
            "web_voice": web_voice, "whatsapp_voice": wa_voice}


def asr_benchmark() -> dict:
    held = pd.read_parquet(SYNTH / "asr_heldout.parquet")
    rows, per_lang = [], {}
    for _, r in held.iterrows():
        w = asr_service.wer(r["gt_source_text"], r["raw_text"])
        rows.append({"request_id": r["request_id"], "language": r["gt_language"],
                     "channel": r["channel"], "category": r["gt_category"],
                     "district": r["gt_district"],
                     "source_text": r["gt_source_text"], "transcript": r["raw_text"],
                     "wer": round(w, 4), "asr_rung": "cached-simulated"})
        per_lang.setdefault(r["gt_language"], []).append(w)
    per_lang = {k: round(float(sum(v) / len(v)), 4) for k, v in per_lang.items()}
    overall = round(float(sum(x["wer"] for x in rows) / len(rows)), 4)

    (RESULTS / "demo_transcripts.jsonl").write_text(
        "\n".join(json.dumps(x, ensure_ascii=False) for x in rows), encoding="utf-8")
    return {"per_language_wer": per_lang, "overall_wer": overall, "n": len(rows),
            "rung_exercised": "cached-simulated",
            "ladder_status": {"selfhosted-indicconformer": "requires GPU + NeMo (documented)",
                              "bhashini-ulca": "requires BHASHINI_API_KEY (documented)",
                              "cached-simulated": "exercised in this build"}}


def privacy_prelim() -> dict:
    import privacy
    train = pd.read_parquet(SYNTH / "requests_train.parquet")
    test = pd.read_parquet(SYNTH / "requests_test.parquet")
    hits = sum(len(privacy.scan_for_raw_pii(t)) for t in
               pd.concat([train, test])["raw_text"])
    audio_left = len(list((Path("data/audio")).glob("*"))) if Path("data/audio").exists() else 0
    hash_ok = all(len(h) == 16 for h in pd.concat([train, test])["device_hash"])
    return {"raw_phone_numbers_in_text": hits, "audio_files_retained": audio_left,
            "device_hash_format_ok": bool(hash_ok)}


def main():
    roundtrip = ingest_roundtrip()
    (RUNS / "M3_ingest_roundtrip.json").write_text(json.dumps(roundtrip, indent=2, ensure_ascii=False), encoding="utf-8")

    wer_rep = asr_benchmark()
    (RUNS / "M3_asr_report.json").write_text(json.dumps(wer_rep, indent=2, ensure_ascii=False), encoding="utf-8")

    priv = privacy_prelim()

    ok_ingest = all(v.get("request_id") for v in roundtrip.values())
    ok_voice_rung = roundtrip["web_voice"]["asr_rung"] == "cached-simulated"
    ok_wer = wer_rep["per_language_wer"].get("hi", 1.0) <= 0.25
    ok_priv = priv["raw_phone_numbers_in_text"] == 0 and priv["audio_files_retained"] == 0
    print(f"[M3] ingest roundtrip={'PASS' if ok_ingest else 'FAIL'} "
          f"voice_rung={roundtrip['web_voice']['asr_rung']} "
          f"WER per-lang={wer_rep['per_language_wer']} overall={wer_rep['overall_wer']} "
          f"hi<=0.25:{ok_wer} privacy_prelim={priv}")
    return ok_ingest and ok_voice_rung and ok_wer and ok_priv


if __name__ == "__main__":
    sys.exit(0 if main() else 1)
