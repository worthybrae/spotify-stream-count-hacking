# routes/dependencies.py
from services.unofficial_spotify import TokenManager, UnofficialSpotifyService
from services.official_spotify import OfficialSpotifyService
from services.cockroach import DatabaseService
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
    return {
        "unofficial": unofficial_spotify,
        "official": official_spotify
    }

def get_database_service():
    """
    Returns the database service instance
    """
    return db_service