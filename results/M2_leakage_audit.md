# M2.2 — Leakage Audit

## Fit operations and their input windows

| fit operation | input | window |
|---|---|---|
| M4.1 taxonomy classifier (both candidates) | requests_train.parquet | train window only |
| M4.3 dedup threshold tuning | requests_train.parquet (labeled train clusters) | train window only |
| M4.2 gazetteer geocoder | LGD registry (static, no fit) | n/a — static registry |
| M4.4 trust-filter velocity/entropy thresholds | requests_train.parquet | train window only |
| M5 hotspot excess-demand baseline | train + test (aggregate statistic, no target fit) | descriptive only |
| M5.3 MCDA weights | fixed policy constants (design.md §2.4) | n/a — stated, not learned |
| M6 SCM donor weights (NNLS) | pre-treatment months of treated district | pre-treatment only |
| L3 ASR models | no fit — inference only (degradation ladder) | n/a |

## Programmatic checks

- PASS — train_max_before_test_min: True
- PASS — train_within_window: True
- PASS — test_within_window: True
- PASS — guard_gap_days: 14
- PASS — no_cluster_spans_windows: True
- PASS — cluster_ids_disjoint: True
- PASS — gazetteer_is_static_registry: True

**Violations: 0**

## Rationale

- The synthetic corpus is temporally split by construction: test-window requests are generated from an independent RNG stream after train-window generation, with a 2-week guard gap (see workflow/m1_generate_corpus.py).
- Every learned component (classifier, dedup threshold, trust thresholds, SCM donor weights) is fit exclusively on train-window or pre-treatment data, as listed above.
- The geocoder uses a static LGD gazetteer (no statistical fit), so it cannot leak.
- SCM donor weights are solved on pre-treatment months only (standard Abadie practice).