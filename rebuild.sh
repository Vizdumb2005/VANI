#!/usr/bin/env bash
# demo-rebuild without GNU make (portable; mirrors the Makefile target)
set -e
echo "== VAANI demo-rebuild from clean state =="
rm -rf data/synthetic data/raw results figures dashboard/index.html
mkdir -p data/synthetic data/raw results/figures
ulimit -v unlimited
export OPENBLAS_NUM_THREADS=1 OMP_NUM_THREADS=1
python3 workflow/run_all.py
