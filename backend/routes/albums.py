# routes/albums.py
from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime
from routes.dependencies import verify_api_key, get_spotify_services, get_database_service

router = APIRouter()

@router.get("/{album_id}")
async def fetch_album(
    album_id: str,
    _: str = Depends(verify_api_key)
):
    """
    Get album details, all tracks, and their latest stream counts.
    
    If album exists in database, returns data from database.
    If not found, tries to fetch data from unofficial Spotify API.
    If unofficial API fails, falls back to official Spotify API with limited data.
    """
    # Get services
    db_service = get_database_service()
    spotify_services = get_spotify_services()
    unofficial_spotify = spotify_services["unofficial"]
    
    # First try to get from database
    try:
        db_result = await db_service.get_album_with_tracks_and_streams(album_id)
        
        # If found in database with tracks, return it
        if db_result and db_result.get("tracks"):
            return db_result
    except Exception as db_error:
        print(f"Error fetching album from database: {str(db_error)}")
        # Continue to API attempt
    
    # Try unofficial API first
    try:
        # Fetch album data from unofficial Spotify API
        album_data = await unofficial_spotify.get_album_tracks(album_id)
        
        # Process and save the data...
        album_info = {
            "album_id": album_data.album_id,
            "artist_id": album_data.artist_id,
            "album_name": album_data.album_name,
            "artist_name": album_data.artist_name,
            "cover_art": getattr(album_data, "cover_art", ""),
            "release_date": datetime.now()  # Default to current date, can be updated later
        }
        
        # Use the release date from the API if available
        if hasattr(album_data, "release_date") and album_data.release_date:
            try:
                album_info["release_date"] = datetime.strptime(album_data.release_date, "%Y-%m-%d")
            except Exception as e:
                print(f"Error parsing release date: {e}")
        
        # Convert Track objects to dictionaries for processing
        track_objects = []
        stream_data = []
        
        for track in album_data.tracks:
            track_dict = {
                "track_id": track.track_id,
                "name": track.name,
                "artist_id": album_data.artist_id,
                "album_id": album_data.album_id
            }
            track_objects.append(track_dict)
            
            stream_dict = {
                "track_id": track.track_id,
                "play_count": track.playcount,
                "album_id": album_data.album_id
            }
            stream_data.append(stream_dict)
        
        # Save to database
        try:
            await db_service.save_complete_album(album_info, track_objects, stream_data)
            
            # Get from database now that it's saved
            db_result = await db_service.get_album_with_tracks_and_streams(album_id)
            if db_result:
                return db_result
        except Exception as save_error:
            print(f"Error saving album data to database: {str(save_error)}")
            # Continue with returning data from API
        
        # If database save/fetch failed, return API data directly
        tracks_list = [
            {
                "track_id": track.track_id,
                "name": track.name,
                "day": datetime.today(),
                "playcount": track.playcount
            } for track in album_data.tracks
        ]
        
        return {
            "album": {
                "album_id": album_data.album_id,
                "album_name": album_data.album_name,
                "artist_id": album_data.artist_id,
                "artist_name": album_data.artist_name,
                "cover_art": album_info["cover_art"],
                "release_date": album_info["release_date"]
            },
            "tracks": tracks_list,
        }
    
    except Exception as unofficial_error:
        print(f"Error with unofficial API: {str(unofficial_error)}")
        raise HTTPException(status_code=500, detail=str(unofficial_error))
        
