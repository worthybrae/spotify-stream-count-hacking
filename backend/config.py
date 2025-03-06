# config.py
import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Settings(BaseSettings):
    # CockroachDB specific credentials
    COCKROACH_DB_USER: str = os.getenv('COCKROACH_DB_USER', '')
    COCKROACH_DB_PW: str = os.getenv('COCKROACH_DB_PW', '')
    COCKROACH_DB_HOST: str = os.getenv('COCKROACH_DB_HOST', 
                                       'spotify-streams-8396.j77.aws-us-east-1.cockroachlabs.cloud:26257')
    COCKROACH_DB_NAME: str = os.getenv('COCKROACH_DB_NAME', 'defaultdb')
    
    # Construct DATABASE_URL from individual components
    @property
    def DATABASE_URL(self) -> str:
        # If we have specific CockroachDB credentials, use them
        if self.COCKROACH_DB_USER and self.COCKROACH_DB_PW:
            return f"postgresql://{self.COCKROACH_DB_USER}:{self.COCKROACH_DB_PW}@{self.COCKROACH_DB_HOST}/{self.COCKROACH_DB_NAME}?sslmode=verify-full"
        # Otherwise use a direct DATABASE_URL if provided
        return os.getenv('DATABASE_URL', 'postgresql://username:password@localhost:5432/spotify_db')
    
    # API Key for admin/unlimited access
    API_KEY: str = os.getenv('API_KEY', 'test-admin-key')
    
    # Spotify API Credentials
    SPOTIFY_CLIENT_ID: str = os.getenv('SPOTIFY_CLIENT_ID', '')
    SPOTIFY_CLIENT_SECRET: str = os.getenv('SPOTIFY_CLIENT_SECRET', '')
    
    # Optional debugging
    DEBUG: bool = os.getenv('DEBUG', 'False').lower() == 'true'

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "allow"  # Allow extra fields to avoid validation errors

# Create settings instance
settings = Settings()

# For debugging
if settings.DEBUG:
    print("=== Configuration loaded ===")
    print(f"API_KEY configured: {'Yes' if settings.API_KEY else 'No'}")
    
    # Only show partial database URL for security
    db_url = settings.DATABASE_URL
    masked_url = db_url.replace(settings.COCKROACH_DB_PW, '****') if settings.COCKROACH_DB_PW else db_url
    print(f"DATABASE_URL: {masked_url}")
    
    print(f"COCKROACH_DB credentials: User={settings.COCKROACH_DB_USER}, Host={settings.COCKROACH_DB_HOST}")
    print(f"DEBUG mode: {settings.DEBUG}")
    print("===========================")