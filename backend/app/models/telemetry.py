"""Pydantic v2 schemas for signals, hotspots, and LGD geospatial telemetry."""
from typing import Optional, List
from pydantic import BaseModel, Field


class DemandSignal(BaseModel):
    lgd_district_code: int = Field(..., description="MoPR 6-digit LGD District Code")
    district: str = Field(..., description="Official district name")
    category: str = Field(..., description="Infrastructure category")
    report_count: int = Field(..., ge=3, description="Citizen petition volume (k >= 3)")
    signal_count: int = Field(..., description="Deduplicated semantic cluster count")
    urgency: float = Field(..., ge=0.0, le=1.0, description="Calibrated urgency factor")


class GeocodedHotspot(BaseModel):
    id: str = Field(..., description="Unique hotspot identifier")
    district: str = Field(..., description="District name")
    state: str = Field(..., description="State or Union Territory")
    lgd_district_code: int = Field(..., description="LGD district identifier")
    lat: float = Field(..., description="Latitude")
    lng: float = Field(..., description="Longitude")
    category: str = Field(..., description="Infrastructure taxonomy classification")
    excess_ratio: float = Field(..., description="Demand multiple relative to national baseline")
    report_count: int = Field(..., ge=3, description="Aggregated report volume")
    status: str = Field(default="VERIFIED", description="Status: VERIFIED | DISPATCHED | REMEDIATED")


class SpatialRegistryEntry(BaseModel):
    lgd_district_code: int
    district_name: str
    state_name: str
    centroid_lat: float
    centroid_lng: float
    population_census_2011: int
    nfhs5_deprivation_index: float
    aspirational_district: bool = False
