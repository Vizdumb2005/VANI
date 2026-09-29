"""Automated test suite verifying VAANI Hard Pass/Fail Criteria (P1–P13).

Run: python -m pytest tests/test_vaani_pipeline.py -v
"""
import json
from pathlib import Path
import pytest
import yaml
from fastapi.testclient import TestClient

ROOT = Path(__file__).resolve().parents[1]
RESULTS = ROOT / "results"
RUNS = RESULTS / "runs"
API_DIR = ROOT / "api"

from app.main import app


@pytest.fixture(scope="module")
def client():
    return TestClient(app)


def test_p1_p2_omnichannel_intake(client):
    """P1 & P2: Test intake round-trip for web text, web voice, whatsapp text and whatsapp voice."""
    # Web text intake (Hindi)
    res = client.post("/requests", json={
        "channel": "web_text",
        "text": "वाराणसी में रामपुर गाँव की सड़क बहुत खराब है।",
        "device_id": "9876543210"
    })
    assert res.status_code == 200, res.text
    data = res.json()
    assert "request_id" in data
    assert data["language"] == "hi"

    # Web voice intake (exercising degradation ladder, Marathi)
    res_voice = client.post("/requests", json={
        "channel": "web_voice",
        "audio_uri": "audio/demo_test.wav",
        "cached_reference": "पुणे मध्ये पिण्याचे पाणी मिळत नाही, पुणे चे लोक त्रस्त आहेत. हॅन्डपंप तीन महिन्यांपासून बिघडला आहे",
        "device_id": "9876543211"
    })
    assert res_voice.status_code == 200
    vdata = res_voice.json()
    assert vdata["asr_rung"] == "cached-simulated"
    assert vdata["language"] == "mr"

    # WhatsApp webhook intake (Tamil)
    res_wa = client.post("/webhook/whatsapp", data={
        "Body": "மதுரையில் மின்சார தட்டுப்பாடு உள்ளது.",
        "From": "9000000001"
    })
    assert res_wa.status_code == 200
    wdata = res_wa.json()
    assert wdata["language"] == "ta"

    # RapidPro DPG webhook intake (Hindi)
    res_rp = client.post("/webhook/rapidpro", json={
        "contact": {"urn": "tel:+919876543210"},
        "text": "वाराणसी में रामपुर गाँव की सड़क बहुत खराब है।"
    })
    assert res_rp.status_code == 200
    rp_data = res_rp.json()
    assert rp_data["status"] == "success"
    assert "ticket_id" in rp_data
    assert "voice_reply" in rp_data



def test_p3_classification_macro_f1():
    """P3: Macro-F1 >= 0.75 on held-out multilingual test set."""
    rep_file = RESULTS / "classification_report.json"
    assert rep_file.exists(), "classification_report.json missing"
    rep = json.loads(rep_file.read_text(encoding="utf-8"))
    winner = rep["winner"]
    macro_f1 = rep["candidates"][winner]["overall_macro_f1"]
    assert macro_f1 >= 0.75, f"Macro-F1 {macro_f1} < 0.75"


def test_p4_language_f1_equity():
    """P4: Max inter-language F1 gap <= 0.10."""
    rep_file = RESULTS / "classification_report.json"
    rep = json.loads(rep_file.read_text(encoding="utf-8"))
    gap = rep.get("inter_language_gap", 1.0)
    assert gap <= 0.10, f"Inter-language gap {gap} > 0.10"


def test_p5_geocoding_accuracy():
    """P5: District-level geocoding accuracy >= 80%."""
    geo_file = RESULTS / "geocoding_report.json"
    assert geo_file.exists(), "geocoding_report.json missing"
    geo = json.loads(geo_file.read_text(encoding="utf-8"))
    acc = geo.get("district_accuracy_all", 0.0)
    assert acc >= 0.80, f"Geocoding accuracy {acc} < 0.80"


def test_p6_dedup_f1():
    """P6: Pairwise F1 >= 0.85 on labeled duplicate set."""
    dedup_file = RESULTS / "dedup_report.json"
    assert dedup_file.exists(), "dedup_report.json missing"
    dedup = json.loads(dedup_file.read_text(encoding="utf-8"))
    f1 = dedup["test"]["pairwise_f1"]
    assert f1 >= 0.85, f"Dedup F1 {f1} < 0.85"


def test_p7_hotspots_count():
    """P7: Surfaced >= 10 valid district hotspots."""
    m5_file = RUNS / "M5_report.json"
    assert m5_file.exists(), "M5_report.json missing"
    m5 = json.loads(m5_file.read_text(encoding="utf-8"))
    n_hot = m5["hotspots"]["n_district_category_hotspots"]
    assert n_hot >= 10, f"Hotspot count {n_hot} < 10"


def test_p8_recommendation_card_fields():
    """P8: Each recommendation card contains all required fields."""
    prio_file = RESULTS / "priorities.json"
    assert prio_file.exists(), "priorities.json missing"
    prios = json.loads(prio_file.read_text(encoding="utf-8"))
    assert len(prios) >= 10, "Fewer than 10 recommendation cards"
    required_keys = {"rank", "category", "location", "demand_intensity", "deprivation_score", "scheme_match", "cost_per_beneficiary_proxy", "priority", "components"}
    for card in prios[:10]:
        assert required_keys.issubset(card.keys()), f"Card missing keys: {required_keys - set(card.keys())}"


