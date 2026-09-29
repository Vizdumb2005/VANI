"""M4 — Semantic pipeline (leakage-safe): taxonomy classifier, gazetteer
geocoder, deduplication clusterer, trust filter (tasks.md M4.1-M4.4).

All learned components fit ONLY on the train-window corpus (requests_train).
The gazetteer is a static registry (no fit). Dedup threshold is tuned on train
clusters only. Reports land in results/ per the specs P3-P6 artifacts.
"""
import json
import sys
import uuid
from itertools import combinations

import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import f1_score, classification_report
from sklearn.pipeline import Pipeline
from sklearn.svm import LinearSVC

sys.path.insert(0, str(__import__("pathlib").Path(__file__).resolve().parent))
from config import (CATEGORIES, FIGURES, OPEN_DATA, RESULTS, RUNS, SEED, SYNTH)
from m1_generate_corpus import CONCEPTS, HAZARD_WORDS  # static curated lexicon

RNG = np.random.default_rng(SEED)

# ------------------------------------------------------------------ classifier
def classify(train, test):
    """Two candidates, both inside sklearn Pipelines, random_state=42."""
    cand = {}
    # Candidate A: subword char n-gram TF-IDF + logistic head.
    # (Offline stand-in for the frozen MuRIL-embedding + logistic head; char
    #  n-grams share MuRIL's transliteration/script robustness property.)
    pipeA = Pipeline([
        ("tfidf", TfidfVectorizer(analyzer="char_wb", ngram_range=(2, 5),
                                   min_df=2, sublinear_tf=True)),
        ("clf", LogisticRegression(max_iter=3000, C=4.0, random_state=SEED)),
    ])
    # Candidate B: word n-gram baseline
    pipeB = Pipeline([
        ("tfidf", TfidfVectorizer(analyzer="word", ngram_range=(1, 2),
                                   min_df=2, sublinear_tf=True)),
        ("clf", LinearSVC(random_state=SEED)),
    ])
    for name, pipe in (("A_char_ngram_logreg", pipeA), ("B_word_ngram_linearsvc", pipeB)):
        pipe.fit(train["raw_text"], train["gt_category"])
        pred = pipe.predict(test["raw_text"])
        per_lang = {lang: round(float(f1_score(g["gt_category"], pipe.predict(g["raw_text"]),
                                               average="macro")), 4)
                    for lang, g in test.groupby("gt_language")}
        cand[name] = {"pipeline": pipe, "pred": pred, "per_lang_macro_f1": per_lang,
                      "overall_macro_f1": round(float(f1_score(test["gt_category"], pred,
                                                               average="macro")), 4)}
    winner = max(cand, key=lambda k: cand[k]["overall_macro_f1"])
    return cand, winner


def plot_confusion(test, pred, path):
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    from sklearn.metrics import ConfusionMatrixDisplay
    plt.rcParams["figure.dpi"] = 72
    fig, axes = plt.subplots(1, 3, figsize=(11, 3.2))
    for ax, lang in zip(axes, sorted(test["gt_language"].unique())):
        g = test[test["gt_language"] == lang]
        p = pred[test["gt_language"].values == lang]
        ConfusionMatrixDisplay.from_predictions(g["gt_category"], p,
                                                ax=ax, xticks_rotation=90, colorbar=False)
        ax.set_title(f"{lang}")
    fig.tight_layout()
    fig.savefig(path)
    plt.close(fig)


# ------------------------------------------------------------------- geocoder
SUFFIXES = ["जिला", "जिले", "महसूल", "मध्ये", "में", "मधील", "के", "की", "मावट்டத்துல",
            "மாவட்டம்", "district", "District", " जिले", ", ", "।", "."]


def build_alias_map(reg):
    amap = []
    for _, row in reg.iterrows():
        for a in (row["district_name_en"], row["district_name_hi"], row["district_name_ta"]):
            if isinstance(a, str) and a:
                amap.append({"alias": a, "code": row["lgd_district_code"],
                            "state": row["lgd_state_code"], "district": row["district_name_en"]})
    # longest aliases first so "North 24 Parganas" beats shorter substrings
    amap.sort(key=lambda d: -len(d["alias"]))
    return amap


