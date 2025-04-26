# services/unofficial_spotify.py
"""
UnofficialSpotifyService that interacts with Spotify's unofficial partner API.
This service uses TokenManager to authorize API requests.
"""

import asyncio
import json
import logging
import random
import time
from typing import Dict
from urllib.parse import quote

import httpx
from fastapi import HTTPException
from models import AlbumResponse, Track

# Import the separated TokenManager
from services.token_manager import TokenManager

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("spotify_api")


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
            "spotify-app-version": "1.2.59.53.gb992eb8d",
        }

    def _build_album_query(self, album_id: str) -> str:
        """Build GraphQL query URL for album data"""
        variables = {
            "uri": f"spotify:album:{album_id}",
            "locale": "",
            "offset": 0,
            "limit": 50,
        }

        extensions = {
            "persistedQuery": {
                "version": 1,
                "sha256Hash": "1a33c76ec27fc5cca497d8503c656cdea3641779300d33d5964a9858c87caafe",
            }
        }

        query_params = {
            "operationName": "getAlbum",
            "variables": json.dumps(variables),
            "extensions": json.dumps(extensions),
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
                        largest_source = max(
                            sources,
                            key=lambda x: x.get("width", 0) * x.get("height", 0),
                        )
                        cover_art_url = largest_source.get("url", "")

                # Extract release date if available
                release_date = None
                if "date" in album_data and "isoString" in album_data["date"]:
                    try:
                        release_date_str = album_data["date"]["isoString"]
                        # Parse the ISO date string
                        release_date = time.strptime(
                            release_date_str.split("T")[0], "%Y-%m-%d"
                        )
                        release_date = time.strftime("%Y-%m-%d", release_date)
                    except Exception as e:
                        logger.error(f"Error parsing release date: {e}")

                # Validate tracks section exists
                if (
                    "tracksV2" not in album_data
                    or "items" not in album_data["tracksV2"]
                ):
                    raise ValueError("Track data missing in API response")

                # Process tracks
                tracks = []
                for item in album_data["tracksV2"]["items"]:
                    try:
                        track_data = item["track"]
                        artist_name = (
                            track_data["artists"]["items"][0]["profile"]["name"]
                            if "artists" in track_data
                            else ""
                        )

                        track = Track(
                            track_id=track_data["uri"].split(":")[-1],
                            name=track_data["name"],
                            playcount=int(track_data.get("playcount", 0)),
                            artist_name=artist_name,
                        )
                        tracks.append(track)
                    except Exception as track_error:
                        logger.error(f"Error processing track: {track_error}")
                        # Continue with other tracks

                album_response = AlbumResponse(
                    album_id=album_data["uri"].split(":")[-1],
                    album_name=album_data["name"],
                    artist_id=artist_data["id"],
                    artist_name=artist_data["profile"]["name"],
                    tracks=tracks,
                )

                # Add cover art and release date to the response object
                album_response.cover_art = cover_art_url
                album_response.release_date = release_date

                return album_response

            except Exception as e:
                # Add the error to our list
                errors.append(f"Attempt {attempt + 1}: {str(e)}")

                # If we have another retry, use exponential backoff with jitter
                if attempt < self.max_retries - 1:
                    backoff_time = (2**attempt) + random.uniform(0, 1)
                    logger.info(
                        f"Album data fetch failed. Retrying in {backoff_time:.2f} seconds..."
                    )
                    await asyncio.sleep(backoff_time)

        # If all retries failed, raise a comprehensive exception
        detailed_errors = "\n".join(errors)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch album tracks after {self.max_retries} attempts: {detailed_errors}",
        )
