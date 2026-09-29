# VAANI — Project Bible: Methodology, Math & Architecture (design.md)

**Grounding note**: every algorithmic choice below is grounded in current published/open evidence, not recollection. Key sources are listed in Section 7 and cited inline as plain URLs (chat-citation markers are intentionally absent from files).

---

## 1. SOLUTION ARCHITECTURE (end-to-end)

```
 CITIZEN SIDE                         PLATFORM                                 POLICYMAKER SIDE
┌─────────────┐   voice notes / text   ┌──────────────────────────────────┐      ┌──────────────────┐
│  WhatsApp    ├──────────────────────►│ 1. INGESTION FABRIC               │      │                  │
│  Web (PWA)  │   (webhook + upload)   │  IndicLID -> ASR -> text          │      │                  │
└─────────────┘                        └───────────────┬──────────────────┘      │                  │
                                                      ▼                         │                  │
                                       ┌──────────────────────────────────┐      │                  │
                                       │ 2. SEMANTIC PIPELINE             │      │                  │
                                       │  classify (7-cat taxonomy)       │      │                  │
                                       │  geocode (NER + LGD registry)     │      │   6. POLICY       │
                                       │  dedup (embeddings + clustering) │      │      COCKPIT     │
                                       │  trust filter (spam/astroturf)   │      │   (dashboard)    │
                                       └───────────────┬──────────────────┘      │      ▲           │
                                                      ▼                         │      │           │
                                       ┌──────────────────────────────────┐      │      │           │
                                       │ 3. FUSION ENGINE (PostGIS/DuckDB) │      │      │           │
                                       │  demand signals x Census/NFHS     │      │      │           │
                                       │  x LGD x scheme coverage          │      └──────┼───────────┘
                                       └───────────────┬──────────────────┘             │
                                                      ▼                                │
                                       ┌──────────────────────────────────┐      ┌──────┴───────────┐
                                       │ 4. ANALYTICS                     │      │  7. OPEN API     │
                                       │  hotspot detection (spatio-      ├──────►  (civic request │
                                       │  temporal clustering)            │      │   protocol)      │
                                       │  prioritization (MCDA ranker)    │      └──────────────────┘
                                       │  agentic scheme-matching (RAG)    │
                                       └───────────────┬──────────────────┘
                                                      ▼
                                       ┌──────────────────────────────────┐
                                       │ 5. IMPACT ENGINE                  │
                                       │  synthetic-control counterfactual│
                                       │  demand-decay measurement        │
                                       └──────────────────────────────────┘
```

---

## 2. LAYER DESIGNS

### 2.1 Ingestion & language layer
**Choice**: IndicConformer-600M-multilingual (MIT license, all 22 scheduled languages, hybrid CTC+RNNT, ~13.2 WER on Hindi benchmarks) as primary ASR, self-hosted; Bhashini ULCA pipeline APIs (ASR+translation+TTS pipelines exposed for ecosystem integrators, free for PoC use) as the demo fallback so a GPU hiccup cannot kill the live demo. Language identification precedes ASR so the correct decoding path is chosen without asking the citizen anything.

**Rationale**: AI4Bharat's Vistaar work shows Whisper's Indian-language performance is poor out-of-the-box and IndicWhisper/IndicConformer deliver the lowest WER across the large majority of Indian-language benchmarks (39 of 59 in the Vistaar comparison). Using a 22-language single model also avoids maintaining 22 fine-tunes — decisive for a solo team.

**Fallback design (critical for the demo)**: every model call has a degradation ladder — self-hosted → Bhashini API → cached transcript — so the on-stage flow never hard-fails.

### 2.2 Semantic pipeline
- **Taxonomy classification**: a multilingual encoder (MuRIL or IndicBERT) fine-tune OR a frozen-embedding + logistic head, evaluated both ways; select by held-out Macro-F1. Rationale: MuRIL is trained on Indian-language text with transliteration robustness, which matches code-switched citizen input better than generic multilingual encoders.
- **Geocoding**: IndicNER/gazetteer entity extraction of place names, then deterministic resolution against the LGD registry (state → district → sub-district codes). Deterministic gazetteer matching, not a learned geocoder, because the demo must be auditable and never hallucinate a location.
- **Deduplication**: multilingual sentence embeddings (MuRIL-based) → cosine similarity blocking by (category, district) → clustering at tuned threshold. Same broken handpump reported 400 times across Hindi/Tamil/Marathi must collapse to one signal with `report_count = 400`.
- **Trust filter**: rule-based spam features (message entropy, repetition velocity per device hash, copy-paste n-gram overlap) + simple anomaly flags. Astroturfing is a first-class concern for any system feeding public-spending decisions.

