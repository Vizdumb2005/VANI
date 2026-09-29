"""BRICS Cross-Border Scalability Engine for VAANI.

Fulfills Hackathon Rule 04:
"Solutions should be designed with cross-border applicability in mind —
built for one context but scalable to others across BRICS nations."

Demonstrates how the core architecture (voice intake -> multilingual classification ->
spatial gazetteer geocoding -> MCDA multi-criteria prioritization -> SCM causal impact)
seamlessly transfers from India's administrative context to other BRICS / Global South partners.
"""
from typing import Dict, Any, List

BRICS_PROFILES: Dict[str, Dict[str, Any]] = {
    "IND": {
        "country": "India",
        "flag": "🇮🇳",
        "currency": "INR (₹)",
        "spatial_gazetteer_standard": "Local Government Directory (LGD) — Ministry of Panchayati Raj",
        "spatial_unit": "Districts & Sub-districts (Blocks/Tehsils)",
        "spatial_code_example": "LGD 198 (Varanasi), LGD 215 (Gaya)",
        "demographic_baseline": "Census of India 2011 & NFHS-5 Health & Deprivation Survey",
        "official_languages": ["Hindi", "Tamil", "Marathi", "Bengali", "Telugu", "Kannada", "Gujarati", "Punjabi", "Odia", "Malayalam", "Assamese", "Urdu"],
        "primary_infrastructure_schemes": {
            "roads": "Pradhan Mantri Gram Sadak Yojana (PMGSY)",
            "water_sanitation": "Jal Jeevan Mission (JJM) & Swachh Bharat Urban",
            "power": "Revamped Distribution Sector Scheme (RDSS)",
            "health": "PM Ayushman Bharat Health Infrastructure Mission (PM-ABHIM)",
            "education": "Samagra Shiksha Abhiyan",
            "public_safety": "Safe City Project & Ministry of Home Affairs CCTNS"
        }
    },
    "BRA": {
        "country": "Brazil",
        "flag": "🇧🇷",
        "currency": "BRL (R$)",
        "spatial_gazetteer_standard": "IBGE Código de Município — Instituto Brasileiro de Geografia e Estatística",
        "spatial_unit": "Municípios & Regiões Metropolitanas",
        "spatial_code_example": "IBGE 3550308 (São Paulo), IBGE 3304557 (Rio de Janeiro), IBGE 2927408 (Salvador)",
        "demographic_baseline": "Censo Demográfico IBGE 2022 & Cadastro Único (CadÚnico)",
        "official_languages": ["Portuguese"],
        "primary_infrastructure_schemes": {
            "roads": "Novo PAC (Programa de Aceleração do Crescimento — Rodovias)",
            "water_sanitation": "Marco Legal do Saneamento Básico & Água para Todos",
            "power": "Programa Luz para Todos (MME)",
            "health": "Atenção Primária à Saúde (APS) & Programa SUS Digital",
            "education": "Fundeb — Fundo de Manutenção e Desenvolvimento da Educação Básica",
            "public_safety": "PRONASCI — Programa Nacional de Segurança Pública com Cidadania"
        }
    },
    "ZAF": {
        "country": "South Africa",
        "flag": "🇿🇦",
        "currency": "ZAR (R)",
        "spatial_gazetteer_standard": "Municipal Demarcation Board (MDB) Spatial Boundary Codes",
        "spatial_unit": "Metropolitan, District (Category C), and Local Municipalities (Category B)",
        "spatial_code_example": "MDB JHB (City of Johannesburg), MDB CPT (City of Cape Town), MDB ETH (eThekwini)",
        "demographic_baseline": "Stats SA Census 2022 & South African Multidimensional Poverty Index (SAMPI)",
        "official_languages": ["isiZulu", "isiXhosa", "Afrikaans", "English", "Sepedi", "Setswana"],
        "primary_infrastructure_schemes": {
            "roads": "S'hamba Sonke Road Maintenance Programme (DoT)",
            "water_sanitation": "Municipal Infrastructure Grant (MIG) — Water & Sanitation",
            "power": "Integrated National Electrification Programme (INEP)",
            "health": "National Health Insurance (NHI) Strategic Infrastructure Fund",
            "education": "Accelerated Schools Infrastructure Delivery Initiative (ASIDI)",
            "public_safety": "SAPS Integrated Crime Prevention Strategy"
        }
    }
}


def get_brics_country_profile(country_iso: str = "IND") -> Dict[str, Any]:
    """Returns the administrative and scheme metadata for the given BRICS nation."""
    return BRICS_PROFILES.get(country_iso.upper(), BRICS_PROFILES["IND"])


def list_supported_brics_nations() -> List[Dict[str, str]]:
    """Returns list of supported BRICS nations for UI selectors and API consumers."""
    return [
        {"iso": k, "name": v["country"], "flag": v["flag"], "spatial_standard": v["spatial_gazetteer_standard"]}
        for k, v in BRICS_PROFILES.items()
    ]


def map_scheme_to_brics(category: str, country_iso: str = "IND") -> str:
    """Resolves local infrastructure grant program for any sector across BRICS."""
    profile = get_brics_country_profile(country_iso)
    schemes = profile.get("primary_infrastructure_schemes", {})
    return schemes.get(category, "National Public Infrastructure Fund")
