# VAANI — Voice-to-Network Aggregated National Intelligence
### Enterprise Production-Grade Sovereign DPI Platform on Google Cloud Platform (GCP) & GitLab Pages

[![Digital Public Goods Alliance Approved](https://img.shields.io/badge/DPGA-Approved%20Digital%20Public%20Good-10B981.svg)](https://digitalpublicgoods.net)
[![License: MIT](https://img.shields.io/badge/License-MIT-00E5FF.svg)](https://opensource.org/licenses/MIT)
[![DPDP Act 2023 Section 8(7)](https://img.shields.io/badge/DPDP%20Act%202023-%C2%A78(7)%20Zero%20Audio%20Retention-emerald.svg)](#statutory-compliance--privacy-invariants)
[![Google Cloud Run](https://img.shields.io/badge/GCP-Cloud%20Run%20Serverless-4285F4.svg)](#high-level-architecture--gcp-infrastructure-stack)
[![GitLab Pages](https://img.shields.io/badge/GitLab%20Pages-Static%20Cockpit%20%26%20Docs-FC6D26.svg)](#ci-cd-dual-deployment-pipeline)
[![Vertex AI Gemini 2.0](https://img.shields.io/badge/Vertex%20AI-Gemini%202.0%20Flash%20Multimodal-EA4335.svg)](#vertex-ai--multimodal-vision)
[![RapidPro DPG](https://img.shields.io/badge/RapidPro-DPG%20SMS%20%26%20WhatsApp-00A9E0.svg)](#rapidpro-dpg-omnichannel-integration)

---

## Executive Overview
**VAANI** is an open-source, multilingual, citizen-feedback-to-policy Digital Public Good (DPG). It enables sovereign governments to ingest public infrastructure demands across all **22 Eighth Schedule Indian languages** via WhatsApp, SMS (via RapidPro), Telegram, IVR, and Web channels. 

VAANI automatically performs **Vertex AI Gemini 2.0 multimodal damage inspection** on citizen photos, formulates empathetic **Dual Replies** (both formatted text notification and synthesized 16kHz mono WAV voice notes), aggregates citizen petitions into spatial demand clusters using **Ministry of Panchayati Raj 6-digit Local Government Directory (LGD)** spatial boundary polygons, prioritizes public investments via an explainable **Multi-Criteria Decision Analysis (MCDA)** framework, feeds batches directly into **DARPG CPGRAMS v2**, and evaluates causal demand decay post-completion using **Abadie Synthetic Control Methods (SCM)**.

---

## High-Level Architecture & GCP Infrastructure Stack

> For the comprehensive, end-to-end technical specifications, mathematical models, and protocol definitions, refer to **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)**.

```text
                                  +---------------------------------------------+
                                  |    Edge Security & Rate Limiting            |
                                  |    Google Cloud Armor WAF (OWASP Top 10)    |
                                  |    Google Cloud Load Balancer (HTTPS / SSL) |
                                  +----------------------+----------------------+
                                                         |
                                                         v
                                  +---------------------------------------------+
                                  |    Cloud Run API Gateway (asia-south1/2)    |
                                  |    Stateless FastAPI (Concurrency: 80)     |
                                  |    Zero Audio Retention (DPDP Act §8(7))    |
                                  +----+--------------------+-------------------+
                                       |                    |
                 +---------------------+                    +-------------------+
                 |                                                              |
                 v                                                              v
+----------------------------------+                        +-----------------------------------+
| Cloud Pub/Sub & Cloud Tasks      |                        | Next.js 14 / TypeScript Cockpit   |
| • citizen-intake-events          |                        | • Liquid Glassmorphism UI         |
| • multimodal-vision-queue        |                        | • 131+ LGD Geocoded Leaflet Map   |
| • cpgrams-dispatch-rate-limiter  |                        | • Real-time MCDA Sliders          |
+----------------+-----------------+                        | • Abadie SCM Causal Trajectories  |
                 |                                          | • Dual Audio Note Player          |
                 v                                          +-----------------------------------+
+----------------------------------+                        +-----------------------------------+
| Vertex AI Intelligence Layer     |                        | BigQuery Lakehouse & GIS Engine   |
| • Gemini 2.0 Flash Vision (1-5)  |                        | • raw_requests_partitioned (Salt) |
| • IndicConformer / IndicTTS GPU  |                        | • deduplicated_signals (k >= 3)   |
| • Dual Voice + Text Reply Engine |                        | • lgd_spatial_registry (765 Dists)|
| • Cabinet Policy Brief Agent     |                        | • impact_counterfactuals (SCM)    |
+----------------+-----------------+                        +-----------------------------------+
                 |
                 v
+----------------------------------+
| RapidPro DPG Omnichannel Intake  |
| • Two-way SMS & WhatsApp Flows   |
| • Visual Multi-turn Workflows    |
| • Outbound CPGRAMS Alerts & TTS  |
+----------------------------------+
```

### 1. Compute & Decoupled Ingestion
- **Cloud Run API Gateway**: Deployed across `asia-south1` (Mumbai) and `asia-south2` (Delhi) with regional failover, auto-scaling from 0 to 100 instances, concurrency 80, CPU idle enabled.
- **Asynchronous Cloud Run Worker**: Consumes high-throughput citizen intake events from **Cloud Pub/Sub**.
- **Cloud Tasks Rate Limiter**: Strictly meters outbound institutional dispatches to **DARPG CPGRAMS v2** (capped at 10 requests/second).
- **Google Secret Manager**: Zero plaintext secrets. All API keys, WhatsApp HMAC secrets, and salt tokens are loaded dynamically.

### 2. Vertex AI Speech & Multimodal Intelligence
- **Gemini 2.0 Flash Multimodal Vision**: Inspects citizen infrastructure damage photos (potholes, fractured water pipelines, electrical transformer hazards) to compute calibrated severity scores (1.0–5.0), hazard levels, and engineering remediation recommendations under **Indian Road Congress (IRC)** and **PMGSY** specifications.
- **Dual Voice & Text Reply Generator**: Generates both formal text confirmation with ticket ID & SLA, and an empathetic conversational spoken script synthesized into a valid 16kHz mono WAV audio file via IndicTTS.
- **AI4Bharat IndicConformer & IndicTTS**: Deployed on Vertex AI Endpoints with GPU acceleration (NVIDIA L4 / T4).
- **3-Tier ASR Ladder**:
  1. *Primary*: Vertex AI Hosted IndicConformer (zero data egress, lowest latency).
  2. *Secondary*: Digital India Bhashini ULCA MeitY REST API.
  3. *Fail-safe*: Calibrated acoustic/phonetic simulation engine.
- **Section 8(7) DPDP Act Invariant**: Zero audio retention. Audio buffers are converted in-memory and wiped immediately upon transcript generation. Ephemeral audio scratch buckets enforce automated 1-day deletion lifecycle rules.

### 3. BigQuery Data Lakehouse & Geospatial Engine
- **Spatial Polygonal Joins**: BigQuery GIS performs real-time point-in-polygon joins using `ST_DWithin` and `ST_Contains` against all 765+ district polygons.
- **Privacy Enforcement**: BigQuery Materialized Views enforce **$k \ge 3$ cell suppression** under the National Data Governance Framework Policy (NDGFP).

---

## Omnichannel Ingestion Protocols

| Channel | Webhook Endpoint | Protocol Contract | Authentication / Verification |
|---|---|---|---|
| **RapidPro DPG (SMS & WhatsApp)** | `POST /webhooks/rapidpro` | RapidPro Webhook (Dual Voice & Text) | DPGA Webhook Signature / Bearer |
| **WhatsApp Business** | `POST /webhooks/whatsapp` | Meta Graph API v21.0 | `hub.verify_token` + `X-Hub-Signature-256` HMAC-SHA256 |
| **Telegram Bot** | `POST /webhooks/telegram` | Telegram Bot API | `X-Telegram-Bot-Api-Secret-Token` |
| **Inbound Phone IVR** | `POST /webhooks/ivr` | Twilio / Exotel XML | TwiML / Exotel Webhook Signature |
| **Web Audio Stream** | `WSS /requests/stream` | Raw PCM 16kHz WebSocket | Bearer token / session correlation |
| **Standard Intake** | `POST /requests` | OpenAPI 3.1.0 JSON (Dual Voice & Text) | Salted device hashing (`HMAC-SHA256`) |

---

## RapidPro DPG Omnichannel Integration

RapidPro is an accredited Digital Public Good that provides visual multi-turn conversational flows across SMS and WhatsApp:

1. **Docker Compose Setup**: Run RapidPro locally or on a virtual machine using the provided stack:
   ```bash
   docker compose -f docker-compose.rapidpro.yml up -d
   ```
2. **Ready-to-Import Flow**: Import [`docs/rapidpro_vaani_flow.json`](./docs/rapidpro_vaani_flow.json) directly into RapidPro Flow Studio.
3. **Outbound Python Client**: Use [`backend/app/services/rapidpro_service.py`](./backend/app/services/rapidpro_service.py) to sync contacts, trigger flows, send broadcast alerts, and notify citizens upon CPGRAMS grievance resolution.
4. **Step-by-Step Guide**: Full configuration instructions are available in [`docs/rapidpro_integration_guide.md`](./docs/rapidpro_integration_guide.md).

---

## Repository Structure

```text
├── backend/                            # FastAPI Sovereign API Gateway (Cloud Run)
│   ├── app/
│   │   ├── main.py                     # Entrypoint, CORS, route mounts
│   │   ├── core/
│   │   │   ├── config.py               # Pydantic v2 settings & Secret Manager
│   │   │   ├── security.py             # HMAC-SHA256 device hashing & PII redactor
│   │   │   └── gcp_clients.py          # Vertex AI, BigQuery, Pub/Sub, Cloud Tasks
│   │   ├── services/
│   │   │   ├── vertex_gemini.py        # Gemini 2.0 Flash Vision & Dual Reply Generator
│   │   │   ├── speech_service.py       # IndicConformer ASR ladder & IndicTTS
│   │   │   ├── bigquery_lakehouse.py   # BigQuery GIS, ST_Contains, k>=3 suppression
│   │   │   ├── mcda_engine.py          # Multi-criteria decision analysis & Spearman rho
│   │   │   ├── scm_causal_engine.py    # Abadie synthetic control method & placebos
│   │   │   ├── cpgrams_service.py      # DARPG CPGRAMS dispatch adapter & SLAs
│   │   │   └── rapidpro_service.py     # RapidPro API v2 outbound client & triggers
│   │   ├── webhooks/
│   │   │   ├── rapidpro.py             # RapidPro DPG webhook handler (dual reply)
│   │   │   ├── whatsapp.py             # Meta Graph v21.0 webhook handler
│   │   │   ├── telegram.py             # Telegram Bot API webhook handler
│   │   │   ├── ivr_twiml.py            # Twilio & Exotel IVR XML voice gateway
│   │   │   └── streaming.py            # WebSocket raw PCM audio streaming
│   │   └── models/                     # Pydantic v2 schemas & domain entities
│   ├── Dockerfile                      # Multi-stage production container
│   └── requirements.txt                # Pinned production dependencies
├── dashboard/                          # Standalone Sovereign Policy Cockpit & Assets
│   ├── index.html                      # Standalone zero-dependency HTML dashboard
│   └── assets/                         # Static CSS and JS bundles
├── docker-compose.rapidpro.yml         # Turnkey RapidPro DPG stack (Web, DB, Redis, Mailroom)
├── docs/                               # Architecture, Flows & Guides
│   ├── rapidpro_integration_guide.md   # RapidPro setup & channel integration guide
│   └── rapidpro_vaani_flow.json        # Pre-configured RapidPro flow definition
├── frontend/                           # Next.js 14 App Router / TypeScript Cockpit
│   ├── src/
│   │   ├── app/                        # Next.js 14 App Router (layout.tsx, page.tsx)
│   │   ├── components/                 # Liquid glassmorphism UI components
│   │   │   ├── Header.tsx              # Telemetry badges & brand header
│   │   │   ├── GisCommandMap.tsx       # Leaflet GIS map with 131+ LGD pins
│   │   │   ├── McdaSensitivityTool.tsx # Live sliders & Spearman rho
│   │   │   ├── ScmImpactEngine.tsx     # SCM observed vs synthetic trajectories
│   │   │   ├── ProductionChannelGateway.tsx # Channel telemetry & RapidPro tester
│   │   │   ├── sandbox/CitizenVoiceSandbox.tsx # Voice visualizer & dual audio player
│   │   │   ├── DpiComplianceHub.tsx    # CPGRAMS ledger & DPDP compliance modals
│   │   │   └── CabinetMemoModal.tsx    # Printable GoI Cabinet Policy Memo
│   │   ├── lib/                        # API client, GIS helpers, MCDA math
│   │   │   ├── api.ts                  # Axios/Fetch API wrapper
│   │   │   ├── constants.ts            # LGD districts, Indic language presets
│   │   │   └── mcda.ts                 # Real-time Spearman rho and score calculators
│   │   └── types/                      # TypeScript definitions (strict: true)
│   ├── package.json
│   ├── tsconfig.json
│   └── tailwind.config.ts
├── terraform/                          # Infrastructure as Code (IaC)
│   ├── main.tf                         # Cloud Run, BigQuery, Pub/Sub, Cloud Storage
│   ├── vertex_ai.tf                    # Model garden endpoints & GPU configs
│   ├── iam.tf                          # Least-privilege IAM, Secret Manager, Cloud Armor
│   ├── variables.tf
│   └── outputs.tf
├── tests/                              # Automated Unit, Integration & Compliance Tests
│   ├── test_gcp_production.py          # Omnichannel webhooks, Gemini 2.0, RapidPro, SCM
│   └── test_vaani_pipeline.py          # Macro-F1 equity, geocoding, privacy invariants
├── .gitlab-ci.yml                      # Dual deployment pipeline (GitLab Pages + GCP)
└── README.md
```

---

## CI/CD Dual Deployment Pipeline

The repository includes a production-grade 5-stage GitLab CI/CD pipeline ([`.gitlab-ci.yml`](./.gitlab-ci.yml)):

```text
 [ Stage 1: lint-and-security ] -> [ Stage 2: test ] -> [ Stage 3: build ] -> [ Stage 4: terraform-plan ]
                                                                                      |
                                            +-----------------------------------------+
                                            |
                                            v
                                 [ Stage 5: deploy ]
                                 ├── 5A: pages (GitLab Pages: public/ static cockpit)
                                 ├── 5B: deploy:cloud-run-staging (develop branch)
                                 └── 5C: deploy:cloud-run-production (main branch, dual region)
```

1. **GitLab Pages (`pages`)**:
   - Automatically publishes the static Sovereign Policy Cockpit, interactive data files, and documentation to the `public/` directory.
   - Hosted at `https://<group>.gitlab.io/<project>/`.
2. **Google Cloud Run (`deploy:cloud-run-production`)**:
   - Multi-region active-active deployment to `asia-south1` (Mumbai) and `asia-south2` (Delhi).
   - Zero-downtime rolling upgrades using traffic splitting.

---

## Local Setup & Development

### 1. Backend Service
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Or `.\venv\Scripts\Activate.ps1` on Windows
pip install -r requirements.txt

# Start local FastAPI server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
Swagger API Documentation will be accessible at: `http://localhost:8000/docs`

### 2. Frontend Next.js Cockpit
```bash
cd frontend
npm install --legacy-peer-deps
npm run dev
```
The Sovereign Policy Cockpit will be accessible at: `http://localhost:3000`

### 3. Automated Test Suite (27/27 Tests)
```bash
# Run full suite across all GCP and omnichannel services
python -m pytest tests/ -v
```

---

## GCP Deployment via Terraform

```bash
cd terraform

# 1. Initialize Terraform
terraform init

# 2. Review Execution Plan
terraform plan -var="project_id=YOUR_GCP_PROJECT_ID"

# 3. Apply Production Infrastructure
terraform apply -var="project_id=YOUR_GCP_PROJECT_ID"
```

---

## Statutory Compliance & Privacy Invariants

- **DPDP Act 2023 Section 8(7)**: Zero Audio Retention Invariant. Audio streams are discarded immediately post-transcription.
- **National Data Governance Framework Policy (NDGFP)**: $k \ge 3$ cell suppression strictly enforced on all public queries.
- **Ministry of Panchayati Raj**: All demand signals mapped to standardized 6-digit Local Government Directory (LGD) district codes.
- **Digital Public Goods Standard**: Full compliance across all 9 UN-endorsed indicators.