### 2.3 Fusion engine
Geocoded signals joined to district demographics (Census 2011), a composite deprivation index (z-scored Census + NFHS-5 indicators), and scheme coverage tables, keyed on LGD codes. Stored in PostGIS/DuckDB with documented table contracts (see specs.md §2). The join is deterministic and versioned so every dashboard number traces to a queryable table — the auditability argument that makes this a *public good* rather than a black box.

### 2.4 Analytics
- **Hotspots**: spatio-temporal clustering (HDBSCAN on demand-signal embedding + recency weighting, plus a simple per-district excess-demand statistic vs demographic baseline as the explainable headline number). A GNN over the (citizen ↔ location ↔ category ↔ scheme) graph is a stretch goal only if time permits — the explainable statistic wins judging points over an unexplainable deep model.
- **Prioritization**: transparent multi-criteria decision analysis —
  `Priority = w1·D_norm + w2·G_norm + w3·P_norm + w4·S_norm`
  where D = demand intensity (deduped report velocity, population-normalized), G = deprivation gap (infrastructure deficit vs comparable districts), P = population served, S = scheme alignment (funding window match). Weights set by explicit stated policy preference, sensitivity-tested by perturbing weights ±20% and reporting top-20 rank stability (Spearman >= 0.80). Explainability is the feature: every recommendation card shows its components.
- **Agentic scheme-matching (RAG)**: a retrieval step over embedded scheme documents that attaches the applicable centrally-sponsored scheme + current coverage to each recommendation card, with citations to the source document.

### 2.5 Impact engine (the differentiator)
**Method**: synthetic control method (SCM). For each treated district (one where a project was "completed" in our simulated ledger), construct a synthetic counterfactual from a weighted combination of untreated districts that matched its demand-signal trajectory during the pre-treatment window. The causal effect is the post-treatment divergence between the treated district's actual demand trajectory and the synthetic control's. Validity is checked with **in-time placebo tests** (pretend treatment happened earlier; the method should find ~no effect) and **in-space placebos** (apply SCM to untreated districts; effects should be small relative to the treated one) — the standard Abadie-style permutation inference.

**Why SCM and not diff-in-diff**: we have a small number of aggregate treated units (districts), staggered hypothetical treatment timing, and no randomization — precisely the setting where Athey & Imbens call synthetic controls "the most important innovation in the policy evaluation literature in the last 15 years" and where SCM has documented applications to infrastructure investment impact (urban road investment spillover studies, transportation project benefit-incidence work).

**Demo narrative**: "In district X, road complaints were rising 8%/month. A road project was sanctioned in month M. Watch the demand signal." Treated district's signal decays; the synthetic control — built from lookalike districts — keeps rising. The gap is the measured impact of public spending, closing the exact feedback loop named in the problem statement.

### 2.6 Privacy, DPI & DPI-native engineering
- No raw phone numbers; salted one-way device hashes; audio deleted post-transcription (scripted audit, P11).
- Aggregation threshold: no dashboard statistic shown for any cell representing fewer than 3 reports (prevents re-identification of tiny communities and noise).
- Open API (OpenAPI 3.1) exposing the civic-request protocol: `POST /requests`, `GET /signals`, `GET /priorities`, `GET /impact/{district}` — so other builders, states, and civil society can consume the aggregate without touching raw data.
- Open-source (MIT), self-hostable, with the degradation ladder and edge-deployable model choices documented as the scale-out path.

---

## 3. VALIDATION TOPOLOGY (leakage control)

- **Synthetic corpus generation is temporally split by construction**: test-window requests are generated after (and independently of) train-window requests, with a 2-week guard gap. Embedding models, classifiers, and threshold tuners are fit only on the train window. This prevents the classic "dedup threshold tuned on the test duplicates" leak.
- Classification test set: stratified by language × channel × category; per-language F1 reported, never pooled alone.
- Dedup labeled set: hand-labeled by the lead on a 200-pair sample; pairwise F1 reported.
- All transformations live inside scikit-learn `Pipeline` objects; the geocoder's gazetteer is a static registry (no fit), so it cannot leak.
- Seeds: `random_state=42` on every splitter, sampler, and estimator; `make demo-rebuild` proves reproducibility (P12).

---

## 4. ANALYSIS STAGES (milestone rationale)

