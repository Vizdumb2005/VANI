# M2.1 — Corpus EDA Report

## Overview
- Total requests: **8735** (train 6031 / test 2704)
- Languages: {'hi': np.int64(3551), 'mr': np.int64(2634), 'ta': np.int64(2550)}
- Channels: {'whatsapp_voice': np.int64(3293), 'whatsapp_text': np.int64(2981), 'web_text': np.int64(1248), 'web_voice': np.int64(1213)}

## Language x category balance (EA: max/min <= 3:1)
| language | ratio |
|---|---|
| hi | 2.62 |
| mr | 2.6 |
| ta | 2.6 |

**EA result: PASS**

## Report length (chars)
| channel | mean | p50 | p95 |
|---|---|---|---|
| voice (ASR output) | 103 | 102 | 126 |
| text | 105 | 104 | 129 |

Voice-channel ASR compression vs source text (mean char-loss): 0.022

## Duplicate clusters
- Clusters: 74; sizes min=3, median=10, max=22
- Cross-lingual clusters: 14
- Spam (astroturf) rows: 44

## Most-referenced districts (ground truth)
gt_district
Raigad                       429
Sivaganga                    354
Erode                        341
Chhatrapati Sambhajinagar    335
Latur                        331
Satara                       322
Vellore                      312
Jabalpur                     264
Chandrapur                   257
Dindigul                     241
Virudhunagar                 237
Cuttack                      215
Salem                        215
Koraput                      208
Nagapattinam                 192

## Figures
- results/figures/m2_eda_grid.png
