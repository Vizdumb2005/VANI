# VAANI — 3-minute demo script (timed)

T-0:00 — **The problem.** "Millions of citizens report infrastructure failures
every day — by voice, in their own language — but that signal evaporates. And
when a project IS built, nobody measures whether it actually killed the
complaints." Show the policy cockpit (dashboard/index.html).

T-0:30 — **Live ingestion (P1/P2).** Open the web PWA / send a WhatsApp voice
note in Hindi: "रामपुर गाँव की सड़क बहुत टूटी है, वाराणसी में..." Show the request
round-trip: language auto-detected (no user prompt), ASR degradation ladder
(rung displayed), transcript lands on the dashboard in < 60 s. Then one in
Tamil and one in Marathi. Repeat in text channel.

T-1:15 — **The semantic layer.** Show the demand signal the reports collapsed
into: category (roads), district (Varanasi, LGD-resolved), report_count, urgency
score. Show the trust filter catching an astroturf burst (velocity-flagged).

T-1:40 — **Hotspots & priorities (P7/P8).** National map: excess demand vs the
population baseline — 131 district-category hotspots. Open the top MCDA card:
every score component visible (demand, deprivation, population, scheme
alignment), scheme match (PMGSY) with current coverage, cost-per-beneficiary.
"Every number on this card traces to a queryable table — that's what makes
this a public good, not a black box."

T-2:15 — **The impact loop (P9).** Varanasi, roads: complaints rising 8%/month,
project completed May 2026 — watch the observed signal decay vs the synthetic
control built from lookalike districts. Effect: −10 reports/month, 40% decay.
In-time placebo: no effect at a fake treatment date. In-space placebos: p=0.0.
"This is the closed loop: demand → decision → verified impact."

T-2:50 — **DPG framing.** Open API (OpenAPI 3.1), MIT license, privacy audit
clean (zero raw PII, zero retained audio), `make demo-rebuild` reproducible.

## Fallback drill (degradation ladder)
If the self-hosted ASR is unavailable on stage: the ladder automatically falls
to Bhashini ULCA; if network fails, the cached-transcript rung keeps the demo
alive. Exercised once in rehearsal (results/runs/M3_ingest_roundtrip.json
shows asr_rung=cached-simulated path).
