# VAANI — Project Bible: Operational Contract (specs.md)

**Project**: VAANI (Voice-to-Network Aggregated National Intelligence)
**Type**: Hackathon build — multilingual citizen-feedback-to-policy Digital Public Good
**Team**: 1 human lead + AI-agent workforce (Aegis-DS orchestration model)
**Timeline**: Registration closes in ~1.5 days; build window assumed 36–48 hours. All milestones sized for a solo lead directing parallel AI agents.

---

## 1. SCOPE

### In-scope
1. **Omnichannel ingestion, working end-to-end in the live demo**: (a) voice via WhatsApp voice notes (primary) and web voice capture (secondary); (b) text via WhatsApp text messages and a web/PWA form. IVR is a stretch goal only.
2. **Multilingual coverage**: minimum 3 Indian languages in the working demo (Hindi + Tamil + one low-resource language, e.g. Marathi or Bengali), with architecture validated for all 22 scheduled languages.
3. **Semantic understanding**: auto-classification of every request into a 7-category national infrastructure taxonomy (roads & connectivity, water & sanitation, power, health, education, public safety, other civic); location extraction to district level (village/ward where resolvable); deduplication of repeated reports of the same ground-truth issue.
4. **Fusion with open national data**: Census 2011 village/district demographics, district-level deprivation proxies, LGD (Local Government Directory) code registry, scheme coverage placeholders (Jal Jeevan Mission / PMGSY / AMRUT dashboards).
5. **Demand hotspot detection & prioritization**: district/sub-district hotspot surfacing plus a ranked project-recommendation engine (multi-criteria score with explainable components).
6. **Impact measurement engine**: counterfactual (synthetic-control-style) analysis demonstrating whether demand signals decay after a simulated project completion — the closed loop.
7. **Policymaker cockpit**: web dashboard with national map heatmap, drill-down to demand clusters, recommendation cards, and the before/after impact view.
8. **DPI packaging**: open API spec (OpenAPI 3.1) for the civic-request protocol, open-source repo structure, privacy by design.

### Out-of-scope (explicitly)
- Production integration with real government systems (CPGRAMS, UMANG, MyGov) — adapters are stubbed with documented contracts.
- Any real citizen PII — the platform is built and demoed entirely on open + synthetic data.
- Authentication/federation, payments, mobile native apps.
- Real-time streaming at national scale (batch/scheduled recompute is acceptable; architecture must document the scale-out path).

---

## 2. DATA CONTRACTS

### 2.1 Raw citizen request (ingestion schema)
| Field | Type | Constraint |
|---|---|---|
| request_id | UUID | generated at ingestion |
| channel | enum{whatsapp_voice, whatsapp_text, web_voice, web_text} | required |
| language | ISO-639 (hi, ta, mr, ...) | auto-detected (IndicLID), never user-declared |
| audio_uri | nullable string | required for voice channels, 16kHz mono FLAC/WAV |
| raw_text | string | ASR output (voice) or original message (text) |
| received_at | ISO-8601 timestamp (IST) | required |
| device_hash | string | salted one-way hash; no raw phone numbers stored |

Null tolerance: `audio_uri` and `raw_text` are mutually nullable at intake, but a record with **neither** after processing is quarantined (not dropped) and counted in the data-quality report.

### 2.2 Normalized demand signal (post-processing schema)
| Field | Type | Constraint |
|---|---|---|
| signal_id | UUID | 1:1 with deduplicated issue cluster membership |
| request_ids | array[UUID] | all raw requests collapsed into this signal |
| category | enum{roads, water_sanitation, power, health, education, public_safety, other} | confidence >= 0.60 else flagged `low_confidence` |
| lgd_state_code / lgd_district_code | int | resolved against LGD registry; unresolved = "UNKNOWN" + flagged |
| geo_confidence | enum{exact_subdistrict, district, state, unresolved} | |
| urgency_score | float 0–1 | heuristic composite: hazard words + category severity + repetition velocity |
| first_reported_at / last_reported_at | timestamps | |
| report_count | int | dedup intensity |

### 2.3 Fusion tables (open data)
- `district_demographics`: Census 2011 — population, literacy, SC/ST share, main-worker ratio (district grain).
- `deprivation_index`: composite z-score built from Census + NFHS-5 district indicators.
- `scheme_coverage`: district-level binary/quantitative coverage per scheme (synthetic where open dashboards are scrape-inconsistent).
- `sanctioned_projects`: simulated project ledger (synthetic, for impact engine).

