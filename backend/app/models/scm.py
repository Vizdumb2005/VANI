"""Pydantic v2 schemas for Abadie Synthetic Control Method (SCM) Causal Engine."""
from typing import Dict, List, Optional
from pydantic import BaseModel, Field


class ScmSeries(BaseModel):
    observed: List[float] = Field(..., description="Observed monthly demand intensity time-series")
    synthetic: List[float] = Field(..., description="Counterfactual donor-weighted synthetic trajectory")


class ScmPlaceboMetric(BaseModel):
    district: str
    pre_rmspe: float
    post_effect: float
    ratio: float


class ScmDistrictImpact(BaseModel):
    district: str
    category: str
    lgd_district_code: int
    treatment_completed: str
    pre_months: int
    post_months: int
    pre_rmspe: float
    pre_rmspe_relative_to_mean: float
    observed_post_mean: float
    synthetic_post_mean: float
    demand_decay_effect: float
    decay_pct: float
    intime_placebo_effect: float
    inspace_placebo_pvalue: float = Field(..., description="In-space placebo permutation p-value (p <= 0.10)")
    donor_weights_top: Dict[str, float]
    series: ScmSeries
