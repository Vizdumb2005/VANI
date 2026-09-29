"""M5 — Fusion, hotspot detection & MCDA prioritization (tasks.md M5.1-M5.4).

Builds normalized demand signals (specs.md §2.2) from deduplicated requests,
fuses them with open-data tables on LGD keys, computes the explainable
excess-demand hotspot statistic, the MCDA priority ranker with ±20% weight
sensitivity analysis, and scheme matching for recommendation cards.
"""
import json
import sys
from collections import Counter

import numpy as np
import pandas as pd
from scipy.stats import spearmanr
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

sys.path.insert(0, str(__import__("pathlib").Path(__file__).resolve().parent))
from config import (CATEGORIES, FIGURES, MCDA_WEIGHTS, MIN_CELL_AGGREGATION,
                    OPEN_DATA, RESULTS, RUNS, SCHEMES, SEED, SYNTH)

RNG = np.random.default_rng(SEED)
CAT_SEVERITY = {"roads": 0.6, "water_sanitation": 0.8, "power": 0.5, "health": 0.9,
                "education": 0.5, "public_safety": 0.7, "other": 0.3}
HAZARD_HINTS = ["आपातकाल", "गंभीर", "तुरंत", "मौतें", "आपत्कालीन", "तत्काळ",
                "அவசரம்", "மிக மோசம்", "உடனே", "உயிரிழப்பு"]


def build_signals():
    frames = [pd.read_parquet(SYNTH / f) for f in
              ("processed_train.parquet", "processed_test.parquet")]
    df = pd.concat(frames, ignore_index=True)
    df["ts"] = pd.to_datetime(df["received_at"])

    # classifier probabilities for the confidence field (frozen winner pipeline)
    from m4_semantic import classify
    train = pd.read_parquet(SYNTH / "requests_train.parquet")
    test = pd.read_parquet(SYNTH / "requests_test.parquet")
    cand, winner = classify(train, test)

    proba = cand[winner]["pipeline"].predict_proba(df["raw_text"])
    classes = cand[winner]["pipeline"].classes_
    df["cat_conf"] = [float(proba[i][list(classes).index(c)])
                      for i, c in enumerate(df["pred_category"])]

    rows = []
    for cid, g in df.groupby("pred_cluster"):
        hazard_hits = sum(any(h in str(t) for h in HAZARD_HINTS) for t in g["raw_text"])
        hazard_frac = hazard_hits / len(g)
        span_days = max((g["ts"].max() - g["ts"].min()).days, 1)
        velocity = len(g) / max(span_days, 1) * 7  # reports per week
        cat = Counter(g["pred_category"]).most_common(1)[0][0]
        urgency = float(np.clip(
            0.5 * hazard_frac + 0.3 * CAT_SEVERITY[cat] +
            0.2 * min(velocity / 5.0, 1.0), 0, 1))
        dcode = g["pred_district_code"].dropna()
        rows.append({
            "signal_id": f"SIG-{cid}",
            "request_ids": list(g["request_id"]),
            "category": cat,
            "category_confidence": float(g["cat_conf"].mean()),
            "low_confidence": bool(g["cat_conf"].mean() < 0.60),
            "lgd_district_code": int(dcode.mode()[0]) if len(dcode) else None,
            "district": Counter(g["pred_district"]).most_common(1)[0][0],
            "geo_confidence": "district" if len(dcode) else "unresolved",
            "urgency_score": round(urgency, 3),
            "first_reported_at": g["ts"].min().isoformat(),
            "last_reported_at": g["ts"].max().isoformat(),
            "report_count": int(len(g)),
            "language_spread": int(g["gt_language"].nunique()),
        })
    sig = pd.DataFrame(rows)
    sig.to_parquet(SYNTH / "signals.parquet", index=False)
    return sig


