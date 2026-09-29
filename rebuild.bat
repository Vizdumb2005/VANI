@echo off
REM VAANI — Windows CMD Clean Rebuild (P12)
REM Reproducible from seed (SEED = 42)

echo == VAANI demo-rebuild from clean state (CMD) ==

if exist data\synthetic rmdir /s /q data\synthetic
if exist data\raw rmdir /s /q data\raw
if exist results\runs rmdir /s /q results\runs
if exist results\figures rmdir /s /q results\figures

mkdir data\synthetic
mkdir data\raw
mkdir results\runs
mkdir results\figures

python workflow\run_all.py
