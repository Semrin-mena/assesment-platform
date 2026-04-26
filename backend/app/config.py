import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
    DATABASE_PATH = os.getenv("DATABASE_PATH", "instance/database.db")
    CORS_ORIGINS = ["http://localhost:3000"]
    JWT_SECRET = os.getenv("JWT_SECRET", "change-me-in-production")
