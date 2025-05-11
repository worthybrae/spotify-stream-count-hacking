# routes/albums.py
import json
import logging

from fastapi import APIRouter, HTTPException
from routes.dependencies import get_database_service, get_spotify_services

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("album_routes")

router = APIRouter()


@router.get("/{album_id}")
async def fetch_album(album_id: str):
    """
    Get album details, all tracks, and their latest stream counts.

    If album exists in database, returns data from database.
    If not found, tries to fetch data from unofficial Spotify API.
    If unofficial API fails, falls back to official Spotify API with limited data.
    """
    logger.info(f"Fetching album with ID: {album_id}")

    # Get services
    db_service = get_database_service()
    spotify_services = get_spotify_services()
    unofficial_spotify = spotify_services["unofficial"]

    # First try to get from database
    try:
        logger.info("Attempting to fetch album from database...")
        db_result = await db_service.fetch_album_data(album_id)

        # If found in database with tracks, return it
        if db_result:
            logger.info(f"Found album in database with {len(db_result)} stream records")
            return [stream.model_dump() for stream in db_result]
        else:
            logger.warning("No album data found in database")
    except Exception as db_error:
        logger.error(
            f"Error fetching album from database: {str(db_error)}", exc_info=True
        )
        # Continue to API attempt

    # If not in DB try unofficial API
    try:
        logger.info("Fetching album data from unofficial Spotify API...")
        # Fetch album data from unofficial Spotify API - this now returns Stream objects
        streams = await unofficial_spotify.get_album_tracks(album_id)

        if not streams or len(streams) == 0:
            raise ValueError("No tracks found for this album")

        logger.info(
            f"Successfully retrieved album from Spotify API: {streams[0].album_name}"
        )
        logger.info(f"Album has {len(streams)} tracks")

        logger.info("Saving album data to database...")
        save_result = await db_service.save_complete_album(streams)
        logger.info(f"Save result: {json.dumps(save_result)}")

        return [stream.model_dump() for stream in streams]

    except Exception as unofficial_error:
        logger.error(
            f"Error with unofficial API: {str(unofficial_error)}", exc_info=True
        )
        raise HTTPException(status_code=500, detail=str(unofficial_error))
