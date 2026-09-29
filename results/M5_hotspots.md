# M5.2 — Hotspot method note

Explainable excess-demand statistic: for each (district, category) cell, expected demand = district population share x national category total; excess = observed/expected. Hotspot = excess >= 1.5 AND report_count >= 3 (privacy aggregation threshold).

Result: **131 district-category hotspots across 55 districts** from 8588 deduplicated report signals.

Top 10 by excess ratio:

| district                  | category      |   report_count |   excess_ratio |
|:--------------------------|:--------------|---------------:|---------------:|
| Jabalpur                  | public_safety |            141 |         32.832 |
| Banaskantha               | education     |             79 |         31.184 |
| Puri                      | power         |             84 |         16.963 |
| Chhatrapati Sambhajinagar | education     |            113 |         11.41  |
| Vellore                   | power         |            112 |         11.097 |
| Vellore                   | education     |             88 |         10.7   |
| Chandrapur                | health        |             93 |         10.565 |
| Raigad                    | health        |            105 |          9.797 |
| Varanasi                  | roads         |             82 |          9.769 |
| Raigad                    | education     |             82 |          9.065 |
