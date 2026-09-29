"""Multi-Criteria Decision Analysis (MCDA) Scoring & Sensitivity Engine.

Computes composite infrastructure priority index:
  Score = w_D * D + w_G * G + w_P * P + w_S * S
Where:
  D = Localized Demand Intensity (excess demand multiple vs baseline)
  G = Multidimensional Deprivation Index (NFHS-5 & Socio-Economic Census)
  P = Beneficiary Population Density proxy
  S = Central Scheme Alignment (PMGSY, JJM, RDSS, NHM, Samagra Shiksha, AMRUT)
"""
import json
import logging
from typing import List, Dict, Any, Tuple
from ..core.config import settings

logger = logging.getLogger("vaani.mcda")

# Baseline normative weights
BASELINE_WEIGHTS = {"w_demand": 0.35, "w_deprivation": 0.25, "w_population": 0.20, "w_scheme": 0.20}


def calculate_spearman_rho(ranks_a: List[int], ranks_b: List[int]) -> float:
    """Calculates Spearman rank correlation coefficient rho between two rankings."""
    n = len(ranks_a)
    if n <= 1:
        return 1.0
    d_sq_sum = sum((ra - rb) ** 2 for ra, rb in zip(ranks_a, ranks_b))
    rho = 1.0 - (6.0 * d_sq_sum) / (n * (n ** 2 - 1))
    return round(max(-1.0, min(1.0, rho)), 4)


def compute_mcda_rankings(
    w_demand: float = 0.35,
    w_deprivation: float = 0.25,
    w_population: float = 0.20,
    w_scheme: float = 0.20,
) -> Dict[str, Any]:
    """Computes dynamic priority rankings based on arbitrary weight vectors and calculates Spearman rho vs baseline."""
    # Normalize weights so sum equals 1.0
    total_w = w_demand + w_deprivation + w_population + w_scheme
    if total_w <= 0:
        w_d, w_g, w_p, w_s = 0.35, 0.25, 0.20, 0.20
    else:
        w_d = w_demand / total_w
        w_g = w_deprivation / total_w
        w_p = w_population / total_w
        w_s = w_scheme / total_w

    priorities_path = settings.RESULTS_DIR / "priorities.json"
    cards: List[Dict[str, Any]] = []
    if priorities_path.exists():
        cards = json.loads(priorities_path.read_text(encoding="utf-8"))

    # Re-score each card dynamically
    scored = []
    for c in cards:
        comp = c.get("components", {})
        d_val = float(comp.get("D_demand", 0.5))
        g_val = float(comp.get("G_deprivation", 0.5))
        p_val = float(comp.get("P_population", 0.5))
        s_val = float(comp.get("S_scheme_alignment", 0.5))

        new_score = (w_d * d_val) + (w_g * g_val) + (w_p * p_val) + (w_s * s_val)
        card_copy = dict(c)
        card_copy["priority"] = round(new_score, 4)
        card_copy["_orig_rank"] = c.get("rank", 999)
        scored.append(card_copy)

    # Sort descending by new priority
    scored.sort(key=lambda x: x["priority"], reverse=True)

    # Assign new ranks
    ranks_new = []
    ranks_base = []
    for idx, item in enumerate(scored, start=1):
        item["rank"] = idx
        ranks_new.append(idx)
        ranks_base.append(item["_orig_rank"])
        del item["_orig_rank"]

    rho = calculate_spearman_rho(ranks_new, ranks_base)

    return {
        "weights": {
            "w_demand": round(w_d, 3),
            "w_deprivation": round(w_g, 3),
            "w_population": round(w_p, 3),
            "w_scheme": round(w_s, 3),
        },
        "spearman_rho": rho,
        "total_projects": len(scored),
        "top_recommendations": scored,
    }
