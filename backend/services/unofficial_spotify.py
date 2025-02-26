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
import random
import asyncio


class TokenManager:
    """
    Manages authentication tokens for the unofficial Spotify API
    with improved error handling and retry mechanism
    """
    def __init__(self):
        self.client_token = None
        self.bearer_token = None
        self.bearer_expiry = 0
        self.token_expiry = 0
        self.token_refresh = 0
        self.client = httpx.AsyncClient(timeout=30.0)  # Increased timeout
        self.max_retries = 3
        self.fallback_album_ids = [
            "0HFmXICO7WgVoqLAXc7Rhw",  # Original album
            "4aawyAB9vmqN3uQ7FjRGTy",  # Drake - CLB
            "5CnpZV3q5BcESefcB3WJmz",  # Taylor Swift - Midnights
            "6FJxoadUE4JNVwWHghBwnb",  # Bad Bunny - Un Verano Sin Ti
            "2ITZzNNN4Zm8jVoPJaCF1P"   # The Weeknd - After Hours
        ]
        
    def _generate_device_id(self) -> str:
        """Generate a random device ID"""
        return uuid.uuid4().hex
    
    async def _fetch_bearer_token(self) -> Tuple[str, int]:
        """
        Fetch Bearer token from album page with retry mechanism
        
        Returns:
            Tuple of (token, expiry_timestamp)
        """
        errors = []
        
        # Try with different album IDs in case one is not available
        for album_id in self.fallback_album_ids:
            url = f"https://open.spotify.com/album/{album_id}"
            
            headers = {
                "accept": "text/html,application/xhtml+xml",
                "accept-language": "en-US,en;q=0.9",
                "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
            }
            
            # Try multiple times with exponential backoff
            for attempt in range(self.max_retries):
                try:
                    response = await self.client.get(url, headers=headers)
                    response.raise_for_status()
                    
                    # Try regular session script pattern
                    session_match = re.search(r'<script id="session".*?({.*?})</script>', 
                                          response.text, re.DOTALL)
                    
                    # If not found, try alternative patterns
                    if not session_match:
                        # Alternative pattern 1
                        session_match = re.search(r'<script>window\.initialData\s*=\s*({.*?})</script>', 
                                               response.text, re.DOTALL)
                        
                        # Alternative pattern 2
                        if not session_match:
                            session_match = re.search(r'Spotify\.Entity\s*=\s*({.*?});', 
                                                   response.text, re.DOTALL)
                    
                    if not session_match:
                        raise ValueError("Could not find session data in page")
                        
                    session_data = json.loads(session_match.group(1))
                    
                    # Extract token - handle different response structures
                    access_token = None
                    expiry = None
                    
                    # Standard format
                    if "accessToken" in session_data and "accessTokenExpirationTimestampMs" in session_data:
                        access_token = session_data["accessToken"]
                        expiry = int(session_data["accessTokenExpirationTimestampMs"])
                    # Alternative format
                    elif "token" in session_data and "expires" in session_data:
                        access_token = session_data["token"]
                        expiry = int(session_data["expires"])
                    # Another alternative
                    elif "access" in session_data and "token" in session_data.get("access", {}):
                        access_token = session_data["access"]["token"]
                        expiry = int(session_data["access"].get("expiry", time.time() * 1000 + 3600000))
                        
                    if not access_token:
                        raise ValueError("Could not extract access token from session data")
                        
                    print(f"Successfully obtained bearer token using album ID: {album_id}")
                    return (access_token, expiry)
                    
                except Exception as e:
                    # Add error to list
                    errors.append(f"Attempt {attempt+1} with album {album_id}: {str(e)}")
                    
                    # Exponential backoff with jitter before retrying
                    if attempt < self.max_retries - 1:
                        backoff_time = (2 ** attempt) + random.uniform(0, 1)
                        print(f"Bearer token fetch failed. Retrying in {backoff_time:.2f} seconds...")
                        await asyncio.sleep(backoff_time)
        
        # If we get here, all retries with all albums failed
        detailed_errors = "\n".join(errors)
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to fetch Bearer token after multiple attempts:\n{detailed_errors}"
        )

    async def _fetch_client_token(self) -> None:
        """Fetch client token from Spotify with retry mechanism"""
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

        errors = []
        for attempt in range(self.max_retries):
            try:
                response = await self.client.post(url, json=payload, headers=headers)
                response.raise_for_status()
                data = response.json()
                
                self.client_token = data["granted_token"]["token"]
                current_time = time.time()
                self.token_expiry = current_time + data["granted_token"]["expires_after_seconds"]
                self.token_refresh = current_time + data["granted_token"]["refresh_after_seconds"]
                
                print("Successfully obtained client token")
                return
                
            except Exception as e:
                errors.append(f"Attempt {attempt+1}: {str(e)}")
                
                # Exponential backoff with jitter before retrying
                if attempt < self.max_retries - 1:
                    backoff_time = (2 ** attempt) + random.uniform(0, 1)
                    print(f"Client token fetch failed. Retrying in {backoff_time:.2f} seconds...")
                    await asyncio.sleep(backoff_time)
        
        # If we get here, all retries failed
        detailed_errors = "\n".join(errors)
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to fetch client token after multiple attempts:\n{detailed_errors}"
        )

    async def get_tokens(self) -> Tuple[str, str]:
        """
        Get valid client and bearer tokens, refreshing if necessary
        
        Returns:
            Tuple of (client_token, bearer_token)
        """
        current_time = time.time()
        
        # Refresh client token if needed
        client_token_valid = self.client_token and current_time < self.token_refresh
        if not client_token_valid:
            await self._fetch_client_token()
            
        # Refresh bearer token if needed  
        bearer_token_valid = self.bearer_token and current_time * 1000 < self.bearer_expiry
        if not bearer_token_valid:
            # Preemptively refresh if within 5 minutes of expiry
            near_expiry = self.bearer_token and current_time * 1000 + 300000 >= self.bearer_expiry
            if not self.bearer_token or near_expiry:
                self.bearer_token, self.bearer_expiry = await self._fetch_bearer_token()
        
        return self.client_token, self.bearer_token


