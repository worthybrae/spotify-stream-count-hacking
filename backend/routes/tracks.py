# routes/tracks.py
from fastapi import APIRouter, HTTPException, Depends, Query
import traceback
from routes.dependencies import verify_api_key, get_spotify_services, get_database_service
from routes.albums import fetch_album

router = APIRouter()

@router.get("/{user_id}")
async def get_user_top_tracks(
    user_id: str,
    force: bool = Query(False, description="Force fetch from Spotify even if tracks exist in database"),
    _: str = Depends(verify_api_key)
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
            db_results = await db_service.get_user_top_tracks(user_id, limit=50)
            
            # If we have results, return them
            if db_results and len(db_results) > 0:
                return {"tracks": db_results}
        
        # Get the user's token from database
        token_info = await db_service.get_user_token(user_id)
        
        if not token_info:
            raise HTTPException(status_code=404, detail="No Spotify token found for this user")
        
        # Check if token needs refresh (token service would handle this)
        access_token = token_info.get('access_token')
        
        # Fetch top tracks from Spotify
        top_tracks = await official_spotify.get_user_top_tracks(access_token)
        
        # Process the tracks for saving
        processed_tracks = []
        for position, track in enumerate(top_tracks):
            processed_tracks.append({
                'track_id': track['id'],
                'album_id': track['album']['id'],
                'position': position + 1
            })
        
        # Save to database and get albums that need to be fetched
        result = await db_service.save_user_top_tracks(user_id, processed_tracks)
        
        # Fetch any missing albums
        for album_id in result["albums_to_fetch"]:
            try:
                await fetch_album(album_id, _)
            except Exception as album_error:
                print(f"Error fetching album {album_id}: {str(album_error)}")
                # Continue with other albums
        
        # Get updated tracks from database to return
        updated_tracks = await db_service.get_user_top_tracks(user_id, limit=50)
        return {"tracks": updated_tracks}
            
    except Exception as e:
        err_trace = traceback.format_exc()
        print(f"Error fetching top tracks: {err_trace}")
        raise HTTPException(status_code=500, detail=f"Failed to get top tracks: {str(e)}")