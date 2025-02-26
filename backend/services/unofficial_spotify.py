# services/unofficial_spotify.py
from typing import Dict, Tuple
import httpx
import json
from urllib.parse import quote
from fastapi import HTTPException
from models import AlbumResponse, Track
import time
import platform
import uuid
import re


class TokenManager:
    """
    Manages authentication tokens for the unofficial Spotify API
    """
    def __init__(self):
        self.client_token = None
        self.bearer_token = None
        self.bearer_expiry = 0
        self.token_expiry = 0
        self.token_refresh = 0
        self.client = httpx.AsyncClient()
        
    def _generate_device_id(self) -> str:
        """Generate a random device ID"""
        return uuid.uuid4().hex
    
    async def _fetch_bearer_token(self) -> Tuple[str, int]:
        """
        Fetch Bearer token from album page
        
        Returns:
            Tuple of (token, expiry_timestamp)
        """
        url = "https://open.spotify.com/album/0HFmXICO7WgVoqLAXc7Rhw"
        
        headers = {
            "accept": "text/html,application/xhtml+xml",
            "accept-language": "en-US,en;q=0.9",
            "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
        }
        
        try:
            response = await self.client.get(url, headers=headers)
            response.raise_for_status()
            
            session_match = re.search(r'<script id="session".*?({.*?})</script>', 
                                    response.text, re.DOTALL)
            if not session_match:
                raise ValueError("Could not find session data")
                
            session_data = json.loads(session_match.group(1))
            return (
                session_data["accessToken"],
                int(session_data["accessTokenExpirationTimestampMs"])
            )
            
        except Exception as e:
            raise HTTPException(
                status_code=500, 
                detail=f"Failed to fetch Bearer token: {str(e)}"
            )

    async def _fetch_client_token(self) -> None:
        """Fetch client token from Spotify"""
        url = "https://clienttoken.spotify.com/v1/clienttoken"
        
        payload = {
            "client_data": {
                "client_version": "1.2.59.53.gb992eb8d",
                "client_id": "d8a5ed958d274c2e8ee717e6a4b0971d",
                "js_sdk_data": {
                    "device_brand": "Apple",
                    "device_model": "unknown",
                    "os": platform.system().lower(),
                    "os_version": platform.release(),
                    "device_id": self._generate_device_id(),
                    "device_type": "computer"
                }
            }
        }
        
        headers = {
            "accept": "application/json",
            "content-type": "application/json",
            "origin": "https://open.spotify.com",
            "referer": "https://open.spotify.com/"
        }

        try:
            response = await self.client.post(url, json=payload, headers=headers)
            response.raise_for_status()
            data = response.json()
            
            self.client_token = data["granted_token"]["token"]
            current_time = time.time()
            self.token_expiry = current_time + data["granted_token"]["expires_after_seconds"]
            self.token_refresh = current_time + data["granted_token"]["refresh_after_seconds"]
            
        except Exception as e:
            raise HTTPException(
                status_code=500, 
                detail=f"Failed to fetch client token: {str(e)}"
            )

    async def get_tokens(self) -> Tuple[str, str]:
        """
        Get valid client and bearer tokens, refreshing if necessary
        
        Returns:
            Tuple of (client_token, bearer_token)
        """
        current_time = time.time()
        
        if not self.client_token or current_time >= self.token_refresh:
            await self._fetch_client_token()
            
        if not self.bearer_token or current_time * 1000 >= self.bearer_expiry:
            self.bearer_token, self.bearer_expiry = await self._fetch_bearer_token()
        
        return self.client_token, self.bearer_token


