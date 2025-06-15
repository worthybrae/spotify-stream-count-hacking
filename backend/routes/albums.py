# routes/albums.py
import logging
from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from routes.dependencies import (
    get_database_service,
    get_spotify_services,
    verify_api_key,
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("album_routes")

router = APIRouter(dependencies=[Depends(verify_api_key)])


class StreamResponse(BaseModel):
    track_id: str
    track_name: str
    album_id: str
    album_name: str
    artist_name: str
    stream_count: int
    timestamp: str
    cover_art: str | None = None

    class Config:
        json_schema_extra = {
            "example": {
                "track_id": "6rqhFgbbKwnb9MLmUQDhG6",
                "track_name": "Welcome To New York",
                "album_id": "6rqhFgbbKwnb9MLmUQDhG6",
                "album_name": "1989 (Taylor's Version)",
                "artist_name": "Taylor Swift",
                "stream_count": 1234567,
                "timestamp": "2024-03-21T12:00:00Z",
                "cover_art": "https://i.scdn.co/image/ab67616d0000b273bb9d4e0f5c2d24d69a4ebd5e",
            }
        }


@router.get(
    "/{album_id}",
    response_model=List[StreamResponse],
    summary="Get album streaming data",
)
async def fetch_album(
    album_id: str,
    spotify_services=Depends(get_spotify_services),
    db_service=Depends(get_database_service),
):
    """Fetch album details and tracks from database, then unofficial, then official Spotify API."""
    try:
        # 1. Try to get album data from the database
        db_result = await db_service.fetch_album_data(album_id)
        if db_result:
            return db_result

        # 2. Try to get album data from the unofficial Spotify API
        try:
            streams = await spotify_services["unofficial"].get_album_tracks(album_id)
            # Try to extract cover art from the first stream or from album data
            cover_art_url = None
            if streams and hasattr(streams[0], "cover_art") and streams[0].cover_art:
                cover_art_url = streams[0].cover_art
            else:
                # Try to get cover art from the official API as a fallback
                album_details = await spotify_services["official"].get_album(album_id)
                if album_details and album_details["images"]:
                    cover_art_url = album_details["images"][0]["url"]
            # Set cover_art for all streams
            if cover_art_url:
                for stream in streams:
                    stream.cover_art = cover_art_url
            if streams:
                await db_service.save_complete_album(streams)
                return streams
        except Exception as unofficial_error:
            logger.warning(f"Unofficial Spotify API failed: {unofficial_error}")

        # 3. Fallback to official Spotify API (metadata only, no stream counts)
        album_details = await spotify_services["official"].get_album(album_id)
        if not album_details:
            raise HTTPException(status_code=404, detail="Album not found")

        streams = []
        for track in album_details["tracks"]["items"]:
            streams.append(
                StreamResponse(
                    track_id=track["id"],
                    track_name=track["name"],
                    album_id=album_details["id"],
                    album_name=album_details["name"],
                    artist_name=album_details["artists"][0]["name"],
                    stream_count=0,
                    timestamp=datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
                    cover_art=album_details["images"][0]["url"]
                    if album_details["images"]
                    else None,
                )
            )
        await db_service.save_complete_album(streams)
        return streams

    except Exception as e:
        logger.error(f"Error fetching album {album_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
