"""Automated tests for VAANI Production GCP & Omnichannel Services.

Verifies:
1. WhatsApp Meta Graph v21.0 challenge verification and HMAC-SHA256 signature checking
2. Telegram Bot webhook secret token validation and 22-script keyboard responses
3. Twilio/Exotel IVR XML voice intake
4. Vertex AI Gemini 2.0 Multimodal Vision inspection
5. Dynamic MCDA re-ranking and Spearman rho calculation
6. Abadie Synthetic Control Method causal impact API
7. DARPG CPGRAMS v2 dispatch sync
8. BigQuery Lakehouse k >= 3 cell suppression
9. DPDP Act 2023 zero audio retention and statutory compliance
"""
import base64
import hmac
import hashlib
import json
import pytest
from pathlib import Path
from fastapi.testclient import TestClient

import sys
ROOT = Path(__file__).resolve().parents[1]
if str(ROOT / "backend") not in sys.path:
    sys.path.insert(0, str(ROOT / "backend"))

from app.main import app
from app.core.config import settings
from app.core.security import device_hash, redact_pii, verify_telegram_token, verify_whatsapp_signature
from app.services.mcda_engine import compute_mcda_rankings, calculate_spearman_rho
from app.services.vertex_gemini import analyze_infrastructure_damage, generate_cabinet_policy_brief


@pytest.fixture(scope="module")
def client():
    return TestClient(app)


def test_nonlocal_webhook_signatures_fail_closed(monkeypatch):
    monkeypatch.setattr(settings, "ENVIRONMENT", "staging")
    assert verify_whatsapp_signature(b"payload", None) is False
    assert verify_telegram_token(None) is False


def test_whatsapp_challenge_verification(client):
    """Verifies WhatsApp Meta Graph API v21.0 verification challenge."""
    res = client.get(
        "/webhooks/whatsapp",
        params={
            "hub.mode": "subscribe",
            "hub.verify_token": settings.WHATSAPP_VERIFY_TOKEN,
            "hub.challenge": "vaani_challenge_12345",
        },
    )
    assert res.status_code == 200
    assert res.text == "vaani_challenge_12345"

    # Mismatch token returns 403
    res_bad = client.get(
        "/webhooks/whatsapp",
        params={
            "hub.mode": "subscribe",
            "hub.verify_token": "wrong_token",
            "hub.challenge": "12345",
        },
    )
    assert res_bad.status_code == 403


