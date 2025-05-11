# routes/users.py
import asyncio
import logging
import traceback
from typing import List, Optional

from fastapi import APIRouter, HTTPException, Query
from routes.albums import fetch_album
from routes.dependencies import get_database_service, get_spotify_services

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("user_routes")

router = APIRouter()

# ALL ENDPOINTS ARE DEPRECATED FOR NOW

async def fetch_albums_in_parallel(album_ids: List[str], batch_size: int = 5):
    """
    Fetch multiple albums in parallel batches

    Args:
        album_ids: List of album IDs to fetch
        batch_size: Number of albums to fetch in parallel

    Returns:
        List of results from fetch operations
    """
    results = []

    # Process in batches
    for i in range(0, len(album_ids), batch_size):
        batch = album_ids[i : i + batch_size]
        logger.info(
            f"Processing batch of {len(batch)} albums (batch {i // batch_size + 1})"
        )

        # Create tasks for this batch
        tasks = [fetch_album(album_id) for album_id in batch]

        # Run tasks in parallel and collect results
        batch_results = await asyncio.gather(*tasks, return_exceptions=True)
        results.extend(batch_results)

        # Add a small delay between batches to avoid rate limiting
        if i + batch_size < len(album_ids):
            logger.info("Pausing briefly between batches")
            await asyncio.sleep(1)

    return results


@router.get("/{user_id}")
async def get_user_profile(
    user_id: str,
    access_token: Optional[str] = Query(None),
    force: bool = Query(False),
    batch_size: int = Query(5, description="Number of albums to fetch in parallel"),
):
    """
    Get a user's top tracks with stream history.

    Args:
        user_id: User ID to get top tracks for
        access_token: Optional Spotify access token to fetch latest data
        force: If True, fetch from Spotify even if data exists in database
        batch_size: Number of albums to fetch in parallel (default: 5)

    Returns:
        User's top tracks with stream history
    """
    try:
        # Get services
        db_service = get_database_service()
        spotify_services = get_spotify_services()
        official_spotify = spotify_services.get("official")

        # Check if we need to fetch new data
        need_to_fetch = force

        if not need_to_fetch and access_token:
            # Check if user has top tracks for today using the new DB service function
            today_tracks = await db_service.get_today_top_tracks(user_id)
            if not today_tracks or today_tracks[0].get("tracks", 0) == 0:
                logger.info(
                    f"No top tracks for today found for user {user_id}, forcing refresh"
                )
                need_to_fetch = True

        # If we don't need to fetch, just return existing profile
        if not need_to_fetch:
            db_results = await db_service.fetch_user_profile(user_id)
            if db_results:
                logger.info(
                    f"Found existing profile for user {user_id} with {len(db_results)} tracks"
                )
                return db_results
            else:
                logger.info(
                    f"No profile found for user {user_id}, will fetch from Spotify"
                )
                need_to_fetch = True

        # If we need to fetch and have an access token
        if need_to_fetch and access_token:
            logger.info(f"Fetching top tracks for user {user_id} from Spotify API")

            # Fetch top tracks from Spotify
            spotify_top_tracks = await official_spotify.get_user_top_tracks(
                access_token
            )
            logger.info(f"Received {len(spotify_top_tracks)} top tracks from Spotify")

            # Extract album IDs from top tracks
            top_track_album_ids = [
                track.get("album", {}).get("id")
                for track in spotify_top_tracks
                if "album" in track and track["album"].get("id")
            ]

            # Get unique album IDs
            unique_album_ids = list(set(filter(None, top_track_album_ids)))
            logger.info(f"Found {len(unique_album_ids)} unique albums in top tracks")

            # Get list of albums that already exist in our database
            existing_albums = []
            try:
                logger.info("Fetching list of all albums from database")
                all_albums = await db_service.get_all_albums(limit=1000)
                existing_albums = [album.get("album_id") for album in all_albums]
                logger.info(f"Found {len(existing_albums)} existing albums in database")
            except Exception as e:
                logger.error(f"Error fetching existing albums: {str(e)}", exc_info=True)
                # Continue even if this fails

            # Determine which albums need to be fetched
            albums_to_fetch = [
                album_id
                for album_id in unique_album_ids
                if album_id not in existing_albums
            ]
            logger.info(
                f"Need to fetch {len(albums_to_fetch)} albums that don't exist in database"
            )

            # Fetch albums in parallel batches
            if albums_to_fetch:
                logger.info(
                    f"Fetching {len(albums_to_fetch)} albums in batches of {batch_size}"
                )
                fetch_results = await fetch_albums_in_parallel(
                    albums_to_fetch, batch_size
                )

                # Log success/failure statistics
                success_count = sum(
                    1 for r in fetch_results if not isinstance(r, Exception)
                )
                logger.info(
                    f"Successfully fetched {success_count} of {len(albums_to_fetch)} albums"
                )

            # Format and save the user's top tracks
            tracks_to_save = []
            for position, track in enumerate(spotify_top_tracks):
                tracks_to_save.append(
                    {
                        "track_id": track["id"],
                        "position": position + 1,
                        "album_id": track.get("album", {}).get("id"),
                    }
                )

            # Save to database
            logger.info(f"Saving {len(tracks_to_save)} top tracks for user {user_id}")
            save_result = await db_service.save_user_top_tracks(user_id, tracks_to_save)
            logger.info(f"Save result: {save_result}")

            # Finally, fetch user profile with all the data we've just saved
            logger.info(f"Fetching complete user profile for {user_id} from database")
            db_results = await db_service.fetch_user_profile(user_id)

            if db_results:
                logger.info(
                    f"Successfully retrieved user profile with {len(db_results)} entries"
                )
                return db_results
            else:
                logger.warning(
                    f"No profile data retrieved for user {user_id} after saving"
                )
                raise HTTPException(
                    status_code=404,
                    detail="Failed to retrieve user profile after saving",
                )

        # If we need to fetch but don't have an access token
        if need_to_fetch and not access_token:
            logger.warning(
                f"Need to fetch profile for user {user_id} but no access token provided"
            )
            raise HTTPException(
                status_code=401,
                detail="Access token required to fetch user profile from Spotify",
            )

    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        err_trace = traceback.format_exc()
        logger.error(f"Error processing user profile: {err_trace}")
        raise HTTPException(
            status_code=500, detail=f"Failed to get user profile: {str(e)}"
        )
