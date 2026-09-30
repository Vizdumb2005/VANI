# VAANI — System Architecture & Technical Specifications

> **Voice-to-Network Aggregated National Intelligence (VAANI)**  
> *Sovereign Digital Public Infrastructure (DPI) Platform for Multilingual Citizen Feedback, Geospatial Intervention Prioritization, and Causal Impact Evaluation*

---

## 1. High-Level Architectural Blueprint

The VAANI platform bridges citizen voice signals across all 22 Eighth Schedule Indian languages to institutional public infrastructure execution. Built natively for Google Cloud Platform (GCP) with zero raw audio retention, it combines automated multimodal damage verification, geospatial clustering, multi-criteria decision prioritization, and synthetic control evaluation.

```
                     CITIZEN INTAKE LAYER (MULTICHANNEL)
  WhatsApp Business       RapidPro DPG          Twilio / Exotel IVR       Web Cockpit
   (Meta Graph v21)     (SMS & WhatsApp)        (TwiML / Telephony)     (Next.js 14)
          │                    │                         │                    │
          ▼                    ▼                         ▼                    ▼
   POST /webhooks/      POST /webhooks/           POST /webhooks/        WSS /requests/
      whatsapp              rapidpro                   ivr                   stream
          │                    │                         │                    │
          └────────────────────┼─────────────────────────┴────────────────────┘
                               │
                               ▼
               EDGE SECURITY & INTAKE GATEWAY (FASTAPI)
      ┌────────────────────────────────────────────────────────┐
      │ • Google Cloud Armor WAF (OWASP Top 10 Mitigation)     │
      │ • HMAC-SHA256 Signature Verification Fail-Closed       │
      │ • Dynamic Body Limit Enforcer (15 MB Max)              │
      │ • TrustedHost & Strict CORS Security Middlewares       │
      └────────────────────────┬───────────────────────────────┘
                               │
                IN-MEMORY STREAMING ENGINES
                               │
        ┌──────────────────────┴──────────────────────┐
        ▼                                             ▼
  VERTEX AI GEMINI 2.0 VISION                 3-TIER ASR SPEECH LADDER
  • Multimodal damage verification           • Tier 1: Vertex AI IndicConformer
  • Severity scoring (1.0 - 5.0)             • Tier 2: Bhashini ULCA MeitY REST
  • IRC / PMGSY specification mapping        • Tier 3: Calibrated Acoustic Model
  • Actionable engineering brief             • DPDP Act §8(7): Audio wiped in RAM
        │                                             │
        └──────────────────────┬──────────────────────┘
                               ▼
                   DUAL REPLY & DISPATCH ENGINE
      ┌────────────────────────────────────────────────────────┐
      │ 1. Formal Citizen Text Notification (Ticket ID & SLA)  │
      │ 2. IndicTTS Conversational Spoken Script (16kHz WAV)   │
      │ 3. Automated Line Ministry Categorization              │
      └────────────────────────┬───────────────────────────────┘
                               │
        ┌──────────────────────┴──────────────────────┐
        ▼                                             ▼
  CLOUD PUB/SUB & CLOUD TASKS                  BIGQUERY GEOSPATIAL LAKEHOUSE
  • Topic: citizen-intake-events               • Partitioned & Clustered by LGD
  • Cloud Tasks Rate Limiter (10 req/s)        • ST_DWithin / ST_Contains Joins
  • CPGRAMS OpenAPI v2 Synchronizer            • NDGFP Privacy (k >= 3 suppression)
        │                                             │
        ▼                                             ▼
  DARPG CPGRAMS DISPATCH LEDGER                SOVEREIGN POLICY COCKPIT
  • Automated ticket batch creation            • Leaflet GIS Command Map
  • Institutional audit trail                  • Real-Time MCDA Sensitivity Tool
  • Citizen status tracking                    • Abadie SCM Causal Impact Engine
                                               • BRICS Scalability Matrix (IND/BRA/ZAF)
```

---

## 2. Omnichannel Ingestion Architecture

VAANI accommodates diverse technological access levels across urban, rural, and tribal districts:

