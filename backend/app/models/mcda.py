"""Pydantic v2 schemas for Multi-Criteria Decision Analysis (MCDA)."""
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field


class McdaWeights(BaseModel):
    w_demand: float = Field(0.35, ge=0.0, le=1.0, description="Weight for Demand Intensity (w_D)")
    w_deprivation: float = Field(0.25, ge=0.0, le=1.0, description="Weight for Deprivation Gap (w_G)")
    w_population: float = Field(0.20, ge=0.0, le=1.0, description="Weight for Population Density (w_P)")
    w_scheme: float = Field(0.20, ge=0.0, le=1.0, description="Weight for Scheme Alignment (w_S)")


class McdaComponents(BaseModel):
    D_demand: float
    G_deprivation: float
    P_population: float
    S_scheme_alignment: float


class McdaPriorityCard(BaseModel):
    rank: int
    category: str
    location: str
    lgd_district_code: int
    demand_intensity: Dict[str, Any]
    deprivation_score: float
    scheme_match: Dict[str, Any]
    cost_per_beneficiary_proxy: float
    priority: float
    components: McdaComponents


class McdaSensitivityResponse(BaseModel):
    weights: McdaWeights
    spearman_rho: float = Field(..., ge=-1.0, le=1.0, description="Rank correlation vs baseline weights")
    top_recommendations: List[McdaPriorityCard]