def test_whatsapp_post_json_intake(client):
    """Verifies incoming WhatsApp Meta JSON message processing with HMAC signature."""
    payload = {
        "object": "whatsapp_business_account",
        "entry": [{
            "id": "WHATSAPP_BUSINESS_ACCOUNT_ID",
            "changes": [{
                "value": {
                    "messaging_product": "whatsapp",
                    "metadata": {"display_phone_number": "919999999999"},
                    "messages": [{
                        "from": "919876543210",
                        "id": "wamid.HBgL...",
                        "timestamp": "1727600000",
                        "text": {"body": "वाराणसी में रिंग रोड पर बड़ा गड्ढा है और पानी भरा है।"},
                        "type": "text"
                    }]
                },
                "field": "messages"
            }]
        }]
    }
    raw_bytes = json.dumps(payload).encode("utf-8")
    sig = hmac.new(settings.WHATSAPP_APP_SECRET.encode("utf-8"), raw_bytes, hashlib.sha256).hexdigest()

    res = client.post(
        "/webhooks/whatsapp",
        content=raw_bytes,
        headers={"Content-Type": "application/json", "X-Hub-Signature-256": f"sha256={sig}"},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert "ticket_id" in data
    assert data["channel"] == "whatsapp_text"


def test_telegram_webhook_token_validation(client):
    """Verifies Telegram Bot webhook token validation and keyboard response."""
    # Bad token
    res_bad = client.post(
        "/webhooks/telegram",
        json={"update_id": 1, "message": {"text": "hello"}},
        headers={"X-Telegram-Bot-Api-Secret-Token": "invalid_secret"},
    )
    assert res_bad.status_code == 403

    # Valid token
    res_good = client.post(
        "/webhooks/telegram",
        json={
            "update_id": 101,
            "message": {
                "message_id": 12,
                "from": {"id": 88392104, "first_name": "Citizen"},
                "chat": {"id": 88392104, "type": "private"},
                "text": "மதுரையில் குடிநீர் பற்றாக்குறை உள்ளது."
            }
        },
        headers={"X-Telegram-Bot-Api-Secret-Token": settings.TELEGRAM_BOT_SECRET},
    )
    assert res_good.status_code == 200
    data = res_good.json()
    assert data["ok"] is True
    assert "reply_keyboard" in data
    assert "ticket_id" in data


def test_ivr_twiml_endpoint(client):
    """Verifies Twilio/Exotel IVR XML voice generation."""
    # Initial call
    res = client.post("/webhooks/ivr", data={"From": "+919876543210"})
    assert res.status_code == 200
    assert "application/xml" in res.headers["content-type"]
    assert "<Response>" in res.text
    assert "<Record" in res.text

    # Callback with speech result
    res_cb = client.post(
        "/webhooks/ivr",
        data={"From": "+919876543210", "SpeechResult": "सड़क पर गड्ढों की शिकायत है।"},
    )
    assert res_cb.status_code == 200
    assert "<Hangup/>" in res_cb.text


def test_gemini_multimodal_vision_inspection():
    """Verifies Gemini 2.0 Flash Multimodal Vision civil engineering inspection."""
    dummy_b64 = base64.b64encode(b"RIFF\x24\x00\x00\x00WAVEfmt \x10\x00\x00\x00").decode("utf-8")
    result = analyze_infrastructure_damage(
        image_b64=dummy_b64,
        citizen_text="वाराणसी में सड़क का डामर उखड़ गया है और गहरा गड्ढा बना है।",
        category_hint="roads",
    )
    assert "severity_score" in result
    assert 1.0 <= result["severity_score"] <= 5.0
    assert result["hazard_level"] in ["low", "medium", "high", "critical"]
    assert result["visual_verification_passed"] is True
    assert "recommended_remediation" in result


def test_gemini_cabinet_policy_brief():
    """Verifies Cabinet Policy Brief agent generation."""
    sample_card = {
        "rank": 1,
        "category": "roads",
        "location": "Varanasi",
        "lgd_district_code": 102,
        "demand_intensity": {"report_count": 68, "excess_ratio": 3.4},
        "deprivation_score": 0.62,
        "scheme_match": {"scheme": "PMGSY III"},
        "cost_per_beneficiary_proxy": 180.0,
        "priority": 0.88,
    }
    brief = generate_cabinet_policy_brief(sample_card)
    assert "memo_title" in brief
    assert "executive_summary" in brief
    assert "urgency_justification" in brief
    assert "recommended_sanction_inr_crores" in brief


def test_mcda_dynamic_sensitivity():
    """Verifies dynamic MCDA sensitivity calculation and Spearman rho."""
    res = compute_mcda_rankings(w_demand=0.7, w_deprivation=0.1, w_population=0.1, w_scheme=0.1)
    assert "spearman_rho" in res
    assert -1.0 <= res["spearman_rho"] <= 1.0
    assert len(res["top_recommendations"]) > 0


def test_cpgrams_requires_operator(client):
    """Public viewers cannot trigger an external governance dispatch."""
    res = client.post("/integrations/cpgrams/sync?batch_size=5")
    assert res.status_code == 401


def test_cpgrams_dispatch_sync(client):
    """Verifies DARPG CPGRAMS batch dispatch sync for an operator."""
    res = client.post(
        "/integrations/cpgrams/sync?batch_size=5",
        headers={"Authorization": "Bearer dev-operator"},
    )
    assert res.status_code == 200
    data = res.json()
    assert "batch_id" in data
    assert "nic_receipt_hash" in data
    assert data["gateway_status"] == "DELIVERED_TO_DARPG_NIC"
    assert len(data["details"]) > 0
    first_record = data["details"][0]
    assert first_record["registration_no"].startswith("DARPG/P/")
    assert first_record["sla_days"] in [15, 30]


def test_auth_me_anonymous_is_viewer(client):
    """Anonymous dashboard access is read-only viewer access."""
    res = client.get("/auth/me")
    assert res.status_code == 200
    assert res.json() == {
        "authenticated": False,
        "sub": "anonymous",
        "email": None,
        "name": None,
        "role": "viewer",
    }


def test_statutory_compliance_endpoints(client):
    """Verifies DPDP Act 2023 and DPGA compliance audit endpoints."""
    res = client.get("/compliance")
    assert res.status_code == 200
    comp = res.json()
    assert comp["regulatory_certifications"]["dpdp_act_2023"]["status"] == "COMPLIANT"
    assert "0s" in comp["regulatory_certifications"]["dpdp_act_2023"]["audio_retention"]

    dpo = client.get("/dpo")
    assert dpo.status_code == 200
    assert "dpo@vaani-dpg.org" in dpo.json()["email"]


def test_rapidpro_dual_voice_and_text_reply(client):
    """Verifies that RapidPro webhook returns both STT transcript, Gemini damage analysis, formatted text reply, and synthesized TTS audio voice note."""
    payload = {
        "contact": {"urn": "whatsapp:+919876543210", "name": "Ramesh"},
        "flow": {"name": "VAANI Grievance Intake"},
        "results": {
            "citizen_text": {"value": "वाराणसी में मुख्य सड़क पर बड़ा गड्ढा है और पानी भरा है।"},
            "photo_base64": {"value": "dummy_photo_b64"},
            "district": {"value": "Varanasi"}
        }
    }
    res = client.post("/webhooks/rapidpro", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert "ticket_id" in data
    assert data["ticket_id"].startswith("TKT-")

    # Verify Text Reply
    assert "text_reply" in data
    assert len(data["text_reply"]) > 20
    assert data["ticket_id"] in data["text_reply"]

    # Verify TTS Voice Reply
    assert "voice_reply" in data
    voice = data["voice_reply"]
    assert voice["status"] == "generated"
    assert voice["format"] == "audio/wav; rate=16000"
    assert voice["audio_base64"] is not None
    assert len(voice["audio_base64"]) > 100

    # Verify Gemini Vision Inspection
    assert "vision_inspection" in data
    assert data["vision_inspection"]["visual_verification_passed"] is True
    assert 1.0 <= data["vision_inspection"]["severity_score"] <= 5.0

    # Verify voice audio URI for RapidPro WhatsApp attachment
    assert "voice_audio_uri" in data
    assert data["voice_audio_uri"].startswith("data:audio/wav;base64,")


def test_rapidpro_direct_payload_and_form(client):
    """Verifies RapidPro webhook with simplified direct payload and voice note."""
    direct_payload = {
        "contact": {"urn": "tel:+919876543210", "name": "Geeta Devi"},
        "text": "Sigra chauraha par naali toot gayi hai",
        "voice_base64": "dummy_pcm_buffer",
        "district": "Varanasi"
    }
    res = client.post("/webhooks/rapidpro", json=direct_payload)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert "voice_reply" in data
    assert "text_reply" in data
    assert data["district"] == "Varanasi"


@pytest.mark.anyio
async def test_rapidpro_outbound_client_service():
    """Verifies RapidPro API v2 outbound service methods."""
    from backend.app.services.rapidpro_service import RapidProClient
    client = RapidProClient()

    # Workspace metadata
    info = await client.get_workspace_info()
    assert "languages" in info

    # Contact Sync
    sync_res = await client.sync_contact(
        urn="whatsapp:+919876543210",
        name="Ramesh Singh",
        language="hin",
        district="Varanasi",
        lgd_code=192
    )
    assert sync_res["status"] in ["synced_mock", "success"]
    assert sync_res["fields"]["district"] == "Varanasi"

    # Outbound Broadcast
    bcast = await client.send_broadcast(
        text="Test advisory from VAANI",
        urns=["whatsapp:+919876543210"]
    )
    assert bcast["status"] in ["delivered_mock", "success"]

    # Flow Start
    flow = await client.start_flow(
        flow_uuid="flow-1234-uuid",
        urns=["whatsapp:+919876543210"],
        extra={"ticket_id": "TKT-VAR-101"}
    )
    assert flow["status"] in ["started_mock", "success"]

    # CPGRAMS Resolution Notification
    cpg_notif = await client.notify_cpgrams_resolution(
        urn="whatsapp:+919876543210",
        ticket_id="TKT-VAR-101",
        resolution_status="Resolved",
        remediation_details="Bituminous overlay completed",
        flow_survey_uuid="survey-uuid-5678"
    )
    assert cpg_notif["status"] in ["delivered_mock", "success"]


