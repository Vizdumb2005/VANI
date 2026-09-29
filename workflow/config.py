"""VAANI global configuration. Single source of truth for paths, seeds, constants."""
from pathlib import Path

# --- Reproducibility invariant (specs.md §5) ---
SEED = 42

# --- Project root = parent of workflow/ ---
ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
OPEN_DATA = DATA / "open"
SYNTH = DATA / "synthetic"
RAW = DATA / "raw"
AUDIO_DIR = DATA / "audio"
RESULTS = ROOT / "results"
RUNS = RESULTS / "runs"
FIGURES = RESULTS / "figures"
API_DIR = ROOT / "api"
DASHBOARD = ROOT / "dashboard"

for _d in (OPEN_DATA, SYNTH, RAW, AUDIO_DIR, RESULTS, RUNS, FIGURES, DASHBOARD):
    _d.mkdir(parents=True, exist_ok=True)

# --- Taxonomy (specs.md §2.2) ---
CATEGORIES = ["roads", "water_sanitation", "power", "health", "education",
              "public_safety", "other"]
CHANNELS = ["whatsapp_voice", "whatsapp_text", "web_voice", "web_text"]
LANGUAGES = ["hi", "ta", "mr"]          # demo languages (specs.md §1.2)
CHANNEL_ENUM = "enum{whatsapp_voice,whatsapp_text,web_voice,web_text}"
GEO_CONFIDENCE_ENUM = ["exact_subdistrict", "district", "state", "unresolved"]

# --- Temporal split (design.md §3): train / guard gap / test ---
TRAIN_START = "2025-10-01"
TRAIN_END = "2026-06-30"
GAP_START = "2026-07-01"
GAP_END = "2026-07-14"
TEST_START = "2026-07-15"
TEST_END = "2026-09-25"

# --- Scheme registry for MCDA 'S' component and scheme matching ---
SCHEMES = {
    "roads":         ("PMGSY", "Pradhan Mantri Gram Sadak Yojana - rural road connectivity"),
    "water_sanitation": ("Jal Jeevan Mission", "Har Ghar Jal - functional household tap connections"),
    "power":         ("IPDS", "Integrated Power Development Scheme - distribution strengthening"),
    "health":        ("NHM", "National Health Mission - rural health infrastructure"),
    "education":     ("Samagra Shiksha", "School infrastructure and teacher support"),
    "public_safety": ("Safe City", "Nirbhaya Fund Safe City projects - urban safety"),
    "other":         ("AMRUT", "Atal Mission for Rejuvenation and Urban Transformation"),
}

# --- MCDA weights (design.md §2.4), explicit policy preference ---
MCDA_WEIGHTS = {"D": 0.40, "G": 0.25, "P": 0.15, "S": 0.20}

# --- Quality gates (specs.md §2.4) ---
GEOCODE_UNRESOLVED_MAX = 0.15
MIN_LANG_SHARE = 0.05
MIN_CELL_AGGREGATION = 3   # privacy aggregation threshold (design.md §2.6)

# --- Device hash salt (rotatable; env override in production) ---
DEVICE_HASH_SALT = "vaani-demo-salt-v1"


def ensure_dirs():
    for d in (OPEN_DATA, SYNTH, RAW, AUDIO_DIR, RESULTS, RUNS, FIGURES, DASHBOARD):
        d.mkdir(parents=True, exist_ok=True)