class UnofficialSpotifyService:
    """
    Service for interacting with Spotify's unofficial partner API
    to get additional data not available in the official API
    """
    def __init__(self, token_manager: TokenManager):
        self.base_url = "https://api-partner.spotify.com/pathfinder/v1/query"
        self.token_manager = token_manager
        self.client = httpx.AsyncClient()

    async def _get_headers(self) -> Dict[str, str]:
        """Get headers with current tokens"""
        client_token, bearer_token = await self.token_manager.get_tokens()
        return {
            "accept": "application/json",
            "authorization": f"Bearer {bearer_token}",
            "client-token": client_token,
            "app-platform": "WebPlayer",
            "spotify-app-version": "1.2.59.53.gb992eb8d"
        }

    def _build_album_query(self, album_id: str) -> str:
        """Build GraphQL query URL for album data"""
        variables = {
            "uri": f"spotify:album:{album_id}",
            "locale": "",
            "offset": 0,
            "limit": 50
        }
        
        extensions = {
            "persistedQuery": {
                "version": 1,
                "sha256Hash": "1a33c76ec27fc5cca497d8503c656cdea3641779300d33d5964a9858c87caafe"
            }
        }

        query_params = {
            "operationName": "getAlbum",
            "variables": json.dumps(variables),
            "extensions": json.dumps(extensions)
        }

        params = "&".join(f"{k}={quote(v)}" for k, v in query_params.items())
        return f"{self.base_url}?{params}"

    async def get_album_tracks(self, album_id: str) -> AlbumResponse:
        """
        Get track details for an album including play counts
        
        Args:
            album_id: Spotify album ID
            
        Returns:
            AlbumResponse object with album and track details including play counts
        """
        url = self._build_album_query(album_id)
        headers = await self._get_headers()
        
        try:
            response = await self.client.get(url, headers=headers)
            response.raise_for_status()
            data = response.json()
            
            album_data = data["data"]["albumUnion"]
            artist_data = album_data["artists"]["items"][0]
            
            # Extract cover art URL - get the largest image available
            cover_art_url = ""
            if "coverArt" in album_data and "sources" in album_data["coverArt"]:
                sources = album_data["coverArt"]["sources"]
                if sources:
                    # Find the source with the largest dimensions
                    largest_source = max(sources, key=lambda x: x.get("width", 0) * x.get("height", 0))
                    cover_art_url = largest_source.get("url", "")
            
            # Extract release date if available
            release_date = None
            if "date" in album_data and "isoString" in album_data["date"]:
                try:
                    release_date_str = album_data["date"]["isoString"]
                    # Parse the ISO date string
                    release_date = time.strptime(release_date_str.split("T")[0], "%Y-%m-%d")
                    release_date = time.strftime("%Y-%m-%d", release_date)
                except Exception as e:
                    print(f"Error parsing release date: {e}")
            
            tracks = [
                Track(
                    track_id=item["track"]["uri"].split(":")[-1],
                    name=item["track"]["name"],
                    playcount=int(item["track"]["playcount"]),
                    artist_name=item["track"]["artists"]["items"][0]["profile"]["name"]
                )
                for item in album_data["tracksV2"]["items"]
            ]
            
            album_response = AlbumResponse(
                album_id=album_data["uri"].split(":")[-1],
                album_name=album_data["name"],
                artist_id=artist_data["id"],
                artist_name=artist_data["profile"]["name"],
                tracks=tracks
            )
            
            # Add cover art and release date to the response object
            album_response.cover_art = cover_art_url
            album_response.release_date = release_date
            
            # Store the raw response data for potential additional extraction
            album_response._raw_data = data
            
            return album_response
            
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to fetch album tracks: {str(e)}"
            )

    async def get_track_info(self, track_id: str) -> Dict:
        """
        Get individual track information including play count
        
        Args:
            track_id: Spotify track ID
            
        Returns:
            Dict with track details including play count
        """
        variables = {
            "uri": f"spotify:track:{track_id}",
            "locale": "",
        }
        
        extensions = {
            "persistedQuery": {
                "version": 1,
                "sha256Hash": "6c41f39bac32b7b03665680dd1f18774821c33ca113c52a33bc2d7c66f2ae720"
            }
        }

        query_params = {
            "operationName": "getTrack",
            "variables": json.dumps(variables),
            "extensions": json.dumps(extensions)
        }

        params = "&".join(f"{k}={quote(v)}" for k, v in query_params.items())
        url = f"{self.base_url}?{params}"
        
        headers = await self._get_headers()
        
        try:
            response = await self.client.get(url, headers=headers)
            response.raise_for_status()
            data = response.json()
            
            track_data = data["data"]["trackUnion"]
            return {
                "track_id": track_id,
                "name": track_data["name"],
                "playcount": int(track_data["playcount"]),
                "artist_name": track_data["artists"]["items"][0]["profile"]["name"]
            }
            
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to fetch track info: {str(e)}"
            )