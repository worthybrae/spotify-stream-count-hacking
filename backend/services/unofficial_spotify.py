# services/unofficial_spotify.py
from typing import Dict, Tuple
import httpx
import json
from urllib.parse import quote
from fastapi import HTTPException
from models import AlbumResponse, Track
import time
import asyncio
import random
from playwright.async_api import async_playwright


class TokenManager:
    """
    Manages authentication tokens for the unofficial Spotify API
    using Playwright to intercept network requests
    """
    def __init__(self):
        self.client_token = None
        self.bearer_token = None
        self.bearer_expiry = 0  # Milliseconds timestamp
        self.token_expiry = 0   # Seconds timestamp
        self.client = httpx.AsyncClient(timeout=30.0)
        self.max_retries = 3
        self.fallback_album_ids = [
            "0HFmXICO7WgVoqLAXc7Rhw",  # Original album
            "4aawyAB9vmqN3uQ7FjRGTy",  # Drake - CLB
            "5CnpZV3q5BcESefcB3WJmz",  # Taylor Swift - Midnights
            "6FJxoadUE4JNVwWHghBwnb",  # Bad Bunny - Un Verano Sin Ti
            "2ITZzNNN4Zm8jVoPJaCF1P"   # The Weeknd - After Hours
        ]
        self.lock = asyncio.Lock()  # For thread safety when refreshing tokens
    
    async def _fetch_tokens_with_playwright(self) -> Tuple[str, str]:
        """
        Fetch both bearer and client tokens using Playwright to intercept network requests
        
        Returns:
            Tuple of (bearer_token, client_token)
        """
        # Storage for our tokens
        tokens = {"bearer": None, "client": None}
        tokens_found = asyncio.Event()
        
        async with async_playwright() as p:
            # Launch the browser in headless mode (set to False for debugging)
            browser = await p.chromium.launch(headless=True)
            
            try:
                context = await browser.new_context()
                page = await context.new_page()
                
                # Set up our request interceptor
                async def capture_tokens(request):
                    # Only look at requests to the Spotify API
                    if "api-partner.spotify.com/pathfinder/v1/query" in request.url:
                        headers = request.headers
                        
                        # Extract tokens from headers
                        if "authorization" in headers and headers["authorization"].startswith("Bearer "):
                            tokens["bearer"] = headers["authorization"].replace("Bearer ", "")
                        
                        if "client-token" in headers:
                            tokens["client"] = headers["client-token"]
                        
                        # If we found both tokens, signal that we're done
                        if tokens["bearer"] and tokens["client"]:
                            tokens_found.set()
                
                # Register the interceptor
                page.on("request", capture_tokens)
                
                # Navigate to Spotify
                await page.goto("https://open.spotify.com/")
                
                # Try different album pages until we find the tokens
                for album_id in self.fallback_album_ids:
                    if tokens["bearer"] and tokens["client"]:
                        break
                        
                    print(f"Trying to fetch tokens using album ID: {album_id}")
                    await page.goto(f"https://open.spotify.com/album/{album_id}")
                    
                    # Wait a bit for API calls to happen
                    try:
                        await asyncio.wait_for(tokens_found.wait(), timeout=5)
                    except asyncio.TimeoutError:
                        continue  # Try next album
                
                # Final timeout if we've tried all albums
                if not tokens["bearer"] or not tokens["client"]:
                    try:
                        await asyncio.wait_for(tokens_found.wait(), timeout=5)
                    except asyncio.TimeoutError:
                        raise HTTPException(
                            status_code=500,
                            detail="Timeout waiting for Spotify tokens"
                        )
                
                if not tokens["bearer"]:
                    raise HTTPException(
                        status_code=500,
                        detail="Failed to obtain bearer token"
                    )
                    
                if not tokens["client"]:
                    raise HTTPException(
                        status_code=500,
                        detail="Failed to obtain client token"
                    )
                
                # Set expiry time (using 1 hour as default)
                current_time = time.time()
                self.bearer_expiry = int(current_time * 1000) + 3600000  # 1 hour in milliseconds
                self.token_expiry = current_time + 3600  # 1 hour in seconds
                
                print("Successfully obtained tokens using Playwright")
                return tokens["bearer"], tokens["client"]
                
            finally:
                await browser.close()

    async def get_tokens(self) -> Tuple[str, str]:
        """
        Get valid client and bearer tokens, refreshing if necessary
        
        Returns:
            Tuple of (client_token, bearer_token)
        """
        # Use a lock to prevent multiple concurrent token refreshes
        async with self.lock:
            current_time = time.time()
            
            # Check if tokens are valid or need refreshing
            client_token_valid = self.client_token and current_time < self.token_expiry - 300  # 5 min buffer
            bearer_token_valid = self.bearer_token and current_time * 1000 < self.bearer_expiry - 300000  # 5 min buffer
            
            # Refresh both tokens if either is invalid or missing
            if not client_token_valid or not bearer_token_valid:
                print(f"Refreshing tokens (current_time={current_time}, token_expiry={self.token_expiry}, bearer_expiry={self.bearer_expiry})")
                self.bearer_token, self.client_token = await self._fetch_tokens_with_playwright()
            
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