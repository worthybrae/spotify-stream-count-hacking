# services/official_spotify.py
from typing import List
import spotipy
from spotipy.oauth2 import SpotifyClientCredentials
from config import settings
from models import NewRelease
from datetime import datetime


class OfficialSpotifyService:
    """
    Service for interacting with the official Spotify API
    using spotipy library
    """
    
    def __init__(self):
        """Initialize the Spotify client with credentials"""
        auth_manager = SpotifyClientCredentials(
            client_id=settings.SPOTIFY_CLIENT_ID,
            client_secret=settings.SPOTIFY_CLIENT_SECRET
        )
        self.client = spotipy.Spotify(auth_manager=auth_manager)
    
    async def search_albums(self, query: str, limit: int = 50) -> List[NewRelease]:
        """
        Search for albums on Spotify by name
        
        Args:
            query: Search query string
            limit: Maximum number of results to return (default: 20)
            
        Returns:
            List of NewRelease objects matching the search query
        """
        # Use spotipy's search method with 'album' type
        result = self.client.search(q=query, type='album', limit=limit)
        
        albums = []
        for item in result['albums']['items']:
            # Parse the release date - handle different formats (YYYY-MM-DD, YYYY-MM, YYYY)
            release_date = item['release_date']
            if len(release_date) == 4:  # Just year
                parsed_date = datetime.strptime(f"{release_date}-01-01", '%Y-%m-%d').date()
            elif len(release_date) == 7:  # Year and month
                parsed_date = datetime.strptime(f"{release_date}-01", '%Y-%m-%d').date()
            else:  # Full date
                parsed_date = datetime.strptime(release_date, '%Y-%m-%d').date()
            
            albums.append(NewRelease(
                album_id=item['id'],
                album_name=item['name'],
                cover_art=item['images'][0]['url'] if item['images'] else '',
                artist_name=item['artists'][0]['name'],
                artist_id=item['artists'][0]['id'],
                release_date=parsed_date
            ))
        
        return albums
        
    async def get_album(self, album_id: str) -> dict:
        """
        Get album details from Spotify
        
        Args:
            album_id: Spotify album ID
            
        Returns:
            Dict with album details
        """
        return self.client.album(album_id)
        
    async def get_track(self, track_id: str) -> dict:
        """
        Get track details from Spotify
        
        Args:
            track_id: Spotify track ID
            
        Returns:
            Dict with track details
        """
        return self.client.track(track_id)