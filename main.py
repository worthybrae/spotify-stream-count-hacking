from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Tuple
import httpx
import json
import time
from urllib.parse import quote
import platform
import uuid
import re
from datetime import datetime

app = FastAPI()

class TokenManager:
    def __init__(self):
        self.client_token = None
        self.bearer_token = None
        self.bearer_expiry = 0
        self.token_expiry = 0
        self.token_refresh = 0
        self.client = httpx.AsyncClient()
        
    def _generate_device_id(self) -> str:
        return uuid.uuid4().hex
    
    async def _fetch_bearer_token(self) -> Tuple[str, int]:
        """Fetch Bearer token from album page"""
        url = "https://open.spotify.com/album/0HFmXICO7WgVoqLAXc7Rhw"  # Using a known album ID
        
        headers = {
            "accept": "text/html,application/xhtml+xml",
            "accept-language": "en-US,en;q=0.9",
            "cache-control": "no-cache",
            "pragma": "no-cache",
            "sec-ch-ua": '"Not(A:Brand";v="99", "Google Chrome";v="133", "Chromium";v="133"',
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": '"macOS"',
            "sec-fetch-dest": "document",
            "sec-fetch-mode": "navigate",
            "sec-fetch-site": "none",
            "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36"
        }
        
        try:
            response = await self.client.get(url, headers=headers)
            response.raise_for_status()
            html_content = response.text
            
            # Extract session JSON using regex
            session_match = re.search(r'<script id="session".*?({.*?})</script>', html_content, re.DOTALL)
            if not session_match:
                raise ValueError("Could not find session data in response")
                
            session_data = json.loads(session_match.group(1))
            token = session_data["accessToken"]
            expiry = int(session_data["accessTokenExpirationTimestampMs"])
            
            return token, expiry
            
        except (httpx.HTTPError, json.JSONDecodeError, ValueError) as e:
            raise HTTPException(status_code=500, detail=f"Failed to fetch Bearer token: {str(e)}")

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
            
        except httpx.HTTPError as e:
            raise HTTPException(status_code=500, detail=f"Failed to fetch client token: {str(e)}")

    async def get_tokens(self) -> Tuple[str, str]:
        """Get valid client and bearer tokens, refreshing if necessary"""
        current_time = time.time()
        
        # Refresh client token if needed
        if not self.client_token or current_time >= self.token_refresh:
            await self._fetch_client_token()
            
        # Refresh bearer token if needed
        if not self.bearer_token or current_time * 1000 >= self.bearer_expiry:
            self.bearer_token, self.bearer_expiry = await self._fetch_bearer_token()
        
        return self.client_token, self.bearer_token

class TrackInfo(BaseModel):
    track_id: str
    name: str
    playcount: int
    artist_name: str

class AlbumResponse(BaseModel):
    album_name: str
    tracks: List[TrackInfo]

class SpotifyClient:
    def __init__(self, token_manager: TokenManager):
        self.base_url = "https://api-partner.spotify.com/pathfinder/v1/query"
        self.token_manager = token_manager

    async def _get_headers(self) -> Dict[str, str]:
        """Get headers with current tokens"""
        client_token, bearer_token = await self.token_manager.get_tokens()
        return {
            "accept": "application/json",
            "accept-language": "en",
            "app-platform": "WebPlayer",
            "authorization": f"Bearer {bearer_token}",
            "cache-control": "no-cache",
            "client-token": client_token,
            "content-type": "application/json;charset=UTF-8",
            "origin": "https://open.spotify.com",
            "pragma": "no-cache",
            "priority": "u=1, i",
            "referer": "https://open.spotify.com/",
            "sec-ch-ua": '"Not(A:Brand";v="99", "Google Chrome";v="133", "Chromium";v="133"',
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": '"macOS"',
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-site",
            "spotify-app-version": "896000000",
            "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36"
        }

    def _build_album_query(self, album_id: str) -> str:
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

    async def get_album_tracks(self, album_id: str) -> dict:
        url = self._build_album_query(album_id)
        headers = await self._get_headers()
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(url, headers=headers)
                response.raise_for_status()
                return response.json()
            except httpx.HTTPError as e:
                print(f"Error response: {e.response.text if hasattr(e, 'response') else str(e)}")
                raise HTTPException(status_code=500, detail=f"Spotify API error: {str(e)}")

# Initialize clients
token_manager = TokenManager()
spotify_client = SpotifyClient(token_manager)

@app.get("/album/{album_id}/tracks", response_model=AlbumResponse)
async def get_album_tracks(album_id: str):
    """
    Get track IDs and play counts for a given Spotify album ID.
    
    Args:
        album_id: Spotify album ID (not the full URI)
    
    Returns:
        AlbumResponse containing album name and list of tracks with their play counts
    """
    try:
        data = await spotify_client.get_album_tracks(album_id)
        
        # Extract album name
        album_name = data["data"]["albumUnion"]["name"]
        
        # Extract tracks
        tracks = []
        for item in data["data"]["albumUnion"]["tracksV2"]["items"]:
            track = item["track"]
            tracks.append(TrackInfo(
                track_id=track["uri"].split(":")[-1],
                name=track["name"],
                playcount=int(track["playcount"]),
                artist_name=track["artists"]["items"][0]["profile"]["name"]
            ))
        
        return AlbumResponse(
            album_name=album_name,
            tracks=tracks
        )
    
    except KeyError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Unexpected response structure from Spotify API: {str(e)}"
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)