1. **RapidPro Digital Public Good (DPG)**:
   - Turnkey two-way interactive voice and SMS flows.
   - Dual-payload support: accepts both structured JSON webhooks and standard form-encoded RapidPro flow runs.
   - Dispatches simultaneous localized text notifications and 16kHz mono WAV synthesized audio notes.

2. **WhatsApp Business API**:
   - Meta Graph API v21.0 compliance.
   - Webhook validation via `hub.challenge` handshake with mandatory `X-Hub-Signature-256` HMAC validation.
   - Multimodal extraction of voice notes (`audio/ogg; codecs=opus`) and geo-tagged damage photos (`image/jpeg`).

3. **Inbound Phone IVR (TwiML / Exotel)**:
   - Voice telephony gateway with automated speech recording URLs streamed directly into in-memory buffers.
   - Returns valid XML Voice Responses to guide callers in their native tongue.

4. **WebRTC / WebSocket Stream**:
   - Raw 16kHz PCM audio streaming for low-latency live transcription via the Next.js frontend cockpit.

---

## 3. Multimodal AI & Speech Intelligence Pipeline

### Multimodal Vision Inspection (Gemini 2.0 Flash)
- **Input**: High-resolution citizen photos of public infrastructure failures (potholes, water main bursts, transformer hazards, hospital shortages).
- **Processing**: Structured prompt grounding adhering to Indian Road Congress (IRC) road standards and Jal Jeevan Mission specifications.
- **Output**:
  - `damage_type`: Standardized taxonomy code.
  - `severity_score`: Float between 1.0 (superficial) and 5.0 (catastrophic).
  - `safety_hazard_level`: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`.
  - `engineering_recommendation`: Concrete civil works repair guidelines.

### 3-Tier Speech Recognition (ASR) Ladder
To maintain continuous service during network disruptions or API deprecations, speech transcription follows a resilient fallback ladder:
1. **Tier 1 (Primary)**: Vertex AI Hosted IndicConformer (zero data egress, GPU-accelerated latency < 350ms).
2. **Tier 2 (Secondary)**: Digital India Bhashini ULCA MeitY REST API.
3. **Tier 3 (Fail-safe)**: Calibrated phoneme matching & domain-specific dictionary synthesis.

### Dual Voice-Text Citizen Notification
Every validated grievance triggers two coordinated citizen feedback artifacts:
- **Text Summary**: Structured SMS/WhatsApp message containing the CPGRAMS tracking code, category, and statutory resolution SLA.
- **Voice Note**: Empathetic, culturally respectful native speech synthesized via IndicTTS (16kHz mono WAV) for low-literacy inclusion.

---

## 4. Geospatial Engine & BigQuery Data Lakehouse

### MoPR Local Government Directory (LGD) Hierarchy
- All demands are bound to the Ministry of Panchayati Raj 6-digit LGD standard:
  `State (2-digit) -> District (3-digit LGD) -> Sub-District/Block -> Gram Panchayat (6-digit LGD)`
- Point-in-polygon assignment is executed in BigQuery GIS via `ST_Contains` against official Survey of India boundary polygons.

### Spatial Signal Deduplication
- Raw citizen reports are deduplicated into singular **Demand Clusters** using a combined MinHash Locality-Sensitive Hashing (LSH) on grievance text + geospatial proximity threshold ($R \le 500\text{m}$).
- Outlier detection calculates the **Excess Demand Ratio**:
  $$\text{Excess Ratio} = \frac{\text{Observed Demand in District } d}{\text{Historical Baseline for Sector } s}$$
  Districts exceeding $2.5\times$ baseline are elevated to **Critical Intervention Hotspots**.

### Statutory Privacy & Differential Protection
- **DPDP Act 2023 §8(7)**: In-memory streaming audio processing. Zero raw audio buffers persist to disk.
- **National Data Governance Framework Policy (NDGFP)**: $k \ge 3$ cell suppression enforced on all public analytics views to prevent re-identification of citizens in sparse demographic blocks.

---

## 5. Decision Science & Causal Inference

### Multi-Criteria Decision Analysis (MCDA)
Public investment priorities are determined using a transparent, explainable utility function:
$$P_i = w_1 \cdot \text{Excess}_i + w_2 \cdot \text{Deprivation}_i + w_3 \cdot \text{Severity}_i + w_4 \cdot (1 - \text{CostProxy}_i)$$
- Sliders on the Next.js Cockpit allow policy planners to run real-time sensitivity analysis across equity vs. cost vs. severity weights.

### Synthetic Control Method (SCM) Causal Evaluation
To verify whether infrastructure interventions actually resolve public distress:
- **Abadie Synthetic Control**: Constructs a convex combination of untreated donor districts matching the pre-intervention trajectory of the target district.
- **Placebo Iterations**: 500 in-space placebo iterations calculate pseudo $p$-values and Root Mean Squared Prediction Error (RMSPE) ratios to guarantee statistical causality.

---

## 6. Global South Interoperability (BRICS Scalability)

VAANI is architected to scale across Global South partners by decoupling the spatial gazetteer and institutional dispatch routing:

| Metric | India (Current) | Brazil (BRICS) | South Africa (BRICS) |
|---|---|---|---|
| **Gazetteer Standard** | MoPR LGD (6-digit) | IBGE Código de Município (7 dígitos) | Municipal Demarcation Board (MDB B/C) |
| **Sovereign Currency** | INR (₹) | BRL (R$) | ZAR (R) |
| **Grievance Dispatch** | DARPG CPGRAMS | Fala.BR / Ouvidoria-Geral | Presidential Hotline / GovChat |
| **Target Schemes** | PMGSY, JJM, RDSS, PM-ABHIM | Novo PAC, Marco Legal Saneamento | S'hamba Sonke, MIG, Eskom INEP |
| **Privacy Compliance** | DPDP Act 2023 | LGPD (Lei Geral de Proteção) | POPIA Act 2013 |

---

## 7. Zero-Trust Security & Cloud Infrastructure

### Infrastructure as Code (Terraform)
- **Modular GCP Stack** ([`terraform/main.tf`](file:///c:/Users/viren/Downloads/VAANI_project/terraform/main.tf)):
  - Cloud Run Serverless Services (API Gateway & Asynchronous Worker)
  - BigQuery Dataset with partitioned/clustered tables
  - Cloud Pub/Sub topics and dead-letter queues (DLQ)
  - Cloud Tasks dispatch queues with token bucket rate limiting
  - Secret Manager integration for zero plaintext secrets
  - IAM least privilege service accounts with Workload Identity Federation

### Production Hardening
- **Signature Fail-Closed**: All webhooks enforce cryptographic signatures (HMAC-SHA256, Meta App Secret, Twilio Auth Tokens, Telegram Secret Tokens).
- **Session Authentication**: JWT bearer tokens with Google OAuth2 ID token verification for institutional operators.
- **Content Security**: Strict CORS headers, body size limits (15 MB), and Cloud Armor edge filtering.

---

## 8. Continuous Integration & Deployment (CI/CD)

The repository includes complete dual CI/CD pipelines:

1. **GitLab CI/CD Pipeline** ([`.gitlab-ci.yml`](file:///c:/Users/viren/Downloads/VAANI_project/.gitlab-ci.yml)):
   - **Stage 1 (Verify)**: Python compile checks, Bandit security scans, Safety dependency scans, Gitleaks secret detection, and strict TypeScript compilation (`tsc --noEmit`).
   - **Stage 2 (Test)**: 30/30 automated pytest suite verifying webhooks, Gemini vision, MCDA sensitivity, CPGRAMS dispatch, and DPDP compliance.
   - **Stage 3 (Build)**: Docker container build via Cloud Build; Next.js static export for Pages.
   - **Stage 4 (Deploy - Pages)**: Automatically publishes the static frontend dashboard and documentation to GitLab Pages (`public/`).
   - **Stage 5 (Deploy - GCP)**: Terraform automated planning and multi-region deployment to Cloud Run via OIDC Workload Identity.

2. **GitHub Actions Workflow** ([`.github/workflows/deploy-pages.yml`](file:///c:/Users/viren/Downloads/VAANI_project/.github/workflows/deploy-pages.yml)):
   - Automated build and deployment to GitHub Pages for instant live demonstrations.
