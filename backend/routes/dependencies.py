# routes/dependencies.py
from config import settings
from fastapi import Header, HTTPException, status
from services.cockroach import DatabaseService
from services.official_spotify import OfficialSpotifyService
from services.unofficial_spotify import TokenManager, UnofficialSpotifyService

# Initialize clients
token_manager = TokenManager()
unofficial_spotify = UnofficialSpotifyService(token_manager)
official_spotify = OfficialSpotifyService()
db_service = DatabaseService()


# Services dependencies to be used in routes
def get_spotify_services():
    """
    Returns initialized Spotify API services
    """
    return {"unofficial": unofficial_spotify, "official": official_spotify}


def get_database_service():
    """
    Returns the database service instance
    """
    return db_service


def verify_api_key(x_api_key: str = Header(..., alias="X-API-Key")):
    if not settings.API_KEY or x_api_key != settings.API_KEY:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing API key",
        )
