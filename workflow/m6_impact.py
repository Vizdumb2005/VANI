"""M6 — Impact engine: synthetic control method (tasks.md M6.1-M6.3).

Synthetic project ledger (treated districts, from the corpus design) -> monthly
demand panel -> SCM with NNLS donor weights on pre-treatment months only ->
post-treatment demand-decay effect -> in-time and in-space placebo validation
(Abadie-style permutation inference).
"""
import json
import sys

import numpy as np
import pandas as pd
from scipy.optimize import nnls

sys.path.insert(0, str(__import__("pathlib").Path(__file__).resolve().parent))
from config import RESULTS, RUNS, SEED, SYNTH
from m1_generate_corpus import TREATED

MONTHS = pd.period_range("2025-10", "2026-09", freq="M")
RNG = np.random.default_rng(SEED)


def build_ledger():
    rows = []
    for (dist, cat), trt in TREATED.items():
        rows.append({"district": dist, "category": cat, "sanctioned_at": trt,
                      "completed_at": pd.Timestamp(trt) + pd.Timedelta(days=20)})
    led = pd.DataFrame(rows)
    led.to_parquet(SYNTH / "projects.parquet", index=False)
    return led


def build_panel():
    frames = [pd.read_parquet(SYNTH / f) for f in
              ("processed_train.parquet", "processed_test.parquet")]
    df = pd.concat(frames, ignore_index=True)
    df["month"] = pd.to_datetime(df["received_at"]).dt.to_period("M")
    df = df[df["gt_spam"] == False]
    counts = df.groupby(["gt_district", "gt_category", "month"]).size().unstack(
        fill_value=0).reindex(columns=MONTHS, fill_value=0)
    # 3-month centered moving average: SCM is fit on the smoothed demand
    # trajectory (standard practice for noisy count series; monthly Poisson
    # noise alone is ~1/sqrt(mean) ~= 20-30% of level)
    panel = counts.apply(lambda r: pd.Series(r).rolling(3, center=True,
                                                       min_periods=1).mean(), axis=1)
    return panel


def scm(y, X, pre_mask, post_mask):
    """NNLS donor weights fit on pre-treatment; returns weights, synth series."""
    w, _ = nnls(X[pre_mask], y[pre_mask])
    synth = X @ w
    return w, synth


def effect_stats(y, synth, pre_mask, post_mask):
    rmspe_pre = float(np.sqrt(np.mean((y[pre_mask] - synth[pre_mask]) ** 2)))
    eff = float(np.mean(y[post_mask]) - np.mean(synth[post_mask]))
    return rmspe_pre, eff


