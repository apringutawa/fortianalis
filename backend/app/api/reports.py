"""Report history & management API Router."""
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import Report
from app.schemas import ReportSummary, ReportDetail, AIInsightResponse

router = APIRouter()


@router.get("/", response_model=list[ReportSummary])
async def list_reports(
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    search: str = Query(default=""),
    db: Session = Depends(get_db),
):
    query = db.query(Report).order_by(Report.created_at.desc())
    if search:
        query = query.filter(Report.filename.ilike(f"%{search}%"))
    reports = query.offset(offset).limit(limit).all()
    return reports


@router.get("/{report_id}", response_model=ReportDetail)
async def get_report(report_id: str, db: Session = Depends(get_db)):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found.")
    return ReportDetail(
        id=report.id,
        filename=report.filename,
        created_at=report.created_at,
        total_requests=report.total_requests,
        total_attacks=report.total_attacks,
        blocked_attacks=report.blocked_attacks,
        unique_ips=report.unique_ips,
        block_rate=report.block_rate,
        is_demo=bool(report.is_demo),
        attack_types=report.attack_types or [],
        attacker_ips=report.attacker_ips or [],
        subdomains=report.subdomains or [],
        timeline_data=report.timeline_data or [],
        ai_insight=AIInsightResponse(
            analysis=report.ai_analysis or "",
            recommendation=report.ai_recommendation or "",
            powered_by=report.ai_powered_by or "",
        ),
    )


@router.delete("/{report_id}")
async def delete_report(report_id: str, db: Session = Depends(get_db)):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found.")
    db.delete(report)
    db.commit()
    return {"message": "Report deleted successfully"}


@router.get("/stats/summary")
async def report_stats(db: Session = Depends(get_db)):
    total = db.query(Report).count()
    if total == 0:
        return {"total_reports": 0, "total_requests": 0, "total_attacks": 0}
    from sqlalchemy import func
    result = db.query(
        func.sum(Report.total_requests),
        func.sum(Report.total_attacks),
        func.sum(Report.blocked_attacks),
        func.avg(Report.block_rate),
    ).first()
    return {
        "total_reports": total,
        "total_requests": result[0] or 0,
        "total_attacks": result[1] or 0,
        "total_blocked": result[2] or 0,
        "avg_block_rate": round(result[3] or 0, 1),
    }