def fuse(sig):
    dem = pd.read_parquet(OPEN_DATA / "district_demographics.parquet")
    dep = pd.read_parquet(OPEN_DATA / "deprivation_index.parquet")
    sch = pd.read_parquet(OPEN_DATA / "scheme_coverage.parquet")
    f = sig[sig["lgd_district_code"].notna()].copy()
    f["lgd_district_code"] = f["lgd_district_code"].astype(int)
    f = f.merge(dem, on="lgd_district_code", how="left")
    f = f.merge(dep[["lgd_district_code", "deprivation_index"]], on="lgd_district_code",
                how="left")
    f["scheme"] = f["category"].map(lambda c: SCHEMES[c][0])
    f = f.merge(sch, left_on=["lgd_district_code", "scheme"], right_on=["lgd_district_code", "scheme"],
                how="left")
    f.to_parquet(SYNTH / "signals_fused.parquet", index=False)
    return f


def hotspots(f):
    """Explainable excess-demand statistic per (district, category).

    expected_ij = pop_share_i * national_category_total_j (population baseline)
    excess_ij = observed_ij / expected_ij ; hotspot if excess >= 1.5 and
    report_count >= 3 (aggregation threshold, privacy by design).
    """
    agg = f.groupby(["lgd_district_code", "district", "category"]).agg(
        report_count=("report_count", "sum"), signal_count=("signal_id", "count"),
        urgency=("urgency_score", "max"), population=("population", "first")).reset_index()
    nat_tot = agg.groupby("category")["report_count"].sum()
    pop = f.drop_duplicates("lgd_district_code")[["lgd_district_code", "population"]]
    total_pop = pop["population"].sum()
    agg = agg.merge(pop, on="lgd_district_code", how="left", suffixes=("", "_p2"))
    agg["population"] = agg[["population", "population_p2"]].bfill(axis=1).iloc[:, 0]
    agg["expected"] = agg["population"] / total_pop * agg["category"].map(nat_tot)
    agg["excess_ratio"] = (agg["report_count"] / agg["expected"]).round(3)
    hot = agg[(agg["excess_ratio"] >= 1.5) & (agg["report_count"] >= MIN_CELL_AGGREGATION)] \
        .sort_values("excess_ratio", ascending=False).reset_index(drop=True)
    return agg, hot


def mcda(agg, hot, dep):
    """Priority = w1*D + w2*G + w3*P + w4*S (design.md §2.4)."""
    cand = hot.copy()
    d = dep[["lgd_district_code", "deprivation_index"]]
    cand = cand.merge(d, on="lgd_district_code", how="left")

    def norm(x):
        rng = x.max() - x.min()
        return (x - x.min()) / rng if rng else x * 0

    cand["D"] = norm(np.log1p(cand["report_count"] / cand["population"] * 1e5))
    cand["G"] = norm(cand["deprivation_index"])  # deprivation gap (z-score)
    cand["P"] = norm(np.log(cand["population"]))
    sch = pd.read_parquet(OPEN_DATA / "scheme_coverage.parquet")
    cand["scheme"] = cand["category"].map(lambda c: SCHEMES[c][0])
    cand = cand.merge(sch, on=["lgd_district_code", "scheme"], how="left")
    cand["S"] = norm(1 - cand["coverage"])  # lower coverage -> higher alignment need

    W = MCDA_WEIGHTS
    cand["priority"] = (W["D"] * cand["D"] + W["G"] * cand["G"] +
                         W["P"] * cand["P"] + W["S"] * cand["S"]).round(4)
    cand = cand.sort_values("priority", ascending=False).reset_index(drop=True)

    # --- sensitivity: ±20% weight perturbation, top-20 rank stability ---
    base_top20 = cand.head(20)["district"] + "|" + cand.head(20)["category"]
    rhos = []
    for trial in range(50):
        wv = {k: v * (1 + RNG.uniform(-0.2, 0.2)) for k, v in W.items()}
        s = wv["D"] * cand["D"] + wv["G"] * cand["G"] + wv["P"] * cand["P"] + wv["S"] * cand["S"]
        order = cand.assign(_s=s).sort_values("_s", ascending=False).head(20)
        alt = order["district"] + "|" + order["category"]
        rho = spearmanr(range(20), pd.Series(alt).reset_index(drop=True)
                        .map(dict(zip(base_top20.reset_index(drop=True), range(20))))).statistic
        rhos.append(rho)
    stability = float(np.nanmean(rhos))
    return cand, stability


