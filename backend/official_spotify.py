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