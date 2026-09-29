"""M2.1 — Corpus EDA (EDA Specialist agent).

Produces results/M2_eda_report.md + figures: language x channel x category
distributions, report-length stats, location-name frequency, duplicate-cluster
size histogram. Exit assertion: per-language category balance ratio <= 3:1.
"""
import json

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import pandas as pd

from config import FIGURES, RUNS, SYNTH

plt.rcParams["figure.dpi"] = 72


def main():
    tr = pd.read_parquet(SYNTH / "requests_train.parquet")
    te = pd.read_parquet(SYNTH / "requests_test.parquet")
    df = pd.concat([tr, te], ignore_index=True)
    df["len_chars"] = df["raw_text"].str.len()

    # ---- figures ----
    fig, axes = plt.subplots(2, 2, figsize=(10, 7))

    ct = pd.crosstab(df["gt_language"], df["channel"])
    ct.plot(kind="bar", ax=axes[0, 0], title="Channel x language")
    axes[0, 0].set_xlabel("language")

    cat_counts = df["gt_category"].value_counts()
    axes[0, 1].barh(cat_counts.index, cat_counts.values, color="#2b6cb0")
    axes[0, 1].set_title("Category distribution (total)")

    for lang, g in df.groupby("gt_language"):
        axes[1, 0].hist(g["len_chars"], bins=40, alpha=0.6, label=lang)
    axes[1, 0].set_title("Report length (chars) by language")
    axes[1, 0].legend()

    cl = df.dropna(subset=["gt_cluster"]).groupby("gt_cluster").size()
    axes[1, 1].hist(cl.values, bins=30, color="#276749")
    axes[1, 1].set_title(f"Duplicate-cluster size histogram (n={len(cl)})")
    axes[1, 1].set_xlabel("cluster size")

    fig.tight_layout()
    fig.savefig(FIGURES / "m2_eda_grid.png")
    plt.close(fig)

    # per-language x category balance ratio (EA)
    lc = pd.crosstab(df["gt_language"], df["gt_category"])
    ratios = (lc.max(axis=1) / lc.min(axis=1)).round(2)

    # voice vs text channel WER-proxy noise (chars lost vs source)
    voice = df[df["channel"].str.endswith("voice")]
    text = df[~df["channel"].str.endswith("voice")]
    noise = (1 - voice["raw_text"].str.len() / voice["gt_source_text"].str.len()).describe()

    # location mention frequency (top 15 districts)
    reg = pd.read_parquet(__import__("config").OPEN_DATA / "lgd_registry.parquet")
    def mention_rate(col):
        def f(t):
            t = str(t)
            return sum(1 for _, row in reg.iterrows()
                       for a in (row["district_name_en"], row["district_name_hi"], row["district_name_ta"])
                       if isinstance(a, str) and a and a in t)
        return f
    top_loc = (df["gt_district"].value_counts().head(15))

    report = f"""# M2.1 — Corpus EDA Report

## Overview
- Total requests: **{len(df)}** (train {len(tr)} / test {len(te)})
- Languages: {dict(df['gt_language'].value_counts())}
- Channels: {dict(df['channel'].value_counts())}

## Language x category balance (EA: max/min <= 3:1)
| language | ratio |
|---|---|
""" + "\n".join(f"| {l} | {r} |" for l, r in ratios.items()) + f"""

**EA result: {'PASS' if (ratios <= 3).all() else 'REBALANCE REQUIRED'}**

## Report length (chars)
| channel | mean | p50 | p95 |
|---|---|---|---|
| voice (ASR output) | {voice['len_chars'].mean():.0f} | {voice['len_chars'].median():.0f} | {voice['len_chars'].quantile(0.95):.0f} |
| text | {text['len_chars'].mean():.0f} | {text['len_chars'].median():.0f} | {text['len_chars'].quantile(0.95):.0f} |

Voice-channel ASR compression vs source text (mean char-loss): {noise['mean']:.3f}

## Duplicate clusters
- Clusters: {cl.shape[0]}; sizes min={cl.min()}, median={cl.median():.0f}, max={cl.max()}
- Cross-lingual clusters: {df.dropna(subset=['gt_cluster']).groupby('gt_cluster')['gt_language'].nunique().gt(1).sum()}
- Spam (astroturf) rows: {int(df['gt_spam'].sum())}

## Most-referenced districts (ground truth)
{top_loc.to_string()}

## Figures
- results/figures/m2_eda_grid.png
"""
    (RESULTS_DIR := __import__("config").RESULTS).mkdir(exist_ok=True)
    (RESULTS_DIR / "M2_eda_report.md").write_text(report, encoding="utf-8")
    (RUNS / "M2_eda.json").write_text(json.dumps({
        "balance_ratios": ratios.to_dict(),
        "ea_pass": bool((ratios <= 3).all()),
        "clusters": int(cl.shape[0]),
        "total": len(df),
    }, indent=2), encoding="utf-8")
    print(f"[M2.1] EDA done. balance ratios: {ratios.to_dict()} EA={'PASS' if (ratios<=3).all() else 'FAIL'}")
    return bool((ratios <= 3).all())


if __name__ == "__main__":
    raise SystemExit(0 if main() else 1)