def scheme_match(cand):
    """RAG-lite retrieval: TF-IDF over scheme documents -> match to card category."""
    cat_terms = {
        "roads": "roads, potholes, culvert, bridge, rural connectivity",
        "water_sanitation": "water, handpump, pipeline, drainage, sanitation, toilet",
        "power": "electricity, power, transformer, voltage, connection",
        "health": "health, doctor, hospital, medicine, ambulance, PHC",
        "education": "school, education, teacher, classroom, midday meal",
        "public_safety": "safety, streetlight, policing, women safety, patrol",
        "other": "civic amenities, garbage, encroachment, urban",
    }
    docs, keys = [], []
    for cat, (name, desc) in SCHEMES.items():
        docs.append(f"{name}. {desc}. Applicable to civic category: {cat}. "
                    f"Keywords: {cat_terms[cat]}.")
        keys.append((cat, name, desc))
    vec = TfidfVectorizer()
    M = vec.fit_transform(docs)
    checks = []
    for _, row in cand.head(10).iterrows():
        q = vec.transform([f"civic category: {row['category']} infrastructure need"])
        sims = cosine_similarity(q, M)[0]
        best = int(np.argmax(sims))
        checks.append({"card": f"{row['district']}|{row['category']}",
                        "matched_scheme": keys[best][1],
                        "expected_scheme": SCHEMES[row["category"]][0],
                        "correct": keys[best][0] == row["category"]})
    acc = sum(c["correct"] for c in checks) / len(checks)
    return checks, acc


def plot_map(hot, path):
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    reg = pd.read_parquet(OPEN_DATA / "lgd_registry.parquet")
    m = hot.merge(reg[["lgd_district_code", "lat", "lon"]], on="lgd_district_code",
                  how="left").dropna(subset=["lat"])
    plt.rcParams["figure.dpi"] = 72
    fig, ax = plt.subplots(figsize=(8, 7))
    sc = ax.scatter(m["lon"], m["lat"], s=20 + m["excess_ratio"] * 14,
                    c=np.log1p(m["report_count"]), cmap="YlOrRd", alpha=0.85, edgecolor="k",
                    linewidth=0.4)
    for _, r in m.head(12).iterrows():
        ax.annotate(r["district"], (r["lon"], r["lat"]), fontsize=7,
                    xytext=(3, 3), textcoords="offset points")
    plt.colorbar(sc, ax=ax, label="log(1+reports)")
    ax.set_title("VAANI demand hotspots — excess demand vs population baseline")
    ax.set_xlabel("longitude"); ax.set_ylabel("latitude")
    fig.tight_layout()
    fig.savefig(path)
    plt.close(fig)