### 2.4 Data quality gates (run before any model sees data)
- 100% schema validation pass on ingested batch (pandera or hand-rolled validator); reject-rate reported, never silently coerced.
- Language distribution sanity check: if any demo language < 5% of corpus, flag corpus imbalance.
- Geocode null rate must be reported per batch; > 15% unresolved triggers a geocoding pipeline investigation before fusion.

---

## 3. EVALUATION CRITERIA

### 3.1 Primary optimization metric
**End-to-end category classification Macro-F1 >= 0.75** on a held-out, temporally-split, multilingual test set (all 3 demo languages, both channels). Macro (not micro) because per-language performance equity is the product's core claim.

### 3.2 Secondary diagnostic metrics
- ASR word error rate per demo language (benchmarked on a 50-utterance held-out set).
- Geocoding accuracy: % of demand signals with correct district vs ground truth.
- Deduplication: pairwise precision/recall on a labeled duplicate set.
- Prioritization rank stability: Spearman correlation of top-20 ranked projects across bootstrap resamples >= 0.80.

### 3.3 Guardrail metrics (non-negotiable)
- **Privacy**: zero raw PII persisted; audio deleted after transcription; device identifiers stored only as salted hashes. Verified by a scripted audit over the database.
- **Latency**: voice note sent → visible on dashboard <= 60 seconds (p95) in the demo environment.
- **Fairness**: per-language Macro-F1 gap <= 0.10 between the best and worst demo language.
- **Reproducibility**: one command (`make demo-rebuild`) rebuilds the corpus, models, and dashboard from seed.

---

## 4. HARD PASS/FAIL MATRIX

The project is certified demo-ready only when every row passes, evidenced by a concrete artifact.

| # | Criterion | Threshold | Evidence artifact |
|---|---|---|---|
| P1 | Multilingual voice ingestion works live | >= 2 languages transcribed correctly (human-judged) on stage | `results/demo_transcripts.jsonl` |
| P2 | Text ingestion works live | message → dashboard <= 60s | dashboard event log |
| P3 | Category classification Macro-F1 | >= 0.75 on held-out multilingual test set | `results/classification_report.json` |
| P4 | Per-language F1 equity | max inter-language gap <= 0.10 | same report |
| P5 | Geocoding | >= 80% district-level accuracy | `results/geocoding_report.json` |
| P6 | Dedup | >= 0.85 pairwise F1 on labeled set | `results/dedup_report.json` |
| P7 | Hotspots | map renders >= 10 valid district hotspots from >= 500 synthetic requests | dashboard screenshot `results/hotspots.png` |
| P8 | Recommendation cards | each top-10 card has: category, location, demand intensity, deprivation score, scheme match, cost-per-beneficiary proxy | dashboard inspection |
| P9 | Impact engine | demo scenario shows demand-decay in treated district vs synthetic control + passes in-time placebo test | `results/impact_report.json` + dashboard view |
| P10 | Open API | OpenAPI 3.1 spec validates; one external "hello" call succeeds | `api/openapi.yaml` |
| P11 | Privacy audit | scripted audit finds 0 raw phone numbers, 0 retained audio | `results/privacy_audit.txt` |
| P12 | Rebuild | `make demo-rebuild` succeeds from clean checkout | CI-style log |
| P13 | Final report | polished .docx summarizing architecture, results, and DPI story | `results/VAANI_Final_Report.docx` |

**Immutable-target rule**: if P3 or P4 is unreachable because the synthetic corpus is too noisy, the corpus generation is fixed — the threshold is never lowered without an explicit project review with the team lead.

---

## 5. ENVIRONMENT & INFRASTRUCTURE
- Build/runtime: Linux sandbox or the lead's own machine; Python 3.12.
- ASR: IndicConformer-600M-multilingual (self-hosted) with Bhashini ULCA pipeline API as fallback for demo reliability.
- Stack: FastAPI, PostgreSQL + PostGIS (or GeoPandas + DuckDB for the hackathon scale), Next.js/React dashboard, Whisper-family models via HuggingFace.
- Experiment tracking: structured JSON logs per run in `results/runs/` (no MLflow dependency — keep the build lean).
- All random seeds hardcoded: `SEED = 42` everywhere.
