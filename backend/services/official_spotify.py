# services/official_spotify.py
import logging
from datetime import datetime
from typing import Dict, List

import spotipy
from config import settings
from models import DatabaseAlbum
from spotipy.oauth2 import SpotifyClientCredentials

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("spotify_api")


class OfficialSpotifyService:
    """
    Service for interacting with the official Spotify API
    using spotipy library with enhanced authentication capabilities
    """

    def __init__(self):
        """Initialize the Spotify client with credentials"""
        # Client for API operations that don't require user authorization
        self.client = spotipy.Spotify(
            auth_manager=SpotifyClientCredentials(
                client_id=settings.SPOTIFY_CLIENT_ID,
                client_secret=settings.SPOTIFY_CLIENT_SECRET,
            )
        )

    async def search_albums(self, query: str, limit: int = 50) -> List[DatabaseAlbum]:
        """
        Search for albums on Spotify by name

        Args:
            query: Search query string
            limit: Maximum number of results to return (default: 50)

        Returns:
            List of NewRelease objects matching the search query
        """
        # Use spotipy's search method with 'album' type
        result = self.client.search(q=query, type="album", limit=limit)

        albums = []
        for item in result["albums"]["items"]:
            # Parse the release date - handle different formats (YYYY-MM-DD, YYYY-MM, YYYY)
            release_date = item["release_date"]
            if len(release_date) == 4:  # Just year
                parsed_date = datetime.strptime(
                    f"{release_date}-01-01", "%Y-%m-%d"
                ).date()
            elif len(release_date) == 7:  # Year and month
                parsed_date = datetime.strptime(f"{release_date}-01", "%Y-%m-%d").date()
            else:  # Full date
                parsed_date = datetime.strptime(release_date, "%Y-%m-%d").date()

            albums.append(
                DatabaseAlbum(
                    album_id=item["id"],
                    name=item["name"],
                    artist_name=item["artists"][0]["name"],
                    cover_art=item["images"][0]["url"] if item["images"] else "",
                    release_date=parsed_date,
                )
            )

        return albums

    # DEPRECATED FOR NOW
    async def get_user_top_tracks(self, access_token: str) -> List[Dict]:
        """
        Get a user's top tracks

        Args:
            access_token: User's access token

        Returns:
            List of user's top tracks
        """
        user_client = spotipy.Spotify(auth=access_token)
        results = user_client.current_user_top_tracks(time_range="short_term", limit=50)

        return results.get("items", [])

    async def get_album(self, album_id: str) -> dict:
        """
        Get album details from Spotify by album ID.
        """
        album = self.client.album(album_id)
        return album
