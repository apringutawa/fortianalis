"""Pydantic schemas for the report API."""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class AIInsightResponse(BaseModel):
    analysis: str
    recommendation: str
    powered_by: str


class StatsResponse(BaseModel):
    totalRequests: int
    totalAttacks: int
    blockedAttacks: int
    uniqueIps: int
    blockRate: float


class ReportSummary(BaseModel):
    id: str
    filename: str
    created_at: datetime
    total_requests: int
    total_attacks: int
    blocked_attacks: int
    unique_ips: int
    block_rate: float
    is_demo: bool

    class Config:
        from_attributes = True


class ReportDetail(ReportSummary):
    attack_types: list[dict]
    attacker_ips: list[dict]
    subdomains: list[dict]
    timeline_data: list[dict]
    ai_insight: AIInsightResponse

    class Config:
        from_attributes = True
