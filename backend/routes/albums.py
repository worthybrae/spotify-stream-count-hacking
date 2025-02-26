# routes/albums.py
from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Dict, Any
import traceback
from datetime import datetime

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
    If not found, fetches data from Spotify API and saves it.
    """
    try:
        # Get services
        db_service = get_database_service()
        spotify_services = get_spotify_services()
        unofficial_spotify = spotify_services["unofficial"]
        
        # First try to get from database
        db_result = await db_service.get_album_with_tracks_and_streams(album_id)
        
        # If found in database, return it
        if db_result and db_result.get("tracks"):
            return db_result
        
        # Otherwise, fetch from Spotify API
        try:
            # Fetch album data from Spotify 
            album_data = await unofficial_spotify.get_album_tracks(album_id)
            
            # Prepare data for saving to database
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
                    # Keep the default current date
            
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
            await db_service.save_complete_album(album_info, track_objects, stream_data)
            
            # Get from database now that it's saved
            db_result = await db_service.get_album_with_tracks_and_streams(album_id)
            if db_result:
                return db_result
            
            # If still not found, return API data
            tracks_list = [
                {
                    "track_id": track.track_id,
                    "name": track.name,
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
                "total_streams": sum(track.playcount for track in album_data.tracks)
            }
        
        except Exception as e:
            # Get full traceback to help with debugging
            err_trace = traceback.format_exc()
            print(f"Error fetching data from Spotify API: {err_trace}")
            raise HTTPException(status_code=500, detail=f"Failed to fetch album from Spotify API: {str(e)}")
    
    except Exception as e:
        # Get full traceback to help with debugging
        error_details = traceback.format_exc()
        print(f"Error fetching album data: {error_details}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch album data: {str(e)}")

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