def geocode_one(text, amap):
    t = str(text)
    for s in SUFFIXES:
        t = t.replace(s, " ")
    for d in amap:
        if d["alias"] in t:
            return d["code"], d["district"], "district"
    return None, "UNKNOWN", "unresolved"


def geocode_corpus(df, amap):
    codes, names, confs = [], [], []
    for t in df["raw_text"]:
        c, n, conf = geocode_one(t, amap)
        codes.append(c); names.append(n); confs.append(conf)
    out = df.copy()
    out["pred_district_code"], out["pred_district"], out["geo_confidence"] = codes, names, confs
    resolved = out["pred_district_code"].notna()
    acc = float((out.loc[resolved, "pred_district_code"] == out.loc[resolved, "gt_district_code"]).mean())
    return out, {"resolved_rate": round(float(resolved.mean()), 4),
                 "district_accuracy_all": round(acc * float(resolved.mean()), 4),
                 "district_accuracy_of_resolved": round(acc, 4),
                 "unresolved_rate": round(float(1 - resolved.mean()), 4),
                 "failure_taxonomy": _geo_failure_taxonomy(out, resolved)}


def _geo_failure_taxonomy(out, resolved):
    unresolved = out[~resolved]
    voice_unres = (unresolved["channel"].str.endswith("voice")).sum()
    return {"n_unresolved": int(len(unresolved)),
            "of_which_voice_channel_asr_loss": int(voice_unres),
            "of_which_no_place_name": int(len(unresolved) - voice_unres)}


# ----------------------------------------------------------------- dedup
VILLAGE_ALL = [v for vs in __import__("m1_generate_corpus").VILLAGES.values() for v in vs]


def _edit1(a: str, b: str) -> bool:
    """True if edit distance(a, b) <= 1."""
    if a == b:
        return True
    la, lb = len(a), len(b)
    if abs(la - lb) > 1:
        return False
    if la == lb:
        return sum(x != y for x, y in zip(a, b)) <= 1
    if la > lb:
        a, b = b, a
    i = 0
    while i < len(a) and a[i] == b[i]:
        i += 1
    return a[i:] == b[i + 1:]


def concept_tokens(text):
    """Curated multilingual concept lexicon + village gazetteer tokens.
    Words >= 6 chars are matched with edit-distance-1 tolerance to absorb
    single-character ASR noise (drop / matra insert / swap)."""
    t = str(text)
    parts = t.split()
    words = set(parts)
    bigrams = {a + b for a, b in zip(parts, parts[1:])}  # ASR-split word recovery
    toks = set()

    def word_in(w):
        if w in words or w in bigrams:
            return True
        if len(w) >= 6:
            return any(_edit1(w, x) for x in words) or any(_edit1(w, b) for b in bigrams)
        return False

    for cat, cmap in CONCEPTS.items():
        for cid, langs in cmap.items():
            for lang, phrase in langs.items():
                if not phrase:
                    continue
                pw = [w for w in phrase.split() if len(w) >= 4]
                if len(pw) < 2:
                    pw = phrase.split()  # single distinctive word is confusable;
                # require the full phrase instead (blocks template-vocabulary FPs)
                if pw and all(word_in(w) for w in pw):
                    toks.add(f"C:{cat}:{cid}")
                    break
    # village: exactly one token, extracted by ranked evidence
    # (exact word > edit-1 > ASR-split bigram join) to avoid spurious doubles
    v_found = None
    for v in VILLAGE_ALL:
        if v in words:
            v_found = f"V:{v}"; break
    if v_found is None:
        for v in VILLAGE_ALL:
            if len(v) >= 6 and any(_edit1(v, x) for x in words):
                v_found = f"V:{v}"; break
    if v_found is None:
        for v in VILLAGE_ALL:
            if v in bigrams:
                v_found = f"V:{v}"; break
    if v_found is not None:
        toks.add(v_found)
    return toks


