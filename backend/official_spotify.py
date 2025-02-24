# backend/official_spotify.py
from typing import List
import spotipy
from spotipy.oauth2 import SpotifyClientCredentials
from backend.config import settings
from backend.models import NewRelease
from datetime import datetime

class SpotifyOfficial:
    def __init__(self):
        auth_manager = SpotifyClientCredentials(
            client_id=settings.SPOTIFY_CLIENT_ID,
            client_secret=settings.SPOTIFY_CLIENT_SECRET
        )
        self.client = spotipy.Spotify(auth_manager=auth_manager)
    
    async def get_new_releases(self, limit: int = 50) -> List[NewRelease]:
        response = self.client.new_releases(limit=limit)
        releases = []
        
        for album in response['albums']['items']:
            # Parse the release date from Spotify's format
            release_date = datetime.strptime(album['release_date'], '%Y-%m-%d').date()
            
            releases.append(NewRelease(
                album_id=album['id'],
                album_name=album['name'],
                cover_art=album['images'][0]['url'] if album['images'] else '',
                artist_name=album['artists'][0]['name'],
                artist_id=album['artists'][0]['id'],
                release_date=release_date
            ))
        
        return releases
    
    async def search_albums(self, query: str, limit: int = 50) -> List[NewRelease]:
        """
        Search for albums on Spotify by name
        
        Args:
            query: Search query string
            limit: Maximum number of results to return (default: 20)
            
        Returns:
            List of album details matching the search query
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