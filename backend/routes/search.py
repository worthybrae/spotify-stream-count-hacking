# routes/search.py
import time
import traceback
from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query
from models import DatabaseAlbum
from pydantic import BaseModel, Field
from routes.dependencies import (
    get_database_service,
    get_spotify_services,
    verify_api_key,
)

router = APIRouter(dependencies=[Depends(verify_api_key)])

# Add a simple in-memory cache for top tracks
_top_tracks_cache = {}
_top_tracks_cache_time = {}
_TOP_TRACKS_CACHE_TTL = 60 * 60 * 24  # 24 hours in seconds


class AlbumSearchResponse(BaseModel):
    album_id: str = Field(..., example="6rqhFgbbKwnb9MLmUQDhG6")
    album_name: str = Field(..., example="1989 (Taylor's Version)")
    artist_name: str = Field(..., example="Taylor Swift")
    release_date: str = Field(..., example="2023-10-27")
    total_tracks: int = Field(..., example=21)
    cover_art: str = Field(
        "", example="https://i.scdn.co/image/ab67616d0000b273bb9d4e0f5c2d24d69a4ebd5e"
    )

    @classmethod
    def from_database_album(
        cls, album: "DatabaseAlbum", total_tracks: int = 0
    ) -> "AlbumSearchResponse":
        """Convert a DatabaseAlbum to AlbumSearchResponse"""
        return cls(
            album_id=album.album_id,
            album_name=album.name,
            artist_name=album.artist_name,
            release_date=album.release_date.strftime("%Y-%m-%d"),
            total_tracks=total_tracks,
            cover_art=getattr(album, "cover_art", ""),
        )


class TopTrackResponse(BaseModel):
    track_id: str = Field(..., example="7eJMfftS33KTjuF7lTsMCx")
    track_name: str = Field(..., example="Cruel Summer")
    album_id: str = Field(..., example="6rqhFgbbKwnb9MLmUQDhG6")
    album_name: str = Field(..., example="1989 (Taylor's Version)")
    artist_name: str = Field(..., example="Taylor Swift")
    cover_art: str = Field(
        ..., example="https://i.scdn.co/image/ab67616d0000b273bb9d4e0f5c2d24d69a4ebd5e"
    )
    stream_count: int = Field(..., example=12345678)
    timestamp: str = Field(..., example="2024-03-21T12:00:00Z")
    release_date: str = Field(..., example="2023-10-27")
    pct_change: float = Field(
        ...,
        example=15.5,
        description="Percentage change in stream count over selected period",
    )
    time_period: str = Field(
        ..., example="7d", description="Time period used for calculation (7d or 30d)"
    )


@router.get(
    "/albums",
    response_model=List[AlbumSearchResponse],
    summary="Search for albums",
    description="""
    Search for albums by name. This endpoint first searches the local database. If no results are found or `force_spotify` is true, it queries the Spotify API for the latest data.

    - `query`: The album name or keyword to search for (min 1 character)
    - `limit`: Maximum number of results to return (default: 10, max: 50)
    - `force_spotify`: If true, always search Spotify API even if results are found in the database

    **Example:**
    ```bash
    curl -H \"X-API-Key: your_api_key\" \"http://localhost:8000/search/albums?query=1989\"
    ```
    """,
)
async def search_albums(
    query: str = Query(
        ..., min_length=1, description="Album name or keyword to search for"
    ),
    limit: int = Query(
        default=10, le=50, description="Maximum number of results to return (max 50)"
    ),
    force_spotify: bool = Query(
        False, description="Force search on Spotify even if results found in database"
    ),
):
    """
    Search albums by name in database. If no results or force_spotify=True, search Spotify API.
    """
    try:
        # Get services
        db_service = get_database_service()
        spotify_services = get_spotify_services()
        official_spotify = spotify_services["official"]

        # If not forcing Spotify, try database first
        if not force_spotify:
            print(f"Searching database for query: {query}")
            # First search in database
            db_results = await db_service.search_albums(query)
            print(
                f"Database search results: {len(db_results) if db_results else 0} results"
            )

            # If we have results, return them
            if db_results and len(db_results) > 0:
                print("Returning database results")
                return [
                    AlbumSearchResponse.from_database_album(album)
                    for album in db_results[:limit]
                ]

        # If we're forcing Spotify search or nothing was found in the database, search Spotify
        print(f"Falling back to Spotify search for query: {query}")
        try:
            spotify_results = await official_spotify.search_albums(query, limit)
            print(
                f"Spotify search results: {len(spotify_results) if spotify_results else 0} results"
            )

            if not spotify_results:
                print("No results found in Spotify either")
                return []

            return [
                AlbumSearchResponse.from_database_album(album)
                for album in spotify_results
            ]

        except Exception as e:
            err_trace = traceback.format_exc()
            print(f"Error searching Spotify API: {err_trace}")
            raise HTTPException(
                status_code=500, detail=f"Failed to search Spotify API: {str(e)}"
            )

    except Exception as e:
        err_trace = traceback.format_exc()
        print(f"Error searching albums: {err_trace}")
        raise HTTPException(
            status_code=500, detail=f"Failed to search albums: {str(e)}"
        )


@router.get(
    "/top-tracks",
    response_model=List[TopTrackResponse],
    summary="Get top tracks",
    description="""
    Get the top tracks by stream count. This endpoint returns the most streamed tracks in the database, including track and album details, artist, and the percentage change over the selected time period.

    - `time_period`: Time period for percentage change calculation ('7d' or '30d', default: '7d')

    **Example:**
    ```bash
    curl -H \"X-API-Key: your_api_key\" \"http://localhost:8000/search/top-tracks?time_period=7d\"
    ```
    """,
)
async def top_tracks(
    time_period: str = Query(
        default="7d",
        regex="^(7d|30d)$",
        description="Time period for percentage change calculation (7d or 30d)",
    ),
    db_service=Depends(get_database_service),
    api_key=Depends(verify_api_key),
):
    """
    Get the top tracks by stream count from the database.
    """
    global _top_tracks_cache, _top_tracks_cache_time
    now = time.time()

    # Check cache for this specific time period
    cache_key = time_period
    if (
        cache_key in _top_tracks_cache
        and cache_key in _top_tracks_cache_time
        and (now - _top_tracks_cache_time[cache_key]) < _TOP_TRACKS_CACHE_TTL
    ):
        return _top_tracks_cache[cache_key]

    try:
        # First search in database
        db_results = await db_service.fetch_top_tracks(time_period)
        # Add release_date to each result
        result = []
        for stream in db_results:
            d = stream.model_dump()
            # Convert release_date to string if it's a datetime
            if isinstance(d.get("release_date"), datetime):
                d["release_date"] = d["release_date"].strftime("%Y-%m-%d")
            # Try to get release_date from stream if present, else empty string
            d["release_date"] = d.get("release_date", "") or ""
            # Ensure pct_change is included and add time_period
            d["pct_change"] = d.get("pct_change") or 0.0
            d["time_period"] = time_period
            result.append(d)

        # Cache the result for this time period
        _top_tracks_cache[cache_key] = result
        _top_tracks_cache_time[cache_key] = now
        return result
    except Exception as e:
        err_trace = traceback.format_exc()
        print(f"Error fetching top tracks: {err_trace}")
        raise HTTPException(
            status_code=500, detail=f"Failed to find top tracks: {str(e)}"
        )