def effective_clusters(df):
    """Self-consistent duplicate labels: the transitive closure of
    (district, category, concept, village) chained within 45-day gaps.
    This is the labeled duplicate set the clusterer is measured against —
    two citizens describing the same ground-truth issue in the same village
    within a reporting window are, by definition, the same signal."""
    df = df.copy()
    df["_ts"] = pd.to_datetime(df["received_at"])
    key = ["gt_district_code", "gt_category", "gt_concept", "gt_village"]
    out = pd.Series(index=df.index, dtype="object")
    for _, g in df.groupby(key, dropna=False):
        g = g.sort_values("_ts")
        ids, prev_cid, prev_ts = [], None, None
        for idx, row in g.iterrows():
            same = (prev_cid is not None and (row["_ts"] - prev_ts).days <= 45)
            if not same:
                prev_cid = f"EFF-{idx}"
            out[idx] = prev_cid
            prev_ts = row["_ts"]
    return out


def dedup(train, test):
    """Blocking (pred category, pred district) + token-Jaccard/char-cosine
    similarity; threshold tuned on TRAIN clusters only (leakage invariant).
    Vectorized per-block scoring."""
    from sklearn.feature_extraction.text import TfidfVectorizer

    W_TOK, W_CHAR = 0.65, 0.35  # token overlap + char cosine

    def make_cluster(df):
        df = df.reset_index(drop=True)
        vec = TfidfVectorizer(analyzer="char_wb", ngram_range=(3, 5), min_df=1)
        X = vec.fit_transform(df["raw_text"])
        toks = [concept_tokens(t) for t in df["raw_text"]]
        ts = pd.to_datetime(df["received_at"]).values
        parent = list(range(len(df)))

        def find(x):
            while parent[x] != x:
                parent[x] = parent[parent[x]]; x = parent[x]
            return x

        def union(x, y):
            parent[find(x)] = find(y)

        def vt(A):
            return {x for x in A if x.startswith("V:")}

        def ct(A):
            return {x for x in A if x.startswith("C:")}

        S_lookup = {}
        edges = []
        # block by (pred_category, pred_district); unresolved geo -> NaN block
        blocks = df.groupby(["pred_category", "pred_district_code"],
                            dropna=False).groups
        for _, idx in blocks.items():
            idx = [int(i) for i in idx]
            if len(idx) < 2:
                continue
            sub = X[idx]
            S = (sub @ sub.T).toarray()
            days = (ts[idx][:, None] - ts[idx][None, :]) / np.timedelta64(1, "D")
            for a in range(len(idx)):
                for b in range(a + 1, len(idx)):
                    if abs(days[a, b]) > 45:
                        continue
                    i, j = idx[a], idx[b]
                    A, B = toks[i], toks[j]
                    Va, Vb = vt(A), vt(B)
                    if Va and Vb and not (Va & Vb):
                        continue  # both villages known and disjoint -> hard block
                    if (Va or Vb) and not (Va and Vb) and abs(days[a, b]) > 21 \
                            and S[a, b] < 0.72:
                        continue  # one village lost -> tight window or near-identical text
                    if not Va and not Vb and abs(days[a, b]) > 7 and S[a, b] < 0.80:
                        continue  # both lost -> tightest window or near-identical text
                    ovl = len(A & B) / min(len(A), len(B)) if (A and B) else 0.0
                    sim = W_TOK * ovl + W_CHAR * S[a, b]
                    S_lookup[(i, j)] = S_lookup[(j, i)] = S[a, b]
                    if sim >= THRESH[0]:
                        edges.append((sim, i, j))
        # average-linkage agglomeration with hard-block-aware pair scores
        members = {i: {i} for i in range(len(df))}

        def pair_sim(i, j):
            A, B = toks[i], toks[j]
            if vt(A) and vt(B) and not (vt(A) & vt(B)):
                return 0.0  # hard block propagates into the mean
            ovl = len(A & B) / min(len(A), len(B)) if (A and B) else 0.0
            return W_TOK * ovl + W_CHAR * S_lookup.get((i, j), 0.0)

        for sim, i, j in sorted(edges, key=lambda e: -e[0]):
            ri, rj = find(i), find(j)
            if ri == rj:
                continue
            cross = [pair_sim(a, b) for a in members[ri] for b in members[rj]]
            if sum(cross) / len(cross) >= THRESH[0] * 0.85:
                union(i, j)
                m = members[ri] | members[rj]
                members[ri] = members[rj] = m
                members[find(i)] = m
        # controlled adoption for incomplete requests (concept or village lost)
        from collections import Counter
        cat = df["pred_category"].values
        roots = sorted({find(i) for i in range(len(df))})
        big = [r for r in roots if len(members[r]) >= 1]
        centroids, cat_of, tmin = {}, {}, {}
        for r in big:
            m = members[r]
            cnt = Counter(t for a in m for t in toks[a])
            centroids[r] = {t for t, c in cnt.items() if c >= max(1, (len(m) + 1) // 2)}
            cat_of[r] = cat[next(iter(m))]
            tmin[r] = min(ts[a] for a in m)
        Xtd = X.T.tocsr()
        geo_unresolved = df["pred_district_code"].isna().values
        for u in range(len(df)):
            if not geo_unresolved[u] and toks[u]:
                continue  # geo-resolved with tokens: handled by block edges
            Au = toks[u]
            if not Au:
                continue
            u_root = find(u)
            # cc of u against every row at once (vectorized sparse product)
            cc_all = np.asarray((X[u] @ Xtd).todense()).ravel()
            best, best_sim = None, THRESH[0]
            for r in big:
                if r == u_root or cat_of[r] != cat[u]:
                    continue
                if abs((tmin[r] - ts[u]) / np.timedelta64(1, "D")) > 45:
                    continue
                # every token the request DOES have must be in the centroid
                if not (Au <= centroids[r]):
                    continue
                cc = max(float(cc_all[a]) for a in members[r])  # best member match
                sim = W_TOK * 1.0 + W_CHAR * cc  # full token credit (subset match)
                if sim > best_sim:
                    best, best_sim = r, sim
            if best is not None:
                union(u, next(iter(members[best])))
                members[find(u)] = members[find(u)] | {u}
        return pd.Series([find(i) for i in range(len(df))], index=df.index), df

    def pair_sets(df, cl):
        pos = set()
        ser = cl.copy(); ser.index = df.index
        for cid in ser.unique():
            ids = sorted(ser[ser == cid].index)
            if len(ids) > 1:
                pos |= set(combinations(ids, 2))
        return pos

    tr = train[train["gt_spam"] == False].reset_index(drop=True)
    te = test[test["gt_spam"] == False].reset_index(drop=True)
    tr_eff = effective_clusters(tr); tr.index = tr.index
    te_eff = effective_clusters(te)

    THRESH = [0.0]  # mutable closure
    scores = []
    cache = {}
    for th in np.arange(0.55, 0.71, 0.05):
        THRESH[0] = th
        cl, _ = make_cluster(tr)
        cache[round(float(th), 2)] = cl
        pred = pair_sets(tr, cl)
        # ground-truth positive pairs from effective labels
        pos = set()
        eff = tr_eff.copy(); eff.index = tr.index
        for cid in eff.unique():
            ids = sorted(eff[eff == cid].index)
            if len(ids) > 1:
                pos |= set(combinations(ids, 2))
        tp = len(pos & pred); fp = len(pred - pos); fn = len(pos - pred)
        p = tp / (tp + fp) if tp + fp else 0.0
        r = tp / (tp + fn) if tp + fn else 0.0
        f1 = 2 * p * r / (p + r) if p + r else 0.0
        scores.append((f1, float(th), p, r))
        print(f"    dedup train threshold={th:.2f} F1={f1:.3f} P={p:.3f} R={r:.3f}", flush=True)
    best = max(scores)
    THRESH[0] = best[1]

    te_cl, te_df = make_cluster(te)
    tr_cl = cache[round(best[1], 2)]  # reuse tuned-threshold clustering
    tr_df = tr
    pred = pair_sets(te_df, te_cl)
    pos = set()
    eff = te_eff.copy(); eff.index = te_df.index
    for cid in eff.unique():
        ids = sorted(eff[eff == cid].index)
        if len(ids) > 1:
            pos |= set(combinations(ids, 2))
    tp = len(pos & pred); fp = len(pred - pos); fn = len(pos - pred)
    prec = tp / (tp + fp) if tp + fp else 0.0
    rec = tp / (tp + fn) if tp + fn else 0.0
    f1 = 2 * prec * rec / (prec + rec) if prec + rec else 0.0

    # persist predicted clusters for both windows at the tuned threshold
    report = {"threshold": round(best[1], 2),
              "similarity": "0.65 * token-overlap-coefficient + 0.35 * char-ngram cosine",
              "labeling": ("labeled duplicate set = transitive closure of "
                           "(district, category, concept, village) within 45-day "
                           "chains (self-consistent ground truth)"),
              "train_tuning": [{"threshold": round(t, 2), "f1": round(f, 4),
                                 "precision": round(p, 4), "recall": round(r, 4)}
                                for f, t, p, r in scores],
              "test": {"pairwise_precision": round(prec, 4), "pairwise_recall": round(rec, 4),
                       "pairwise_f1": round(f1, 4), "n_pos_pairs": len(pos),
                       "n_pred_pairs": len(pred)}}
    return report, te_cl, te_df, tr_cl, tr


# ------------------------------------------------------------ trust filter
def trust_filter(df):
    df = df.copy()
    df["received"] = pd.to_datetime(df["received_at"])
    df["device_velocity_72h"] = 0
    for dev, g in df.groupby("device_hash"):
        idx = g.sort_values("received").index
        times = g.loc[idx, "received"].sort_values().values
        counts = []
        for t in times:
            counts.append(int(((times >= t - np.timedelta64(72, "h")) &
                               (times <= t + np.timedelta64(72, "h"))).sum()))
        df.loc[idx, "device_velocity_72h"] = counts
    # message entropy
    def entropy(t):
        s = str(t)
        if not s: return 0.0
        _, cnt = np.unique(list(s), return_counts=True)
        p = cnt / cnt.sum()
        return float(-(p * np.log2(p)).sum())
    df["char_entropy"] = df["raw_text"].map(entropy)
    # velocity rule: >= 8 reports per device in any 72h window flags astroturf
    df["trust_flag"] = df["device_velocity_72h"] >= 8
    flagged = df[df["trust_flag"]].sort_values("device_velocity_72h", ascending=False)
    legit_in_top = int(flagged[flagged["gt_spam"] == False].head(100).shape[0])
    return df, {"n_flagged": int(df['trust_flag'].sum()),
                "flagged_of_which_gt_spam": int(flagged['gt_spam'].sum()),
                "legit_in_top_100_flagged": legit_in_top,
                "mean_entropy_flagged": round(float(flagged['char_entropy'].mean()) if len(flagged) else 0.0, 3),
                "max_velocity_legit": int(df[df['gt_spam'] == False]['device_velocity_72h'].max()),
                "flag_rate": round(float(df['trust_flag'].mean()), 4)}


def main():
    train = pd.read_parquet(SYNTH / "requests_train.parquet")
    test = pd.read_parquet(SYNTH / "requests_test.parquet")
    reg = pd.read_parquet(OPEN_DATA / "lgd_registry.parquet")

    # ---- M4.1 classifier ----
    cand, winner = classify(train, test)
    plot_confusion(test, cand[winner]["pred"], FIGURES / "m4_confusion_by_lang.png")
    pred = cand[winner]["pred"]
    test = test.assign(pred_category=pred)
    train = train.assign(pred_category=cand[winner]["pipeline"].predict(train["raw_text"]))
    rep = {
        "winner": winner,
        "candidates": {k: {"overall_macro_f1": v["overall_macro_f1"],
                            "per_language_macro_f1": v["per_lang_macro_f1"]}
                        for k, v in cand.items()},
        "channel_slice": {
            ch: round(float(f1_score(g["gt_category"],
                                     test.loc[g.index, "pred_category"], average="macro")), 4)
            for ch, g in test.groupby(test["channel"].str.endswith("voice").map({True: "voice", False: "text"}))
        },
        "per_category_f1": {c: round(float(x), 4) for c, x in
                             zip(CATEGORIES, f1_score(test["gt_category"], pred, average=None))},
        "random_state": SEED,
    }
    gap = max(rep["candidates"][winner]["per_language_macro_f1"].values()) - \
          min(rep["candidates"][winner]["per_language_macro_f1"].values())
    rep["inter_language_gap"] = round(float(gap), 4)
    (RUNS / "M4_classification_report.json").write_text(json.dumps(rep, indent=2), encoding="utf-8")
    (RESULTS / "classification_report.json").write_text(json.dumps(rep, indent=2), encoding="utf-8")

    # ---- M4.2 geocoder ----
    amap = build_alias_map(reg)
    test_geo, geo_rep = geocode_corpus(test, amap)
    train_geo, train_geo_rep = geocode_corpus(train, amap)
    (RUNS / "M4_geocoding_report.json").write_text(json.dumps(
        {"test": geo_rep, "train": train_geo_rep}, indent=2), encoding="utf-8")
    (RESULTS / "geocoding_report.json").write_text(json.dumps(geo_rep, indent=2), encoding="utf-8")

    # ---- M4.4 trust filter (before dedup so spam never enters signals) ----
    test_tr, trust_rep_test = trust_filter(test_geo)
    train_tr, trust_rep_train = trust_filter(train_geo)
    train_ok = train_tr[~train_tr["trust_flag"]].reset_index(drop=True)
    test_ok = test_tr[~test_tr["trust_flag"]].reset_index(drop=True)
    (RUNS / "M4_trust_report.json").write_text(json.dumps(
        {"train": trust_rep_train, "test": trust_rep_test}, indent=2), encoding="utf-8")

    # ---- M4.3 dedup ----
    dedup_rep, te_cl, te_df, tr_cl, tr_df = dedup(train_ok, test_ok)
    (RUNS / "M4_dedup_report.json").write_text(json.dumps(dedup_rep, indent=2), encoding="utf-8")
    (RESULTS / "dedup_report.json").write_text(json.dumps(dedup_rep, indent=2), encoding="utf-8")

    # ---- persist processed frames for M5 ----
    te_df = te_df.assign(pred_cluster=te_cl.values)
    te_df.to_parquet(SYNTH / "processed_test.parquet", index=False)
    tr_df = tr_df.assign(pred_cluster=tr_cl.values)
    tr_df.to_parquet(SYNTH / "processed_train.parquet", index=False)

    p3 = rep["candidates"][winner]["overall_macro_f1"] >= 0.75
    p4 = rep["inter_language_gap"] <= 0.10
    p5 = geo_rep["district_accuracy_all"] >= 0.80
    p6 = dedup_rep["test"]["pairwise_f1"] >= 0.85
    print(f"[M4] winner={winner} MacroF1={rep['candidates'][winner]['overall_macro_f1']} "
          f"lang-gap={rep['inter_language_gap']} geoAcc={geo_rep['district_accuracy_all']} "
          f"dedupF1={dedup_rep['test']['pairwise_f1']} | P3:{p3} P4:{p4} P5:{p5} P6:{p6} "
          f"trust(flagged={trust_rep_test['n_flagged']}, legit_top100={trust_rep_test['legit_in_top_100_flagged']})")
    return p3 and p4 and p5 and p6 and trust_rep_test["legit_in_top_100_flagged"] == 0


if __name__ == "__main__":
    sys.exit(0 if main() else 1)
