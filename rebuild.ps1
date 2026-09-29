# VAANI — Windows PowerShell Clean Rebuild (P12)
# Reproducible from seed (SEED = 42)

Write-Host "== VAANI demo-rebuild from clean state (Windows PowerShell) ==" -ForegroundColor Cyan

# Remove previous generated data and results
Remove-Item -Recurse -Force -ErrorAction SilentlyContinue data/synthetic, data/raw, results/runs, results/figures

# Recreate clean directories
New-Item -ItemType Directory -Force data/synthetic, data/raw, results/runs, results/figures | Out-Null

# Run the complete milestone pipeline M1.1 -> M7.1
python workflow/run_all.py

if ($LASTEXITCODE -eq 0) {
    Write-Host "== VAANI demo-rebuild SUCCEEDED ===" -ForegroundColor Green
} else {
    Write-Host "== VAANI demo-rebuild FAILED ===" -ForegroundColor Red
}
