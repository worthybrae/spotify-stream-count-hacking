# routes/albums.py
# routes/albums.py
import json
import logging
from datetime import datetime

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
            logger.info(f"Found album in database with {len(db_result)} tracks")
            return db_result
        else:
            logger.warning("No album data found in database")
    except Exception as db_error:
        logger.error(
            f"Error fetching album from database: {str(db_error)}", exc_info=True
        )
        # Continue to API attempt

    # Try unofficial API first
    try:
        logger.info("Fetching album data from unofficial Spotify API...")
        # Fetch album data from unofficial Spotify API
        album_data = await unofficial_spotify.get_album_tracks(album_id)

        logger.info(
            f"Successfully retrieved album from Spotify API: {album_data.album_name}"
        )
        logger.info(f"Album has {len(album_data.tracks)} tracks")

        # Log first two tracks for debugging
        if album_data.tracks:
            logger.info(
                f"First track: {album_data.tracks[0].name}, playcount: {album_data.tracks[0].playcount}"
            )
            if len(album_data.tracks) > 1:
                logger.info(
                    f"Second track: {album_data.tracks[1].name}, playcount: {album_data.tracks[1].playcount}"
                )

        # Process and save the data...
        album_info = {
            "album_id": album_data.album_id,
            "artist_id": album_data.artist_id,
            "album_name": album_data.album_name,
            "artist_name": album_data.artist_name,
            "cover_art": getattr(album_data, "cover_art", ""),
            "release_date": datetime.now(),  # Default to current date, can be updated later
        }

        # Use the release date from the API if available
        if hasattr(album_data, "release_date") and album_data.release_date:
            try:
                album_info["release_date"] = datetime.strptime(
                    album_data.release_date, "%Y-%m-%d"
                )
                logger.info(f"Parsed release date: {album_info['release_date']}")
            except Exception as e:
                logger.error(f"Error parsing release date: {e}")

        # Convert Track objects to dictionaries for processing
        track_objects = []
        stream_data = []

        for track in album_data.tracks:
            track_dict = {
                "track_id": track.track_id,
                "name": track.name,
                "artist_id": album_data.artist_id,
                "album_id": album_data.album_id,
            }
            track_objects.append(track_dict)

            stream_dict = {
                "track_id": track.track_id,
                "play_count": track.playcount,
                "album_id": album_data.album_id,
            }
            stream_data.append(stream_dict)

        logger.info(
            f"Prepared {len(track_objects)} tracks and {len(stream_data)} stream entries"
        )

        # Save to database
        try:
            logger.info("Saving album data to database...")
            save_result = await db_service.save_complete_album(
                album_info, track_objects, stream_data
            )
            logger.info(f"Save result: {json.dumps(save_result)}")

            # Get from database now that it's saved
            logger.info("Fetching saved album data from database...")
            db_result = await db_service.fetch_album_data(album_id)

            if db_result:
                logger.info(
                    f"Retrieved {len(db_result)} tracks from database after saving"
                )
                return db_result
            else:
                logger.warning("No data retrieved from database after saving")
        except Exception as save_error:
            logger.error(
                f"Error saving album data to database: {str(save_error)}", exc_info=True
            )
            # Continue with returning data from API

        # If database save/fetch failed, return API data directly
        logger.info("Falling back to returning API data directly...")
        tracks_list = [
            {
                "track_id": track.track_id,
                "name": track.name,
                "day": datetime.today(),
                "playcount": track.playcount,
            }
            for track in album_data.tracks
        ]

        api_response = {
            "album": {
                "album_id": album_data.album_id,
                "album_name": album_data.album_name,
                "artist_id": album_data.artist_id,
                "artist_name": album_data.artist_name,
                "cover_art": album_info["cover_art"],
                "release_date": album_info["release_date"],
            },
            "tracks": tracks_list,
        }

        logger.info(f"Returning API response with {len(tracks_list)} tracks")
        return api_response

    except Exception as unofficial_error:
        logger.error(
            f"Error with unofficial API: {str(unofficial_error)}", exc_info=True
        )
        raise HTTPException(status_code=500, detail=str(unofficial_error))
