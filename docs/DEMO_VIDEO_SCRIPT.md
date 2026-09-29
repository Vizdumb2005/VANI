# 3–5 Minute Demo Video Script — VAANI

**Hackathon Track:** Public Sector Innovation / Digital Public Goods  
**Submission Requirement:** Working end-to-end walkthrough video (3–5 minutes)  
**Presenter Tone:** Authoritative, energetic, civic-tech focused.  
**Video Resolution:** 1080p / 60fps fullscreen browser recording.

---

### [00:00 – 00:45] Act 1: The Problem & Vision
* **Screen Display:** Open on `http://localhost:8000/` showing the cinematic VAANI Policy Cockpit header with ambient aurora glows, live telemetry badges, and the KPI cards.
* **Narration:**
  > "Every year, Indian governments spend over ₹10 Lakh Crore on infrastructure. Yet, millions of citizen voices remain trapped behind a language wall, lost in fragmented helplines, leaving roads half-built and water pipelines unrepaired.
  >
  > Welcome to **VAANI** — Voice-to-Network Aggregated National Intelligence.
  >
  > VAANI is an open-source Digital Public Good powered by **Google Gemini AI**. It allows citizens across all 22 scheduled Indian languages to speak their grievances, attach photo evidence, and instantly fuses that demand with Census 2011, NFHS-5, and PM GatiShakti data to deliver evidence-backed spatial prioritization for national policymakers."

---

### [00:45 – 01:45] Act 2: Multimodal Citizen Intake & Google Gemini Vision
* **Screen Display:** Click on **Tab 4: Citizen Voice & Vision Sandbox**.
* **Action:**
  1. Click the **Hindi Preset** (Varanasi · Road damage) or tap the browser microphone and speak:  
     *"रामपुर गाँव की सड़क बहुत टूटी है, मानसून में कोई मरम्मत नहीं हुई।"*
  2. Click **📸 Sample: Pothole Crater (Roads)** or upload an image of a broken road.
  3. Click the vibrant gradient CTA: **⚡ Ingest Citizen Request (Google AI Pipeline)**.
* **Narration:**
  > "Let's see it in action. A citizen in Varanasi speaks into their phone via a progressive web app or sends a WhatsApp voice note in Hindi.
  >
  > They attach a photo of a dangerous road crater. In under 20 milliseconds, our automated pipeline ingests the request.
  >
  > Watch here: **Google Gemini Multimodal Vision** inspects the photograph in real time. It confirms physical damage verification has passed, detects a severe crater cluster, rates the hazard level as HIGH with a severity score of 4.3 out of 5, and provides an actionable civil engineering remediation recommendation.
  >
  > Notice the privacy invariant: The citizen's phone number is never stored—it is irreversibly hashed via HMAC-SHA256, and the raw audio stream is deleted immediately."

---

### [00:45 – 02:40] Act 3: National Demand Hotspots & BRICS Cross-Border Scalability
* **Screen Display:** Click on **Tab 1: Hotspots & BRICS**.
* **Action:**
  1. Hover over the National Demand Hotspot Heatmap showing 131 surfaced hotspots.
  2. Scroll through the ranked table showing Varanasi, Gaya, and Yavatmal.
  3. Click **🇧🇷 Brazil (IBGE · Novo PAC)** button, then **🇿🇦 South Africa (MDB · NDP 2030)** button.
* **Narration:**
  > "Moving to the National Policy Cockpit. Thousands of de-identified citizen signals are aggregated using MinHash LSH deduplication.
  >
  > Here, VAANI surfaces 131 statistically verified demand hotspots across 55 districts. A hotspot is flagged only when observed citizen demand exceeds the population baseline by at least 1.5 times, with strict k-anonymity masking to prevent individual tracking.
  >
  > Notice Rule 04 compliance: With a single click on our BRICS Cross-Border Switcher, the entire spatial engine instantly reconfigures from India's Local Government Directory codes to Brazil's IBGE municipal codes and Novo PAC schemes, or South Africa's Municipal Demarcation Board codes. The architecture is universally applicable across the Global South."

---

### [02:40 – 03:40] Act 4: Dynamic MCDA & Google Gemini Cabinet Briefs
* **Screen Display:** Click on **Tab 2: Dynamic MCDA Prioritization**.
* **Action:**
  1. Adjust the sliders: Increase Demand Intensity ($w_1$) to 0.50, reduce Population ($w_3$) to 0.10.
  2. Point out the live card re-sorting and the **Spearman $\rho = 0.985$** stability score.
  3. Click **⚡ View Gemini Cabinet Brief** on Card #1.
  4. The modal pops up with the generated policy memo.
* **Narration:**
  > "In Tab 2, national planners access our Multi-Criteria Decision Analysis engine.
  >
  > Planners can dynamically tune policy weights between citizen demand, multidimensional deprivation, population served, and central scheme alignment. The cards re-rank instantly while tracking Spearman rank correlation to ensure transparency against lobbying.
  >
  > When a policy executive clicks **'View Gemini Cabinet Brief'**, our **Google Gemini GenAI Policy Agent** synthesizes the district's NFHS-5 deprivation index, citizen demand volume, and PM GatiShakti logistics corridors into a formal Cabinet Policy Memo ready for ministerial sanction in seconds."

---

### [03:40 – 04:30] Act 5: Empirical Impact Engine & DPDP Act Compliance
* **Screen Display:** Click on **Tab 3: SCM Impact Engine**, then click **Tab 5: DPG & Regulatory Compliance**.
* **Action:**
  1. In Tab 3, toggle between **Varanasi** and **Gaya** to show the observed post-treatment demand decay vs. synthetic counterfactual.
  2. In Tab 5, show the **DPDP Act 2023 Full Compliance** badge, the automated zero-PII certificate, and the OpenAPI 3.1 endpoint list.
* **Narration:**
  > "Finally, we close the loop. Did building the road actually stop the citizen complaints?
  >
  > Using Abadie Synthetic Control Methods, VAANI compares treated districts against lookalike donor pools. In Varanasi and Gaya, we observe a verified **40% to 67% reduction in citizen complaints** post-project delivery, confirmed by in-space placebo distributions at p <= 0.10.
  >
  > In Tab 5, VAANI provides audit-grade compliance with India's **Digital Personal Data Protection Act, 2023**, with automated zero-PII certifications, full OpenAPI 3.1 specifications, and 1-click Google Cloud Run deployment.
  >
  > VAANI: Empowering citizens, guiding investments, proving impact with Google AI. Thank you."
