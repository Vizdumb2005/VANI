"""Validate api/openapi.yaml against the OpenAPI 3.1 specification."""
import sys
from pathlib import Path
import yaml
from openapi_spec_validator import validate

ROOT = Path(__file__).resolve().parents[1]
spec_path = ROOT / "api" / "openapi.yaml"

if not spec_path.exists():
    print(f"ERROR: Specification file missing at {spec_path}", file=sys.stderr)
    sys.exit(1)

try:
    spec = yaml.safe_load(spec_path.read_text(encoding="utf-8"))
    validate(spec)
    print("OpenAPI 3.1.0 Validation: PASSED (Zero Schema Violations)")
except Exception as exc:
    print(f"ERROR: OpenAPI Validation Failed: {exc}", file=sys.stderr)
    sys.exit(1)