def main():
    led = build_ledger()
    panel = build_panel()

    # every treated district must have >= 6 months pre-treatment history
    district_codes = pd.read_parquet(__import__("config").OPEN_DATA / "lgd_registry.parquet")
    name2code = dict(zip(district_codes["district_name_en"], district_codes["lgd_district_code"]))

    report = {"districts": [], "method": "synthetic control (Abadie), NNLS donor weights on 3-month smoothed monthly panel",
              "panel_months": [str(m) for m in MONTHS]}
    all_effects = []

    for _, t in led.iterrows():
        dist, cat, trt = t["district"], t["category"], pd.Timestamp(t["completed_at"])
        y = panel.loc[(dist, cat)].values.astype(float)
        m_idx = np.array([(m.start_time - trt).days >= -31 for m in MONTHS])  # post-treatment mask
        pre_mask, post_mask = ~m_idx, m_idx
        if pre_mask.sum() < 6:
            report["districts"].append({"district": dist, "status": "insufficient pre-period"})
            continue

        # donor pool: untreated districts with this category
        donors = [d for d in panel.index.get_level_values(0).unique()
                  if (d, cat) in panel.index and d != dist and d not in led["district"].tolist()]
        X = np.vstack([panel.loc[(d, cat)].values.astype(float) for d in donors]).T

        w, synth = scm(y, X, pre_mask, post_mask)
        rmspe, eff = effect_stats(y, synth, pre_mask, post_mask)
        treated_mean_pre = float(y[pre_mask].mean())
        rel_rmspe = rmspe / treated_mean_pre

        # in-time placebo: pretend treatment 3 months earlier; fit on months
        # before that fake date, evaluate "effect" over the fake post window
        fake = trt - pd.Timedelta(days=90)
        fm_idx = np.array([(m.start_time - fake).days >= -31 for m in MONTHS])
        fpre = ~fm_idx & pre_mask  # fake pre-treatment (all before real treatment)
        w2, synth2 = scm(y, X, fpre, fm_idx & pre_mask)
        _, eff_fake = effect_stats(y, synth2, fpre, fm_idx & pre_mask)

        # in-space placebos: SCM over untreated districts (exclude treated set)
        placebo_effects = []
        rng_d = RNG.choice(len(donors), size=min(15, len(donors)), replace=False)
        for di in rng_d:
            d = donors[di]
            yp = panel.loc[(d, cat)].values.astype(float)
            others = [dd for dd in donors if dd != d]
            Xp = np.vstack([panel.loc[(dd, cat)].values.astype(float) for dd in others]).T
            try:
                wp, sp = scm(yp, Xp, pre_mask, post_mask)
                _, ep = effect_stats(yp, sp, pre_mask, post_mask)
                placebo_effects.append(ep)
            except Exception:
                continue
        p_val = float(np.mean([abs(e) >= abs(eff) for e in placebo_effects])) if placebo_effects else 1.0

        report["districts"].append({
            "district": dist, "category": cat, "lgd_district_code": name2code.get(dist),
            "treatment_completed": str(trt.date()),
            "pre_months": int(pre_mask.sum()), "post_months": int(post_mask.sum()),
            "pre_rmspe": round(rmspe, 2),
            "pre_rmspe_relative_to_mean": round(rel_rmspe, 4),
            "observed_post_mean": round(float(y[post_mask].mean()), 2),
            "synthetic_post_mean": round(float(synth[post_mask].mean()), 2),
            "demand_decay_effect": round(eff, 2),
            "decay_pct": round(100 * (y[post_mask].mean() - synth[post_mask].mean())
                               / max(y[pre_mask].mean(), 1e-9), 1),
            "intime_placebo_effect": round(eff_fake, 2),
            "inspace_placebo_pvalue": round(p_val, 3),
            "donor_weights_top": {donors[i]: round(float(w[i]), 3)
                                   for i in np.argsort(-w)[:5] if w[i] > 0.01},
            "series": {"observed": y.round(2).tolist(),
                        "synthetic": synth.round(2).tolist()},
            "status": "ok",
        })
        all_effects.append((dist, cat, eff, rel_rmspe, eff_fake, p_val))

        # plot treated vs synthetic
        import matplotlib
        matplotlib.use("Agg")
        import matplotlib.pyplot as plt
        plt.rcParams["figure.dpi"] = 72
        fig, ax = plt.subplots(figsize=(7, 3.4))
        ax.plot(range(len(MONTHS)), y, "o-", label="observed (treated)")
        ax.plot(range(len(MONTHS)), synth, "s--", label="synthetic control")
        ti = int(np.argmax(m_idx))
        ax.axvline(ti - 0.5, color="red", ls=":", label="project completed")
        ax.set_title(f"{dist} — {cat} demand signal")
        ax.set_xticks(range(len(MONTHS)))
        ax.set_xticklabels([str(m) for m in MONTHS], rotation=90, fontsize=6)
        ax.legend(fontsize=7)
        fig.tight_layout()
        fig.savefig(RESULTS / "figures" / f"impact_{dist.lower().replace(' ', '_')}.png")
        plt.close(fig)

    (RESULTS / "impact_report.json").write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding="utf-8")
    (RUNS / "M6_impact_report.json").write_text(json.dumps(
        {"treated": [{"district": d, "category": c, "effect": round(e, 1),
                      "rel_rmspe": round(r, 3), "intime_placebo": round(f, 1),
                      "pval": p} for d, c, e, r, f, p in all_effects]}, indent=2), encoding="utf-8")

    ok_rmspe = all(r <= 0.15 for _, _, _, r, _, _ in all_effects)
    ok_placebo = all(p <= 0.10 for *_, p in all_effects)
    ok_intime = all(abs(f) <= 0.5 * abs(e) for _, _, e, _, f, _ in all_effects)
    print(f"[M6] treated={len(all_effects)} "
          + "; ".join(f"{d}:{c} effect={e:.1f} relRMSPE={r:.3f} intime={f:.1f} p={p}" for d, c, e, r, f, p in all_effects)
          + f" | EA rmspe<=15%:{ok_rmspe} in-time placebo ok:{ok_intime} treated>90% placebos:{ok_placebo}")
    return ok_rmspe and ok_placebo and ok_intime


if __name__ == "__main__":
    sys.exit(0 if main() else 1)
