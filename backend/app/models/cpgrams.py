"""Pydantic v2 schemas for DARPG CPGRAMS & CM Portal Bi-Directional Adapter."""
from typing import List, Optional
from pydantic import BaseModel, Field


class CpgramsGrievancePayload(BaseModel):
    registration_no: str = Field(..., description="Institutional DARPG Registration No e.g. DARPG/P/2026/LGD...")
    ministry_code: str = Field(..., description="Target Line Ministry Code (e.g. MORTH, JALSHAKTI, POWER)")
    ministry_name: str
    lgd_district_code: str
    district_name: str
    category: str
    petition_summary: str
    severity_level: str = Field(..., description="P1_CRITICAL | P2_ELEVATED | P3_ROUTINE")
    sla_days: int = Field(..., description="Statutory resolution SLA in calendar days (15 for P1, 30 for P2)")
    deduplicated_reports: int
    source_dpi: str = "VAANI Sovereign DPI"


class CpgramsBatchSyncReceipt(BaseModel):
    batch_id: str
    timestamp: str
    records_dispatched: int
    nic_receipt_hash: str
    gateway_status: str = "DELIVERED_TO_DARPG_NIC"
    details: List[CpgramsGrievancePayload]
