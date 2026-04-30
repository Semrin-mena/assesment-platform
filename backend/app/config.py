import os

from dotenv import load_dotenv

load_dotenv()


PLACEHOLDER_JWT_SECRET = "change-me-in-production"


def _split_csv(value):
    return [v.strip() for v in value.split(",") if v.strip()]


class Config:
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
    DATABASE_URL = os.getenv("DATABASE_URL", "")
    CORS_ORIGINS = _split_csv(os.getenv("CORS_ORIGINS", "http://localhost:3000"))
    JWT_SECRET = os.getenv("JWT_SECRET", PLACEHOLDER_JWT_SECRET)
    FLASK_ENV = os.getenv("FLASK_ENV", "development").lower()
    LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()
    DB_POOL_MIN = int(os.getenv("DB_POOL_MIN", "1"))
    DB_POOL_MAX = int(os.getenv("DB_POOL_MAX", "10"))

    @classmethod
    def is_production(cls):
        return cls.FLASK_ENV == "production"

    @classmethod
    def validate(cls):
        """Fail fast on missing/insecure config in production."""
        problems = []
        if not cls.DATABASE_URL:
            problems.append("DATABASE_URL must be set (e.g. postgresql://user:pass@host:5432/dbname)")
        if cls.is_production():
            if not cls.JWT_SECRET or cls.JWT_SECRET == PLACEHOLDER_JWT_SECRET or len(cls.JWT_SECRET) < 32:
                problems.append("JWT_SECRET must be set to a random string of at least 32 chars in production")
            if not cls.OPENAI_API_KEY:
                problems.append("OPENAI_API_KEY must be set in production")
            if cls.CORS_ORIGINS == ["http://localhost:3000"]:
                problems.append("CORS_ORIGINS must be set to your production frontend URL")
        if problems:
            raise RuntimeError("Invalid configuration:\n  - " + "\n  - ".join(problems))
