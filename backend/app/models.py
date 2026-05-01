"""SQLAlchemy models for report persistence."""
import json
from datetime import datetime

from sqlalchemy import Column, Integer, String, Float, DateTime, Text, JSON
from app.db import Base


class Report(Base):
    __tablename__ = "reports"

    id = Column(String, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    # Stats
    total_requests = Column(Integer, default=0)
    total_attacks = Column(Integer, default=0)
    blocked_attacks = Column(Integer, default=0)
    unique_ips = Column(Integer, default=0)
    block_rate = Column(Float, default=0.0)

    # JSONB-like fields for complex data
    attack_types = Column(JSON, default=list)
    attacker_ips = Column(JSON, default=list)
    subdomains = Column(JSON, default=list)
    timeline_data = Column(JSON, default=list)

    # AI insight
    ai_analysis = Column(Text, default="")
    ai_recommendation = Column(Text, default="")
    ai_powered_by = Column(String, default="")

    is_demo = Column(Integer, default=0)
