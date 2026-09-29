.PHONY: demo-rebuild run api dashboard clean

# Full reproducible rebuild from seed (P12): regenerates corpus, models,
# analytics, dashboard and audits from a clean state. SEED=42 everywhere.
demo-rebuild:
	@echo "== VAANI demo-rebuild from clean state =="
	rm -rf data/synthetic data/raw results figures
	mkdir -p data/synthetic data/raw results/figures
	python3 workflow/run_all.py

run: demo-rebuild

api:
	uvicorn app.main:app --host 0.0.0.0 --port 8000

dashboard:
	python3 workflow/m7_dashboard.py
	@echo "open dashboard/index.html"

clean:
	rm -rf data/synthetic data/raw results
