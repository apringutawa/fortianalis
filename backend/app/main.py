import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import upload

app = FastAPI(
    title="FortiWeb Log Analyzer API",
    description="API for processing and analyzing FortiWeb WAF logs",
    version="1.0.0",
)

# Configure CORS - supports multiple origins via comma-separated env var
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload.router, prefix="/api/v1/upload", tags=["upload"])

@app.get("/")
async def root():
    return {"message": "Welcome to FortiWeb Log Analyzer API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
