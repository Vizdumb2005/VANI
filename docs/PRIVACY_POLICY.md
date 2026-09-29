# Privacy Policy — VAANI Digital Public Good

**Effective Date:** September 29, 2026  
**Version:** 1.0 (DPDP Act 2023 Compliant)  
**Initiative:** Voice-to-Network Aggregated National Intelligence (VAANI)  
**Legal Framework:** Digital Personal Data Protection Act, 2023 (India) | IT Act, 2000 & SPDI Rules, 2011 | DPGA Standards

---

## 1. Introduction & Mission

**VAANI** is an open-source **Digital Public Good (DPG)** developed to bridge the gap between citizen voices across India's 22 scheduled languages and national infrastructure investment priorities. VAANI aggregates citizen grievances regarding essential public utilities (drinking water, roads, electricity, healthcare, sanitation, public safety) and synthesizes them into actionable, evidence-based spatial intelligence for policymakers.

As a platform built for sovereign public governance, VAANI adheres to the highest standards of **Privacy by Design**, **Data Minimization**, and statutory compliance under the **Digital Personal Data Protection Act, 2023 (DPDP Act 2023)**.

---

## 2. Key Privacy Invariants & Architecture

VAANI operates under five inviolable architectural guarantees:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        VAANI PRIVACY INVARIANTS                        │
├────────────────────────────────────────────────────────────────────────┤
│ 1. ZERO RAW IDENTIFIERS: Phone numbers / MSISDNs salted & hashed       │
│    immediately at API edge with one-way SHA-256 + secret pepper.       │
│ 2. EPHEMERAL AUDIO PURGING: Voice audio bytes deleted immediately     │
│    post-transcription. Zero citizen voice recordings stored on disk.   │
│ 3. AGGREGATION PRIVACY GATE: Cells representing < 3 citizen reports    │
│    are strictly suppressed (k-anonymity k >= 3) in all public feeds.   │
│ 4. LOCAL LGD SPATIAL ANCHORING: Coordinates resolved only to official  │
│    district/sub-district boundaries, never private residential GPS.    │
│ 5. NO COMMERICAL MONETIZATION: 100% open-source (MIT), non-profit,    │
│    sovereign Digital Public Infrastructure (DPI).                      │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Data We Process & Purpose Limitation

Under Section 4 and Section 7 of the DPDP Act 2023, data processing is strictly limited to specified civic purposes:

| Data Category | Data Elements | Source Channel | Processing Purpose | Retention Period |
|---|---|---|---|---|
| **Audio Stream (Voice)** | Raw PCM / WAV / OGG voice note | Web Mic, WhatsApp Voice | Ephemeral transcription to text via ASR ladder (AI4Bharat / Bhashini) | **0 seconds** (Purged in-memory immediately after ASR) |
| **Grievance Text** | Indic text transcription (Hindi, Tamil, Marathi, etc.) | Speech-to-Text or Direct Text Input | Semantic categorization (Water, Roads, Power, Health) and MinHash deduplication | Retained in de-identified civic corpus for spatial planning |
| **Citizen Pseudonym** | Cryptographic Salted Hash (e.g., `sha256(MSISDN + Pepper)`) | Mobile number / device fingerprint | Sybil attack prevention, deduplication, and follow-up status validation | Persistent pseudonymized hash; irreversible |
| **Geographic Anchor** | District Name & Local Government Directory (LGD) code | Mentioned in grievance audio/text | Spatial aggregation and alignment with PM GatiShakti and central schemes | Persistent spatial metadata |
| **Channel Metadata** | `web_voice`, `web_text`, `whatsapp_voice`, `whatsapp_text` | Request Header | Omnichannel telemetry and latency optimization | Aggregated telemetry |

---

## 4. Ephemeral Voice Processing & Audio Deletion

In accordance with Section 8(7) of the DPDP Act 2023 (Storage Limitation):
1. **No Voice Biometrics**: VAANI does not extract voiceprints, acoustic signatures, emotional biomarkers, or speaker identity characteristics.
2. **Immediate Destruction**: Audio buffers are held in volatile RAM only for the duration of inference by the ASR engine (AI4Bharat IndicConformer / Digital India Bhashini).
3. **Automated Audit**: Scripted filesystem scanners continuously enforce and certify that `audio_files_retained == 0` (Criterion P11).

---

## 5. Pseudonymization & Cryptographic Hashing

To protect the identity of citizens submitting grievances:
- Raw mobile numbers or device IDs are transformed at the perimeter into a 64-character hexadecimal digest:
  $$\text{Pseudonym} = \text{HMAC-SHA256}(\text{MSISDN}, \text{Salt}_{\text{Rotatable}})$$
- The resulting digest cannot be reversed to discover the citizen's mobile number without access to the secure hardware security module (HSM) salt.
- Plaintext phone numbers are never written to log files, disk caches, database records, or error traces.

---

## 6. Aggregation Gate ($k \ge 3$ Anonymity)

To prevent re-identification through spatial linkage attacks:
- Any district-category combination containing **fewer than 3 individual citizen submissions** is strictly masked and excluded from public dashboards, open API endpoints, and researcher feeds.
- Demographic data fused into MCDA (Census 2011, NFHS-5) operates strictly at the district aggregate level ($N \ge 100,000$ citizens).

---

## 7. Legal Basis for Processing

Processing under VAANI is conducted under lawful grounds defined in the DPDP Act 2023:
1. **Section 7(a) & 7(b) — State Provision of Subsidies, Services, and Infrastructure**: Processing citizen petitions to prioritize public infrastructure and resolve utility failures.
2. **Voluntary Citizen Submission**: Citizens voluntarily initiate requests via Web PWA or WhatsApp chatbots. Clear upfront notice is provided prior to audio recording or message transmission.

---

## 8. Rights of the Citizen (Data Principal)

Under Chapter III of the DPDP Act 2023, citizens possess enforceable rights:
1. **Right to Access Information (Section 11)**: Citizens can query the status of their grievance using their anonymous Request UUID.
2. **Right to Correction and Erasure (Section 12)**: A citizen can request the expungement of their grievance text from the active aggregation pool.
3. **Right of Grievance Redressal (Section 13)**: Direct access to the VAANI Grievance Redressal Officer.
4. **Right to Nominate (Section 14)**: Nominate a representative in case of incapacity.

---

## 9. Security Safeguards

VAANI implements technical safeguards required under Section 8(5) of the DPDP Act 2023:
- **Transport Encryption**: Enforced TLS 1.3 for all web and API communications.
- **At-Rest Protection**: Local Government data and de-identified text corpora stored using AES-256 encrypted volumes.
- **Regular Automated Audits**: Continuous automated testing for PII leakage (`tests/test_vaani_pipeline.py::test_p11_privacy_audit`).

---

## 10. Data Protection Officer (DPO) & Contact Information

For inquiries, compliance certifications, or Data Principal requests:

* **Office of the Data Protection Officer:**  
  VAANI Digital Public Good Secretariat  
  Email: `privacy@vaani-dpg.org` / `dpo@vaani-dpg.org`  
  Grievance Response Time: Within 72 working hours (DPDP Act compliant)
