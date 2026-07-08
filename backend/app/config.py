import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    # MongoDB Config
    MONGO_URI: str = "mongodb://localhost:27017"
    MONGO_DB: str = "medconnect"

    # Security
    JWT_SECRET: str = "medconnect_super_secret_key_change_me_in_production_12345!"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours for easy testing

    # AI
    GEMINI_API_KEY: Optional[str] = os.environ.get("GEMINI_API_KEY", "")

    # Application
    PROJECT_NAME: str = "MedConnect AI"
    API_V1_STR: str = "/api"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
