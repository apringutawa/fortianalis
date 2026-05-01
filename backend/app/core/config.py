import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "FortiWeb Log Analyzer API"

    # AI Provider — set to "gemini" or "openai" or "none"
    AI_PROVIDER: str = os.getenv("AI_PROVIDER", "gemini")

    # Google Gemini API
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")

    # OpenAI API (optional fallback)
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")

    # Upload limits
    MAX_FILE_SIZE_MB: int = 50

    # CORS
    ALLOWED_ORIGINS: str = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000")

    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()
