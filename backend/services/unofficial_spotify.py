# services/unofficial_spotify.py
"""
UnofficialSpotifyService that interacts with Spotify's unofficial partner API.
This service uses TokenManager to authorize API requests.
"""

import asyncio
import json
import logging
from datetime import datetime
from typing import Dict, List
from urllib.parse import quote

import httpx
from models import StreamResponse

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

        # Define the GraphQL query with all required fields
        query = """
        query getAlbum($uri: String!, $locale: String!, $offset: Int!, $limit: Int!) {
            albumUnion(uri: $uri) {
                ... on Album {
                    name
                    uri
                    artists {
                        items {
                            profile {
                                name
                            }
                        }
                    }
                    coverArt {
                        sources {
                            url
                            width
                            height
                        }
                    }
                    date {
                        isoString
                    }
                    tracksV2(offset: $offset, limit: $limit) {
                        items {
                            track {
                                name
                                uri
                                playcount
                                artists {
                                    items {
                                        profile {
                                            name
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        """

        extensions = {
            "persistedQuery": {
                "version": 1,
                "sha256Hash": "1a33c76ec27fc5cca497d8503c656cdea3641779300d33d5964a9858c87caafe",
            }
        }

        query_params = {
            "operationName": "getAlbum",
            "query": query,
            "variables": json.dumps(variables),
            "extensions": json.dumps(extensions),
        }

        params = "&".join(f"{k}={quote(v)}" for k, v in query_params.items())
        return f"{self.base_url}?{params}"

    async def get_album_tracks(self, album_id: str) -> List[StreamResponse]:
        """
        Get track details for an album including play counts
        with retry mechanism

        Args:
            album_id: Spotify album ID

        Returns:
            List of StreamResponse objects with album and track details including play counts
        """
        url = self._build_album_query(album_id)
        errors = []

        for attempt in range(self.max_retries):
            try:
                headers = await self._get_headers()
                response = await self.client.get(url, headers=headers)
                response.raise_for_status()
                data = response.json()

                # Debug log the response structure
                logger.info("API Response structure:")
                logger.info(f"Data keys: {list(data.keys())}")
                if "data" in data:
                    logger.info(f"Data['data'] keys: {list(data['data'].keys())}")
                    if "albumUnion" in data["data"]:
                        album_data = data["data"]["albumUnion"]
                        logger.info(f"Album data keys: {list(album_data.keys())}")
                        if "artists" in album_data:
                            logger.info(f"Artists structure: {album_data['artists']}")
                        if "tracksV2" in album_data:
                            logger.info(
                                f"First track structure: {album_data['tracksV2']['items'][0] if album_data['tracksV2']['items'] else 'No tracks'}"
                            )

                # Check for expected data structure
                if "data" not in data or "albumUnion" not in data["data"]:
                    raise ValueError("Unexpected API response format")

                album_data = data["data"]["albumUnion"]

                # Check for essential properties
                if "artists" not in album_data:
                    raise ValueError("Artist data missing in API response")

                # Extract artist name - try multiple possible locations
                artist_name = ""
                try:
                    # Try to get from album artists first
                    if "artists" in album_data and "items" in album_data["artists"]:
                        artist_name = album_data["artists"]["items"][0]["profile"][
                            "name"
                        ]
                        logger.info(
                            f"Found artist name from album artists: {artist_name}"
                        )
                    # If not found, try the first track's artist
                    elif "tracksV2" in album_data and "items" in album_data["tracksV2"]:
                        first_track = album_data["tracksV2"]["items"][0]["track"]
                        if (
                            "artists" in first_track
                            and "items" in first_track["artists"]
                        ):
                            artist_name = first_track["artists"]["items"][0]["profile"][
                                "name"
                            ]
                            logger.info(
                                f"Found artist name from first track: {artist_name}"
                            )
                    # If still not found, try the album's name as a fallback
                    if not artist_name and "name" in album_data:
                        artist_name = album_data["name"].split(" - ")[
                            0
                        ]  # Common format: "Artist - Album"
                        logger.info(f"Using album name as artist name: {artist_name}")
                except Exception as e:
                    logger.error(f"Error extracting artist name: {e}")
                    # Don't raise here, we'll try to continue with empty artist name

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
                        # Parse the ISO date string as datetime
                        release_date = (
                            datetime.strptime(release_date_str, "%Y-%m-%dT%H:%M:%SZ")
                            if "T" in release_date_str
                            else datetime.strptime(release_date_str, "%Y-%m-%d")
                        )
                    except Exception as e:
                        logger.error(f"Error parsing release date: {e}")

                # Validate tracks section exists
                if (
                    "tracksV2" not in album_data
                    or "items" not in album_data["tracksV2"]
                ):
                    raise ValueError("Track data missing in API response")

                # Process tracks
                output_data = []
                for item in album_data["tracksV2"]["items"]:
                    try:
                        track_data = item["track"]

                        # Try to get track-specific artist if available
                        track_artist_name = artist_name  # Default to album artist
                        if "artists" in track_data and "items" in track_data["artists"]:
                            track_artist_name = track_data["artists"]["items"][0][
                                "profile"
                            ]["name"]

                        # Create a StreamResponse object
                        stream = StreamResponse(
                            track_id=track_data["uri"].split(":")[-1],
                            track_name=track_data["name"],
                            album_id=album_id,
                            album_name=album_data["name"],
                            artist_name=track_artist_name,
                            stream_count=track_data.get("playcount", 0),
                            timestamp=datetime.now().strftime("%Y-%m-%dT%H:%M:%SZ"),
                            cover_art=cover_art_url,
                            release_date=release_date,
                        )
                        output_data.append(stream)
                    except Exception as e:
                        logger.error(f"Error processing track: {e}")
                        continue

                return output_data

            except Exception as e:
                errors.append(str(e))
                if attempt < self.max_retries - 1:
                    await asyncio.sleep(2**attempt)  # Exponential backoff
                continue

        # If we get here, all retries failed
        error_msg = f"Failed after {self.max_retries} attempts. Errors: {errors}"
        logger.error(error_msg)
        raise Exception(error_msg)