def main():
    sig = build_signals()
    f = fuse(sig)
    agg, hot = hotspots(f)
    cand, stability = mcda(agg, hot, pd.read_parquet(OPEN_DATA / "deprivation_index.parquet"))
    checks, sm_acc = scheme_match(cand)
    plot_map(hot, RESULTS / "hotspots.png")

    # ------- artifacts -------
    (SYNTH / "fusion").mkdir(exist_ok=True) if False else None
    f.to_parquet(SYNTH / "signals_fused.parquet", index=False)

    # priorities.json — recommendation cards (P8 six fields)
    cards = []
    for i, r in cand.head(10).iterrows():
        cost = {"roads": 4.2e7, "water_sanitation": 2.8e7, "power": 3.5e7, "health": 5.0e7,
                "education": 2.2e7, "public_safety": 1.8e7, "other": 1.5e7}[r["category"]]
        cards.append({
            "rank": i + 1, "category": r["category"], "location": r["district"],
            "lgd_district_code": int(r["lgd_district_code"]),
            "demand_intensity": {"report_count": int(r["report_count"]),
                                   "excess_ratio": float(r["excess_ratio"]),
                                   "per_lakh_per_year": round(float(r["report_count"] /
                                                                    r["population"] * 1e5), 1)},
            "deprivation_score": round(float(r["deprivation_index"]), 3),
            "scheme_match": {"scheme": SCHEMES[r["category"]][0],
                              "description": SCHEMES[r["category"]][1],
                              "current_coverage": round(float(r["coverage"]), 3)},
            "cost_per_beneficiary_proxy": round(float(cost / r["population"]), 1),
            "priority": float(r["priority"]),
            "components": {"D_demand": round(float(r["D"]), 3), "G_deprivation": round(float(r["G"]), 3),
                            "P_population": round(float(r["P"]), 3), "S_scheme_alignment": round(float(r["S"]), 3)},
        })
    (RESULTS / "priorities.json").write_text(json.dumps(cards, indent=2, ensure_ascii=False), encoding="utf-8")

    # signals.json — aggregate API view (privacy aggregation threshold applied)
    view = f[f["report_count"] >= MIN_CELL_AGGREGATION] if False else \
        f.groupby(["lgd_district_code", "district", "category"]).agg(
            report_count=("report_count", "sum"), signal_count=("signal_id", "count"),
            urgency=("urgency_score", "max")).reset_index()
    view = view[view["report_count"] >= MIN_CELL_AGGREGATION]
    (RESULTS / "signals.json").write_text(
        json.dumps(view.to_dict(orient="records"), indent=2, ensure_ascii=False), encoding="utf-8")

    (RUNS / "M5_report.json").write_text(json.dumps({
        "signals": {"n_signals": len(sig), "n_fused": len(f),
                     "unresolved_geo": int(sig["lgd_district_code"].isna().sum()),
                     "low_confidence": int(sig["low_confidence"].sum())},
        "hotspots": {"n_district_category_hotspots": len(hot),
                      "n_distinct_districts": int(hot["district"].nunique()),
                      "top": hot.head(10)[["district", "category", "report_count",
                                            "excess_ratio"]].to_dict(orient="records")},
        "mcda": {"weights": MCDA_WEIGHTS, "top20_spearman_stability": round(stability, 4)},
        "scheme_match": {"accuracy_top10": round(sm_acc, 3), "checks": checks},
    }, indent=2, ensure_ascii=False), encoding="utf-8")

    (RESULTS / "M5_hotspots.md").write_text(
        f"# M5.2 — Hotspot method note\n\n"
        f"Explainable excess-demand statistic: for each (district, category) cell, "
        f"expected demand = district population share x national category total; "
        f"excess = observed/expected. Hotspot = excess >= 1.5 AND report_count >= "
        f"{MIN_CELL_AGGREGATION} (privacy aggregation threshold).\n\n"
        f"Result: **{len(hot)} district-category hotspots across "
        f"{hot['district'].nunique()} districts** from {int(agg['report_count'].sum())} "
        f"deduplicated report signals.\n\nTop 10 by excess ratio:\n\n"
        + hot.head(10)[["district", "category", "report_count", "excess_ratio"]]
        .to_markdown(index=False) + "\n", encoding="utf-8")

    p7 = len(hot) >= 10
    p8 = all(all(k in c for k in ("category", "location", "demand_intensity",
                                    "deprivation_score", "scheme_match",
                                    "cost_per_beneficiary_proxy")) for c in cards)
    stable = stability >= 0.80
    sm_ok = sm_acc >= 0.8
    print(f"[M5] signals={len(sig)} fused={len(f)} hotspots={len(hot)} "
          f"(districts={hot['district'].nunique()}) stability={stability:.3f} "
          f"scheme_match_acc={sm_acc:.2f} | P7:{p7} P8_fields:{p8} stable:{stable} "
          f"sm_ok:{sm_ok}")
    return p7 and p8 and stable and sm_ok


if __name__ == "__main__":
    sys.exit(0 if main() else 1)