class UnofficialSpotifyService:
    """
    Service for interacting with Spotify's unofficial partner API
    to get additional data not available in the official API
    with improved error handling and retry mechanism
    """
    def __init__(self, token_manager: TokenManager):
        self.base_url = "https://api-partner.spotify.com/pathfinder/v1/query"
        self.token_manager = token_manager
        self.client = httpx.AsyncClient(timeout=30.0)  # Increased timeout
        self.max_retries = 3

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
        with retry mechanism
        
        Args:
            album_id: Spotify album ID
            
        Returns:
            AlbumResponse object with album and track details including play counts
        """
        url = self._build_album_query(album_id)
        errors = []
        
        for attempt in range(self.max_retries):
            try:
                headers = await self._get_headers()
                response = await self.client.get(url, headers=headers)
                response.raise_for_status()
                data = response.json()
                
                # Check for expected data structure
                if "data" not in data or "albumUnion" not in data["data"]:
                    raise ValueError("Unexpected API response format")
                
                album_data = data["data"]["albumUnion"]
                
                # Check for essential properties
                if "artists" not in album_data or "items" not in album_data["artists"]:
                    raise ValueError("Artist data missing in API response")
                    
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
                
                # Validate tracks section exists
                if "tracksV2" not in album_data or "items" not in album_data["tracksV2"]:
                    raise ValueError("Track data missing in API response")
                
                # Process tracks
                tracks = []
                for item in album_data["tracksV2"]["items"]:
                    try:
                        track_data = item["track"]
                        artist_name = track_data["artists"]["items"][0]["profile"]["name"] if "artists" in track_data else ""
                        
                        track = Track(
                            track_id=track_data["uri"].split(":")[-1],
                            name=track_data["name"],
                            playcount=int(track_data.get("playcount", 0)),
                            artist_name=artist_name
                        )
                        tracks.append(track)
                    except Exception as track_error:
                        print(f"Error processing track: {track_error}")
                        # Continue with other tracks
                
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
                # Add the error to our list
                errors.append(f"Attempt {attempt+1}: {str(e)}")
                
                # If we have another retry, use exponential backoff with jitter
                if attempt < self.max_retries - 1:
                    backoff_time = (2 ** attempt) + random.uniform(0, 1)
                    print(f"Album data fetch failed. Retrying in {backoff_time:.2f} seconds...")
                    await asyncio.sleep(backoff_time)
        
        # If all retries failed, raise a comprehensive exception
        detailed_errors = "\n".join(errors)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch album tracks after {self.max_retries} attempts: {detailed_errors}"
        )