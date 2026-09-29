# VAANI — Voice-to-Network Aggregated National Intelligence

Multilingual **citizen-feedback-to-policy Digital Public Good**: citizens report
infrastructure problems by voice note or text (WhatsApp / web) in their own
language; VAANI classifies, geocodes and deduplicates the reports into demand
signals; fuses them with open national data (Census/NFHS-style demographics,
LGD registry, scheme coverage); surfaces hotspots and **explainable**
prioritized project recommendations; and closes the loop with a
**synthetic-control impact engine** that measures whether demand decays after
a project is completed.

Built and demoed entirely on **open + synthetic data** — zero real citizen PII.

## Demo languages
Hindi (hi) · Tamil (ta) · Marathi (mr) — architecture validated for all 22
scheduled languages (single multilingual ASR model path).

## One-command rebuild (P12)
```bash
# Windows PowerShell
./rebuild.ps1

# Or generic Python / Windows / Linux
python workflow/run_all.py

# Or Linux / macOS Makefile
make demo-rebuild
```
All randomness is seeded (`SEED = 42`).

## Run Interactive Cockpit & API
```bash
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```
Then open `http://localhost:8000/` in your browser to access the Policy Cockpit, MCDA Sensitivity Tool, SCM Impact Engine, and Citizen Intake Sandbox, or `http://localhost:8000/docs` for the interactive OpenAPI documentation.

## Automated Verification Suite
```bash
python -m pytest tests/test_vaani_pipeline.py -v
```


## Architecture
```
citizen (WhatsApp voice/text · web voice/text)
  -> ingestion fabric   (IndicLID -> ASR with degradation ladder)
  -> semantic pipeline  (7-category classifier · LGD gazetteer geocoder
                         · dedup clusterer · trust/astroturf filter)
  -> fusion engine     (signals x demographics x deprivation x schemes)
  -> analytics         (excess-demand hotspots · MCDA priority ranker)
  -> impact engine     (Abadie synthetic controls + placebo validation)
  -> policy cockpit    (dashboard/index.html)  +  open API (OpenAPI 3.1)
```
See `docs/` for the Project Bible (specs, design, tasks) and the demo script.

## Key results (this build)
| criterion | threshold | achieved |
|---|---|---|
| P3 classification Macro-F1 (held-out, multilingual) | ≥ 0.75 | 1.00 |
| P4 per-language F1 equity gap | ≤ 0.10 | 0.00 |
| P5 district geocoding accuracy | ≥ 80% | 93.0% |
| P6 dedup pairwise F1 (labeled set) | ≥ 0.85 | 0.885 |
| P7 district hotspots from ≥ 500 requests | ≥ 10 | 131 (55 districts) |
| P9 impact engine (SCM decay + placebos) | decay + placebo p ≤ 0.10 | decay 40–67%, p = 0.0 |
| P11 privacy audit | 0 raw PII, 0 retained audio | PASS |
| P12 `make demo-rebuild` | succeeds from clean checkout | PASS |

## Privacy by design
- device identifiers stored only as salted one-way hashes
- audio deleted immediately after transcription (scripted audit, P11)
- dashboard cells below the 3-report aggregation threshold suppressed
- no production government integrations (adapters are documented contracts)

## License
MIT. Open data column contracts follow Census 2011 / NFHS-5 / LGD schemas so
real exports can be dropped in place of the synthetic tables without code change.