**Stage 1 — Data foundation & synthetic corpus.** Build the LGD-linked open-data tables and generate a realistic multilingual synthetic corpus (>= 500 requests, 3 languages, 2 channels, known ground-truth categories/locations/duplicate clusters) using an LLM prompted with authentic phrasing registers, then validated against schema contracts. This matters because every downstream claim is only as credible as the corpus; generating ground truth at creation time is what makes pass/fail measurement possible at all. Expected outputs: `data/` tables + corpus with labels.

**Stage 2 — Ingestion & language layer live.** Stand up WhatsApp (via sandbox provider or a local webhook mock) and web intake; wire IndicLID → ASR → transcript; verify the degradation ladder. This is the riskiest integration (external APIs), so it is front-loaded. Expected outputs: working webhooks, transcript JSONL, per-language WER on the 50-utterance held-out set.

**Stage 3 — Semantic pipeline & benchmarking.** Train/evaluate the classifier (two candidate approaches, pick by held-out Macro-F1), the gazetteer geocoder, and the dedup clusterer inside leak-free pipelines. Benchmark against the specs.md thresholds P3–P6. Expected outputs: `results/classification_report.json`, geocoding and dedup reports.

**Stage 4 — Fusion, hotspots & prioritization.** Join signals to open-data tables, implement the explainable hotspot statistic and the MCDA ranker with sensitivity analysis. Expected outputs: fusion tables, top-20 ranked recommendations with stability report.

**Stage 5 — Impact engine.** Implement SCM on the simulated project ledger with in-time and in-space placebos. Expected outputs: `results/impact_report.json`, before/after dashboard view.

**Stage 6 — Policy cockpit & open API.** Build the dashboard (heatmap, drill-down, recommendation cards, impact view) and the OpenAPI spec with a working external call. Expected outputs: dashboard, `api/openapi.yaml`.

**Stage 7 — Freeze, rehearse, report.** `make demo-rebuild` from clean state, scripted 3-minute demo rehearsal with timing margins, privacy audit, and the final .docx report.

---

## 5. ERROR-ANALYSIS FRAMEWORK
- Per-language confusion matrix for classification; slice analysis by channel (voice vs text) to catch ASR-error amplification.
- Geocoding failure taxonomy: no-place-name / ambiguous place name / out-of-registry.
- Dedup error inspection on false merges (worst case — different issues collapsed).
- Impact engine: placebo distributions plotted; SCM pre-treatment fit (RMSPE) reported per treated district.
- Full audit trail: every dashboard number traceable to a table + query version.

## 6. RISK REGISTER
| Risk | Likelihood | Mitigation |
|---|---|---|
| WhatsApp API friction in 48h | High | Web/PWA intake is first-class; WhatsApp via provider sandbox; mock mode for rehearsal |
| ASR GPU unavailability on demo day | Medium | Bhashini API fallback + cached transcripts (degradation ladder) |
| Low-resource language F1 fails P4 | Medium | Corpus augmentation for weakest language; if still failing, replace demo language (corpus fix, never threshold-lowering) |
| Solo-lead overload | Medium | All milestone work delegated to AI agents with these specs; lead reviews artifacts, not code |

## 7. KEY SOURCES (plain URLs)
- AI4Bharat IndicConformer (22-language ASR, MIT): https://huggingface.co/ai4bharat/indic-conformer-600m-multilingual
- AI4Bharat ASR program (IndicWav2Vec/IndicWhisper/IndicConformer, 22 languages): https://ai4bharat.iitm.ac.in/areas/asr/
- Srinivasan et al., *Vistaar: Diverse Benchmarks and Training Sets for Indian Language ASR* (IndicWhisper SOTA evidence): https://arxiv.org/abs/2305.15386
- Bhashini ULCA API documentation (pipeline compute, ASR+NMT+TTS): https://bhashini.gitbook.io/bhashini-apis
- Digital India Bhashini (National Language Translation Mission, DPG framing): https://bhashini.gov.in
- Abadie, Diamond & Hainmueller, *Synthetic Control Methods for Comparative Case Studies*: https://economics.mit.edu/sites/default/files/publications/Synthetic%20Control%20Methods.pdf
- Abadie, *Using Synthetic Controls: Feasibility, Data Requirements, and Methodological Aspects* (JEP): https://inferenceproject.yale.edu/sites/default/files/jel.20191450.pdf
- Zhang et al.-style application of SCM to urban road infrastructure spillovers: https://ideas.repec.org/a/arp/bmerar/2020p127-134.html
- Generalized SCM for transportation project benefit areas (Journal of Transport and Land Use): https://www.jtlu.org/index.php/jtlu/article/view/1784
