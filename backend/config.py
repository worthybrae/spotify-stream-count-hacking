# backend/config.py
from dotenv import load_dotenv
import os

# Load environment variables from .env file
load_dotenv(override=True)

class Settings:
    def __init__(self):
        self.COCKROACH_DB_USER = os.getenv('COCKROACH_DB_USER')
        self.COCKROACH_DB_PW = os.getenv('COCKROACH_DB_PW')
        self.SPOTIFY_CLIENT_ID = os.getenv('SPOTIFY_CLIENT_ID')
        self.SPOTIFY_CLIENT_SECRET = os.getenv('SPOTIFY_CLIENT_SECRET')
        self.API_KEY = os.getenv('API_KEY')

    @property
    def DATABASE_URL(self) -> str:
        if not all([self.COCKROACH_DB_USER, self.COCKROACH_DB_PW]):
            raise ValueError("Database credentials not found in environment variables")
        return f"postgresql://{self.COCKROACH_DB_USER}:{self.COCKROACH_DB_PW}@spotify-streams-8396.j77.aws-us-east-1.cockroachlabs.cloud:26257/defaultdb?sslmode=verify-full"

settings = Settings()