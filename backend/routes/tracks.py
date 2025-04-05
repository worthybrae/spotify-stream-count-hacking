# routes/tracks.py
from fastapi import APIRouter, HTTPException, Query
import traceback
from routes.dependencies import get_spotify_services, get_database_service
from routes.albums import fetch_album

router = APIRouter()

@router.get("/{user_id}")
async def get_user_top_tracks(
    user_id: str,
    access_token: str,
    force: bool = Query(False, description="Force fetch from Spotify even if tracks exist in database")
):
    """
    Get a user's top 50 tracks. If force=False (default), fetches from database if available.
    Otherwise fetches from Spotify API, saves to database, and ensures albums exist.
    """
    try:
        # Get services
        db_service = get_database_service()
        spotify_services = get_spotify_services()
        official_spotify = spotify_services["official"]
        
        # If not forcing Spotify API, try database first
        if not force:
            # First search in database
            db_results = await db_service.get_user_top_tracks(user_id)
            
            # If we have results, return them
            if db_results and len(db_results) > 0:
                return {"tracks": db_results}
        
        # Fetch top tracks from Spotify
        top_tracks = await official_spotify.get_user_top_tracks(access_token)
        
        # Extract all album IDs from the tracks
        album_ids = set()
        
        for track in top_tracks:
            album_id = track['album']['id']
            album_ids.add(album_id)
        
        # Fetch all required albums one by one
        print(f"Fetching {len(album_ids)} albums for user's top tracks")
        for album_id in album_ids:
            try:
                # Fetch album data (this should create album and track records)
                await fetch_album(album_id)
                print(f"Successfully fetched album {album_id}")
            except Exception as album_error:
                print(f"Error fetching album {album_id}: {str(album_error)}")
                # Continue with other albums even if one fails
        
        # Process the tracks for saving
        processed_tracks = []
        for position, track in enumerate(top_tracks):
            processed_tracks.append({
                'track_id': track['id'],
                'album_id': track['album']['id'],
                'position': position + 1
            })
        
        # Save to database
        try:
            result = await db_service.save_user_top_tracks(user_id, processed_tracks)
            print(f"Successfully saved user top tracks for user {user_id}")
        except Exception as save_error:
            print(f"Error saving user top tracks: {str(save_error)}")
            raise
        
        # Get updated tracks from database to return
        updated_tracks = await db_service.get_user_top_tracks(user_id)
        return {"tracks": updated_tracks}
            
    except Exception as e:
        err_trace = traceback.format_exc()
        print(f"Error fetching top tracks: {err_trace}")
        raise HTTPException(status_code=500, detail=f"Failed to get top tracks: {str(e)}")
    
@router.get("/{user_id}/check-ins")
async def get_user_check_ins(
    user_id: str
):
    """
    Get all distinct dates when a user's top tracks were created in the past 7 days
    
    Args:
        user_id: User ID to get check-in dates for
        
    Returns:
        List of dates when the user's top tracks were recorded in the past 7 days
    """
    try:
        # Get database service
        db_service = get_database_service()
        
        # Get the user's check-in dates (when their top tracks were saved)
        check_in_dates = await db_service.get_user_top_tracks_dates(user_id)
        
        return check_in_dates

    except Exception as e:
        err_trace = traceback.format_exc()
        print(f"Error fetching user check-ins: {err_trace}")
        raise HTTPException(status_code=500, detail=f"Failed to get user check-ins: {str(e)}")