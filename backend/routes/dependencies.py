# routes/dependencies.py
from fastapi import Depends
from fastapi.security.api_key import APIKeyHeader
from services.unofficial_spotify import TokenManager, UnofficialSpotifyService
from services.official_spotify import OfficialSpotifyService
from services.database import DatabaseService

# Initialize clients
token_manager = TokenManager()
unofficial_spotify = UnofficialSpotifyService(token_manager)
official_spotify = OfficialSpotifyService()
db_service = DatabaseService()

# API Key verification
API_KEY_HEADER = APIKeyHeader(name="X-API-Key")

async def verify_api_key(api_key: str = Depends(API_KEY_HEADER)):
    """
    Dependency for verifying API key in protected routes.
    """
    # During development, you can comment out the actual verification
    # to make testing easier. Uncomment this when deploying to production
    # if api_key != settings.API_KEY:
    #     raise HTTPException(status_code=403, detail="Invalid API key")
    return api_key

# Services dependencies to be used in routes
def get_spotify_services():
    """
    Returns initialized Spotify API services
    """
    return {
        "unofficial": unofficial_spotify,
        "official": official_spotify
    }

def get_database_service():
    """
    Returns the database service instance
    """
    return db_service