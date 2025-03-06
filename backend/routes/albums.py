# routes/albums.py
from fastapi import APIRouter, HTTPException, Depends, Query
import traceback
from datetime import datetime, date

from models import AlbumSaveRequest
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
    official_spotify = spotify_services["official"]
    
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
        # Fall back to official API
    
    # Try using official Spotify API as last resort (won't have play counts)
    try:
        print(f"Falling back to official Spotify API for album {album_id}")
        official_album = await official_spotify.get_album(album_id)
        
        # Create a response with the data we have (no play counts)
        album_info = {
            "album_id": official_album["id"],
            "album_name": official_album["name"],
            "artist_id": official_album["artists"][0]["id"],
            "artist_name": official_album["artists"][0]["name"],
            "cover_art": official_album["images"][0]["url"] if official_album.get("images") else "",
            "release_date": datetime.strptime(official_album["release_date"], "%Y-%m-%d") 
                if len(official_album.get("release_date", "")) == 10 
                else datetime.now()
        }
        
        # Get tracks from the official API
        tracks_list = []
        for item in official_album["tracks"]["items"]:
            track_dict = {
                "track_id": item["id"],
                "name": item["name"],
                "playcount": 0  # We don't have play counts from official API
            }
            tracks_list.append(track_dict)
        
        # Don't try to save to database since we don't have complete data
        
        return {
            "album": album_info,
            "tracks": tracks_list,
            "total_streams": 0,
            "note": "Data fetched from official Spotify API. Stream counts unavailable."
        }
    
    except Exception as official_error:
        # Both APIs failed
        detailed_error = f"Failed to fetch album data from both unofficial and official APIs.\n" \
                         f"Unofficial API error: {str(unofficial_error)}\n" \
                         f"Official API error: {str(official_error)}"
        raise HTTPException(status_code=500, detail=detailed_error)

@router.post("/", status_code=201)
async def add_album(
    data: AlbumSaveRequest,
    _: str = Depends(verify_api_key)
):
    """
    Add or update album info, tracks, and streams in the database.
    """
    try:
        # Get services
        db_service = get_database_service()
        
        album_data = {
            "album_id": data.album.album_id,
            "artist_id": data.album.artist_id,
            "album_name": data.album.album_name,
            "artist_name": data.album.artist_name,
            "cover_art": data.album.cover_art,
            "release_date": data.album.release_date
        }
        
        # Convert tracks to the correct format
        track_objects = []
        for track in data.tracks:
            track_dict = {
                "track_id": track.track_id,
                "name": track.name,
                "artist_id": data.album.artist_id,
                "album_id": data.album.album_id
            }
            track_objects.append(track_dict)
        
        # Convert stream history to the format expected by save_complete_album
        stream_data = [
            {
                "track_id": stream.track_id,
                "play_count": stream.playcount,
                "album_id": data.album.album_id
            } for stream in data.streamHistory
        ]
        
        result = await db_service.save_complete_album(album_data, track_objects, stream_data)
        
        return {
            "status": "success",
            "message": "Album data saved successfully",
            "album_id": result["album_id"],
            "artist_id": result["artist_id"],
            "tracks_count": result["tracks_count"],
            "streams_count": result["streams_count"]
        }
    
    except Exception as e:
        err_trace = traceback.format_exc()
        print(f"Error adding album: {err_trace}")
        raise HTTPException(status_code=500, detail=f"Failed to save album data: {str(e)}")

@router.get("/")
async def get_all_albums(
    limit: int = Query(default=50, le=100),
    offset: int = Query(default=0),
    _: str = Depends(verify_api_key)
):
    """
    Get all albums in the database, with pagination.
    """
    try:
        # Get services
        db_service = get_database_service()
        
        # Get all albums
        albums = await db_service.get_all_albums(limit, offset)
        return albums
    
    except Exception as e:
        err_trace = traceback.format_exc()
        print(f"Error fetching all albums: {err_trace}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch albums: {str(e)}")
    
