# backend/main.py
from fastapi import FastAPI, HTTPException, Depends, Query
from fastapi.security.api_key import APIKeyHeader
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional, Dict, Any
from unofficial_spotify import SpotifyPartner, TokenManager
from official_spotify import SpotifyOfficial
from models import (
    AlbumResponse, Track, StreamCount, NewRelease, 
    AlbumSaveRequest, AlbumWithTracksResponse, StreamsAddRequest
)
from config import settings
from db import (
    get_db, search_albums_by_name, get_album_with_tracks_and_streams,
    save_complete_album, batch_save_stream_counts
)
import traceback
from datetime import datetime

app = FastAPI(title="Spotify Analytics API")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "*"],  # Update this with your frontend URL in production
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Initialize clients
token_manager = TokenManager()
spotify_partner = SpotifyPartner(token_manager)
spotify_official = SpotifyOfficial()

# API Key verification
API_KEY_HEADER = APIKeyHeader(name="X-API-Key")

async def verify_api_key(api_key: str = Depends(API_KEY_HEADER)):
    # During development, you can comment out the actual verification
    # to make testing easier. Uncomment this when deploying to production
    # if api_key != settings.API_KEY:
    #     raise HTTPException(status_code=403, detail="Invalid API key")
    return api_key

# Endpoints

# 1. Fetch Album Endpoint
@app.get("/album/{album_id}")
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
        # First try to get from database
        db_result = await get_album_with_tracks_and_streams(album_id)
        
        # If found in database, return it
        if db_result and db_result.get("tracks"):
            return db_result
        
        # Otherwise, fetch from Spotify API
        try:
            # Fetch album data from Spotify 
            album_data = await spotify_partner.get_album_tracks(album_id)
            
            # Prepare data for saving to database
            album_info = {
                "album_id": album_data.album_id,
                "artist_id": album_data.artist_id,
                "album_name": album_data.album_name,
                "artist_name": album_data.artist_name,
                "cover_art": getattr(album_data, "cover_art", ""),  # Use the extracted cover art
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
            await save_complete_album(album_info, track_objects, stream_data)
            
            # Get from database now that it's saved
            db_result = await get_album_with_tracks_and_streams(album_id)
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
                    "cover_art": album_info["cover_art"],  # Use the extracted cover
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

# 2. Search Albums Endpoint
@app.get("/search/albums")
async def search_albums(
    query: str = Query(..., min_length=1),
    limit: int = Query(default=10, le=50),
    _: str = Depends(verify_api_key)
):
    """
    Search albums by name in database. If no results, search Spotify API.
    """
    try:
        # First search in database
        db_results = await search_albums_by_name(query, limit)
        
        # If we have results, return them
        if db_results and len(db_results) > 0:
            return db_results
        
        # Otherwise, search in Spotify
        try:
            spotify_results = await spotify_official.search_albums(query, limit)
            
            # Convert to same format as db results
            return [
                {
                    "album_id": album.album_id,
                    "album_name": album.album_name,
                    "artist_name": album.artist_name,
                    "artist_id": album.artist_id,
                    "cover_art": album.cover_art,
                    "release_date": album.release_date
                } for album in spotify_results
            ]
        except Exception as e:
            err_trace = traceback.format_exc()
            print(f"Error searching Spotify API: {err_trace}")
            raise HTTPException(status_code=500, detail=f"Failed to search Spotify API: {str(e)}")
    
    except Exception as e:
        err_trace = traceback.format_exc()
        print(f"Error searching albums: {err_trace}")
        raise HTTPException(status_code=500, detail=f"Failed to search albums: {str(e)}")

# 3. Add Album Endpoint
@app.post("/album", status_code=201)
async def add_album(
    data: AlbumSaveRequest,
    _: str = Depends(verify_api_key)
):
    """
    Add or update album info, tracks, and streams in the database.
    """
    try:
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
        
        result = await save_complete_album(album_data, track_objects, stream_data)
        
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

# 4. Add Streams Endpoint
@app.post("/streams", status_code=201)
async def add_streams(
    data: StreamsAddRequest,
    _: str = Depends(verify_api_key)
):
    """
    Add new stream counts for tracks in an album.
    """
    try:
        async with get_db() as conn:
            # Prepare streams data
            stream_data = [
                {
                    "track_id": stream.track_id,
                    "play_count": stream.playcount,
                    "album_id": data.album_id
                } for stream in data.streams
            ]
            
            # Save streams
            count = await batch_save_stream_counts(conn, stream_data)
            
            return {
                "status": "success",
                "message": f"Added {count} stream records for album {data.album_id}",
                "count": count
            }
    
    except Exception as e:
        err_trace = traceback.format_exc()
        print(f"Error adding streams: {err_trace}")
        raise HTTPException(status_code=500, detail=f"Failed to add streams: {str(e)}")

# 5. Get All Albums (Additional Helpful Endpoint)
@app.get("/albums")
async def get_all_albums(
    limit: int = Query(default=50, le=100),
    offset: int = Query(default=0),
    _: str = Depends(verify_api_key)
):
    """
    Get all albums in the database, with pagination.
    """
    try:
        async with get_db() as conn:
            results = await conn.fetch("""
                SELECT 
                    album_id, 
                    name as album_name, 
                    artist_id,
                    artist_name,
                    cover_art, 
                    release_date
                FROM albums
                ORDER BY release_date DESC
                LIMIT $1 OFFSET $2
            """, limit, offset)
            
            return [dict(r) for r in results]
    
    except Exception as e:
        err_trace = traceback.format_exc()
        print(f"Error fetching all albums: {err_trace}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch albums: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)