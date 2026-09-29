"""Full VAANI pipeline — one command reproducibility (P12).

Runs every milestone in order, with per-stage exit assertions. Any failure
stops the build with a non-zero exit. `make demo-rebuild` invokes this after
cleaning generated artifacts.
"""
import subprocess
import sys
import time

STAGES = [
    ("M1.1 open-data landings", "m1_build_open_data.py"),
    ("M1.2 synthetic corpus", "m1_generate_corpus.py"),
    ("M1.3 schema validation", "validate_schema.py"),
    ("M2.1 corpus EDA", "m2_eda.py"),
    ("M2.2 leakage audit", "m2_leakage_audit.py"),
    ("M3 ingestion + ASR benchmark + privacy prelim", "m3_ingest_benchmark.py"),
    ("M4 semantic pipeline (classify, geocode, dedup, trust)", "m4_semantic.py"),
    ("M5 fusion, hotspots, MCDA", "m5_fusion.py"),
    ("M6 impact engine (SCM + placebos)", "m6_impact.py"),
    ("M7 privacy audit", "m7_privacy_audit.py"),
    ("M7 dashboard build", "m7_dashboard.py"),
]

if __name__ == "__main__":
    import os
    os.chdir(os.path.dirname(os.path.abspath(__file__)))  # run from workflow/
    t0 = time.time()
    for name, script in STAGES:
        t = time.time()
        print(f"=== {name} ({script}) ===", flush=True)
        r = subprocess.run([sys.executable, "-u", script])
        dt = time.time() - t
        if r.returncode != 0:
            print(f"!!! {name} FAILED after {dt:.0f}s — build aborted")
            sys.exit(1)
        print(f"--- {name} OK ({dt:.0f}s)", flush=True)
    print(f"=== demo-rebuild COMPLETE in {time.time()-t0:.0f}s (all EAs passed) ===")