def test_p9_impact_engine_decay_and_placebo():
    """P9: Demand decay post-treatment and in-space placebo p <= 0.10."""
    imp_file = RESULTS / "impact_report.json"
    assert imp_file.exists(), "impact_report.json missing"
    imp = json.loads(imp_file.read_text(encoding="utf-8"))
    valid_districts = [d for d in imp["districts"] if d.get("status") == "ok"]
    assert len(valid_districts) >= 3, "Fewer than 3 valid treated districts"
    for d in valid_districts:
        assert d["demand_decay_effect"] < 0, f"No demand decay for {d['district']} (effect={d['demand_decay_effect']})"
        assert d["inspace_placebo_pvalue"] <= 0.10, f"Placebo p {d['inspace_placebo_pvalue']} > 0.10 for {d['district']}"


def test_p10_openapi_spec_valid():
    """P10: OpenAPI 3.1 specification validates cleanly."""
    from openapi_spec_validator import validate
    yaml_file = API_DIR / "openapi.yaml"
    assert yaml_file.exists(), "openapi.yaml missing"
    spec = yaml.safe_load(yaml_file.read_text(encoding="utf-8"))
    validate(spec)


def test_p11_privacy_audit():
    """P11: Privacy audit finds 0 raw PII and 0 retained audio files."""
    audit_file = RESULTS / "privacy_audit.txt"
    assert audit_file.exists(), "privacy_audit.txt missing"
    content = audit_file.read_text(encoding="utf-8")
    assert "raw_phone_numbers_in_persisted_data: 0" in content
    assert "retained_audio_files: 0" in content
    assert "raw_phone_numbers_in_results: 0" in content
    assert "CLEAN" in content


def test_p12_google_ai_vision_inspection():
    """P12: Google Gemini Multimodal Vision inspects citizen damage photos."""
    import google_ai_service
    res = google_ai_service.analyze_infrastructure_photo(
        image_b64="sample_damage_photo_bytes",
        category_hint="roads",
        citizen_text="वाराणसी में सड़क पर गहरा गड्ढा है"
    )
    assert res["visual_verification_passed"] is True
    assert res["infrastructure_category"] == "roads"
    assert res["severity_score"] >= 1.0 and res["severity_score"] <= 5.0
    assert "remediation" in res or "recommended_remediation" in res


def test_p13_google_ai_policy_brief():
    """P13: Google Gemini Policy Agent generates Cabinet Policy Briefs."""
    import google_ai_service
    prio_file = RESULTS / "priorities.json"
    assert prio_file.exists(), "priorities.json missing"
    prios = json.loads(prio_file.read_text(encoding="utf-8"))
    memo = google_ai_service.generate_policy_brief(prios[0])
    assert "Cabinet Policy Brief" in memo["memo_title"]
    assert "executive_summary" in memo
    assert "gatishakti_alignment" in memo
    assert memo["projected_demand_decay_pct"] > 0


def test_p14_brics_cross_border():
    """P14: BRICS Cross-Border Scalability Engine supports India, Brazil, and South Africa."""
    import brics_adapter
    nations = brics_adapter.list_supported_brics_nations()
    assert len(nations) >= 3, "Fewer than 3 BRICS nations supported"
    isos = {n["iso"] for n in nations}
    assert {"IND", "BRA", "ZAF"}.issubset(isos)
    bra = brics_adapter.get_brics_country_profile("BRA")
    assert "IBGE" in bra["spatial_gazetteer_standard"]
    assert "PAC" in bra["primary_infrastructure_schemes"]["roads"]


def test_p15_cpgrams_integration():
    """P15: DARPG CPGRAMS bi-directional adapter correctly creates tickets and batch sync payloads."""
    import cpgrams_adapter
    prio_file = RESULTS / "priorities.json"
    prios = json.loads(prio_file.read_text(encoding="utf-8"))
    
    # Test single ticket formatting
    ticket = cpgrams_adapter.create_cpgrams_ticket(prios[0])
    assert "DARPG/P/" in ticket["grievance_registration_number"]
    assert ticket["administrative_routing"]["ministry"] in [m[0] for m in cpgrams_adapter.MINISTRY_MAPPING.values()]
    assert ticket["statutory_sla_days"] in [15, 30]
    assert ticket["intelligence_metrics"]["priority_tier"] in ["P1_NATIONAL_HOTSPOT", "P2_ELEVATED_DEMAND"]

    # Test batch sync
    batch = cpgrams_adapter.sync_high_priority_batch_to_cpgrams(prios[:5])
    assert batch["tickets_dispatched"] == 5
    assert batch["status"] == "BATCH_DISPATCH_SUCCESSFUL"
    assert "NIC-ACK" in batch["acknowledgment_receipt"]


def test_p16_dashboard_gis_and_presentation():
    """P16: Self-contained dashboard contains Leaflet GIS and presentation deck exists."""
    from config import DASHBOARD
    dash_file = DASHBOARD / "index.html"
    assert dash_file.exists(), "dashboard/index.html missing"
    dash_html = dash_file.read_text(encoding="utf-8")
    assert "leaflet" in dash_html.lower() or "L.map" in dash_html
    assert "CPGRAMS" in dash_html
    assert "Cabinet Project Dossier" in dash_html or "Cabinet" in dash_html and "Dossier" in dash_html

    deck_file = DASHBOARD / "presentation.html"
    assert deck_file.exists(), "dashboard/presentation.html missing"
    deck_html = deck_file.read_text(encoding="utf-8")
    assert "Slide 1 / 12" in deck_html
    assert "toggleFullscreen" in deck_html

