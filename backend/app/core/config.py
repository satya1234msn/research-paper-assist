import os
from pydantic_settings import BaseSettings
from pydantic import model_validator
from typing import List

def is_running_serverless() -> bool:
    if os.getenv("VERCEL") or os.getenv("AWS_LAMBDA_FUNCTION_NAME") or os.getenv("VERCEL_ENV"):
        return True
    try:
        test_file = "./.write_test_tmp"
        with open(test_file, "w") as f:
            f.write("test")
        os.remove(test_file)
        return False
    except Exception:
        return True

base_dir = "/tmp" if is_running_serverless() else "."

class Settings(BaseSettings):
    PROJECT_NAME: str = "ResearchAssist AI"
    API_V1_STR: str = "/api/v1"
    
    # Security
    JWT_SECRET: str = os.getenv("JWT_SECRET", "research-assist-secure-jwt-secret-key-for-development-2026")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Database
    MONGODB_URL: str = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    MONGODB_DB_NAME: str = os.getenv("MONGODB_DB_NAME", "research_assist_db")
    
    # File Storage
    STORAGE_DIR: str = os.path.join(base_dir, "data", "storage")
    CHROMADB_DIR: str = os.path.join(base_dir, "data", "chromadb")
    DB_DIR: str = os.path.join(base_dir, "data", "db")
    
    # LLM Settings
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    LLM_PROVIDER: str = os.getenv("LLM_PROVIDER", "auto") # auto, groq, openai, local
    LLM_MODEL: str = os.getenv("LLM_MODEL", "llama-3.3-70b-versatile")
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ]

    class Config:
        case_sensitive = True
        env_file = ".env"
        extra = "ignore"

    @model_validator(mode='after')
    def enforce_safe_storage_directories(self):
        if is_running_serverless():
            self.STORAGE_DIR = "/tmp/data/storage"
            self.CHROMADB_DIR = "/tmp/data/chromadb"
            self.DB_DIR = "/tmp/data/db"
        return self

settings = Settings()

# Ensure data directories exist
try:
    os.makedirs(settings.STORAGE_DIR, exist_ok=True)
    os.makedirs(settings.CHROMADB_DIR, exist_ok=True)
    os.makedirs(os.path.join(settings.STORAGE_DIR, "papers"), exist_ok=True)
    os.makedirs(os.path.join(settings.STORAGE_DIR, "exports"), exist_ok=True)
    os.makedirs(settings.DB_DIR, exist_ok=True)
except Exception as e:
    print(f"Directory creation note: {e}")

