# RapidPro Omnichannel Integration Guide for VAANI

This guide details how to integrate **RapidPro** (the UNICEF and Digital Public Goods Alliance accredited visual messaging engine) with **VAANI (Voice-to-Network Aggregated National Intelligence)** on Google Cloud Platform.

---

## 1. Overview & Architecture

RapidPro acts as the omnichannel conversational routing frontend for citizen interactions, while VAANI serves as the sovereign AI reasoning, speech, lakehouse, and policy engine:

```text
 +---------------------------------------------------------------------------------+
 |                           CITIZEN INGESTION CHANNELS                            |
 |                                                                                 |
 |    [ WhatsApp (Meta Cloud API / Twilio) ]       [ SMS (CDAC / NIC / Telco) ]    |
 +---------------------------------------+-----------------------------------------+
                                         |
                                         v
 +---------------------------------------------------------------------------------+
 |                       RAPIDPRO OPEN-SOURCE DPG ENGINE                           |
 |                                                                                 |
 |  • Mailroom (High-throughput message router)                                    |
 |  • Flow Studio (Visual multi-turn dialogue management)                          |
 |  • Courier (Outbound queue dispatcher)                                          |
 +---------------------------------------+-----------------------------------------+
                                         |
                       Webhook POST /webhooks/rapidpro
                       (Text, Media Attachment URL, URN)
                                         |
                                         v
 +---------------------------------------------------------------------------------+
 |                       VAANI SOVEREIGN DPI CORE (GCP)                            |
 |                                                                                 |
 |  1. STT: IndicConformer ASR Ladder (Vertex AI / Bhashini / Simulation)          |
 |  2. Vision: Gemini 2.0 Flash Multimodal Damage Inspection (IRC/PMGSY 1.0-5.0)    |
 |  3. Synthesis: Gemini 2.0 Dual Reply Generator (Text + Spoken Script)           |
 |  4. TTS: IndicTTS Audio Synthesis (16kHz mono WAV Voice Note)                   |
 |  5. Lakehouse: BigQuery LGD Boundary Join & k >= 3 Cell Suppression             |
 +---------------------------------------+-----------------------------------------+
                                         |
                       JSON Dual-Response Payload:
                       • text_reply: Formatted text with ticket ID and SLA
                       • voice_audio_uri: data:audio/wav;base64,... audio note
                                         |
                                         v
 +---------------------------------------------------------------------------------+
 |                   RAPIDPRO DUAL DELIVERY TO CITIZEN                             |
 |                                                                                 |
 |   WhatsApp: Formatted Text Bubble  +  Playable Audio Voice Note                 |
 |   SMS:      Formatted Text Message +  IVR Voice Callback / Audio Link           |
 +---------------------------------------------------------------------------------+
```

---

## 2. Deploying RapidPro

### Option A: Local / Virtual Machine Docker Compose
Run the provided stack in [`docker-compose.rapidpro.yml`](../docker-compose.rapidpro.yml):

```bash
docker compose -f docker-compose.rapidpro.yml up -d
```

Services will initialize on:
- RapidPro Web: `http://localhost:8000`
- Mailroom: `http://localhost:8090`
- PostgreSQL 15: `localhost:5432`
- Redis 7: `localhost:6379`

### Option B: Cloud-Hosted RapidPro (SaaS or Kubernetes)
If using an existing RapidPro deployment or hosted instance (e.g., TextIt or UNICEF RapidPro):
1. Navigate to your Organization Settings.
2. Ensure API tokens are generated under **Account -> API Tokens**.
3. Set the following environment variables in VAANI:
   ```bash
   RAPIDPRO_API_URL="https://your-rapidpro-instance.org/api/v2"
   RAPIDPRO_API_TOKEN="your_secure_api_token"
   ```

---

## 3. Configuring Messaging Channels in RapidPro

### A. WhatsApp Business (Meta Cloud API)
1. In RapidPro, click **Channels** -> **Claim Channel** -> **WhatsApp Cloud API**.
2. Provide your **Meta App ID**, **Phone Number ID**, and **System User Access Token**.
3. Set the Webhook URL in Meta Developer Portal to point to RapidPro's Mailroom endpoint:
   `https://rapidpro.your-domain.gov.in/c/wa/receive`

### B. SMS Gateway (NIC / CDAC / Twilio / Infobip)
1. In RapidPro, click **Channels** -> **Claim Channel** -> **Twilio / Generic SMS**.
2. Configure outbound sender ID (e.g., `GOV-VAANI`) and DLT registration headers as required by TRAI guidelines.

---

## 4. Importing the VAANI Flow

We have generated an export of the complete conversational intake flow in [`docs/rapidpro_vaani_flow.json`](./rapidpro_vaani_flow.json).

### Steps to Import:
1. In RapidPro, navigate to **Flows** -> **Import Flow**.
2. Select [`docs/rapidpro_vaani_flow.json`](./rapidpro_vaani_flow.json).
3. The flow will import the following visual blocks:
   - **Welcome Node**: Greets citizen in natural language and invites text, voice note, or photo.
   - **Wait for Response**: Captures the citizen's multimodal response.
   - **Call Webhook**: Performs `POST` to VAANI Cloud Run API Gateway:
     ```http
     POST https://api.vaani.gov.in/webhooks/rapidpro
     Content-Type: application/json

     {
       "contact": { "urn": "@contact.urn", "name": "@contact.name" },
       "text": "@input.text",
       "media_url": "@input.attachments.0.url",
       "channel": "@channel.address_type"
     }
     ```
   - **Dual Reply Dispatcher**:
     - Sends `@webhook.text_reply` back as an instant text notification.
     - Attaches `@webhook.voice_audio_uri` as a playable voice note.

---

## 5. Programmatic Outbound Triggers via VAANI Python Client

VAANI includes [`RapidProClient`](../backend/app/services/rapidpro_service.py) for outbound triggers:

```python
from backend.app.services.rapidpro_service import rapidpro_client

# 1. Proactively notify citizen upon CPGRAMS resolution
await rapidpro_client.notify_cpgrams_resolution(
    urn="whatsapp:+919876543210",
    ticket_id="VAA-VAR-7821A",
    resolution_status="Resolved",
    remediation_details="Bituminous patch overlay completed as per IRC:SP:20",
    language="hin",
    flow_survey_uuid="survey-satisfaction-flow-uuid"
)

# 2. Sync citizen contact with language and LGD district code
await rapidpro_client.sync_contact(
    urn="tel:+919876543210",
    name="Rajesh Kumar",
    language="hin",
    district="Varanasi",
    lgd_code=192
)
```

---

## 6. End-to-End Verification

To verify the integration locally or in CI:

```bash
# Run the automated pytest suite including the RapidPro dual voice and text test
python -m pytest tests/test_gcp_production.py -k test_rapidpro_dual_voice_and_text_reply -v
```
