# services/official_spotify.py
from typing import List, Dict
import spotipy
from spotipy.oauth2 import SpotifyClientCredentials, SpotifyOAuth
from config import settings
from models import NewRelease
from datetime import datetime


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
                client_secret=settings.SPOTIFY_CLIENT_SECRET
            )
        )
    
    def get_authorize_url(self) -> str:
        """
        Generate a URL for the user to authorize the application
        
        Args:
            state: Optional state parameter for CSRF protection
            
        Returns:
            Authorization URL to redirect the user to
        """
        # Create a new SpotifyOAuth instance for this request
        sp_oauth = SpotifyOAuth(
            client_id=settings.SPOTIFY_CLIENT_ID,
            client_secret=settings.SPOTIFY_CLIENT_SECRET,
            redirect_uri=settings.SPOTIFY_REDIRECT_URI,
            scope="user-read-email user-top-read user-read-recently-played"
        )
        
        return sp_oauth.get_authorize_url()
    
    def get_access_token(self, code: str) -> Dict:
        """
        Exchange the authorization code for access and refresh tokens
        
        Args:
            code: Authorization code received from Spotify redirect
            
        Returns:
            Dictionary containing access_token, refresh_token, and expires_in
        """
        # Create a new SpotifyOAuth instance for this request
        sp_oauth = SpotifyOAuth(
            client_id=settings.SPOTIFY_CLIENT_ID,
            client_secret=settings.SPOTIFY_CLIENT_SECRET,
            redirect_uri=settings.SPOTIFY_REDIRECT_URI,
            scope="user-read-email user-top-read user-read-recently-played"
        )
        
        # Get token info without caching
        token_info = sp_oauth.get_access_token(code, as_dict=True, check_cache=False)
        
        return {
            "access_token": token_info.get("access_token"),
            "refresh_token": token_info.get("refresh_token"),
            "expires_in": token_info.get("expires_in"),
            "expires_at": token_info.get("expires_at")
        }
        
    def refresh_access_token(self, refresh_token: str) -> Dict:
        """
        Get a new access token using a refresh token
        
        Args:
            refresh_token: Refresh token to use for getting a new access token
            
        Returns:
            Dictionary containing new access_token and expires_in
        """
        # Create a new SpotifyOAuth instance for this request
        sp_oauth = SpotifyOAuth(
            client_id=settings.SPOTIFY_CLIENT_ID,
            client_secret=settings.SPOTIFY_CLIENT_SECRET,
            redirect_uri=settings.SPOTIFY_REDIRECT_URI,
            scope="user-read-email user-top-read user-read-recently-played",
        )
        
        # Refresh the token without caching
        new_token_info = sp_oauth.refresh_access_token(refresh_token)
        
        return {
            "access_token": new_token_info.get("access_token"),
            "expires_in": new_token_info.get("expires_in"),
            "expires_at": new_token_info.get("expires_at")
        }
    
    
    async def search_albums(self, query: str, limit: int = 50) -> List[NewRelease]:
        """
        Search for albums on Spotify by name
        
        Args:
            query: Search query string
            limit: Maximum number of results to return (default: 50)
            
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
    
    async def get_user_top_tracks(self, access_token: str) -> List[Dict]:
        """
        Get a user's top tracks
        
        Args:
            access_token: User's access token
            
        Returns:
            List of user's top tracks
        """
        user_client = spotipy.Spotify(auth=access_token)
        results = user_client.current_user_top_tracks(time_range='short_term', limit=50)
        
        return results.get('items', [])
    