"""FortiWeb Log Analyzer API - FortiAnalis v3.0"""
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import upload, reports
from app.db import engine, Base

__version__ = "3.1.0"

# Create database tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="FortiWeb Log Analyzer API",
    description="API for analyzing FortiWeb WAF logs with AI-powered insights and multi-format report export",
    version=__version__,
)

ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload.router, prefix="/api/v1/upload", tags=["upload"])
app.include_router(reports.router, prefix="/api/v1/reports", tags=["reports"])

@app.get("/")
async def root():
    return {"message": "Welcome to FortiAnalis - FortiWeb Log Analyzer API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
