# backend/main.py
from fastapi import FastAPI, HTTPException, Depends, Query
from fastapi.security.api_key import APIKeyHeader
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
from backend.unofficial_spotify import SpotifyPartner, TokenManager
from backend.official_spotify import SpotifyOfficial
from backend.models import AlbumResponse, Track, StreamCount
from backend.config import settings
from backend.db import get_track_history, get_db
from typing import List
from models import NewRelease

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
    if api_key != settings.API_KEY:
        raise HTTPException(status_code=403, detail="Invalid API key")
    return api_key

# Endpoints
@app.get("/album/{album_id}/tracks", response_model=AlbumResponse)
async def get_album_tracks(
    album_id: str,
    _: str = Depends(verify_api_key)
):
    """Get track details and play counts for a Spotify album"""
    try:
        return await spotify_partner.get_album_tracks(album_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/track/{track_id}", response_model=Track)
async def get_track_info(
    track_id: str,
    _: str = Depends(verify_api_key)
):
    """Get current track information including play count"""
    try:
        return await spotify_partner.get_track_info(track_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/track/{track_id}/history", response_model=List[StreamCount])
async def get_track_stream_history(
    track_id: str,
    limit: Optional[int] = Query(default=30, le=100),
    _: str = Depends(verify_api_key)
):
    """Get historical stream counts for a track"""
    try:
        return await get_track_history(track_id, limit)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/new-releases", response_model=List[NewRelease])
async def get_new_releases(
    limit: Optional[int] = Query(default=20, le=50),
    _: str = Depends(verify_api_key)
):
    """Get new album releases from Spotify with simplified response"""
    try:
        return await spotify_official.get_new_releases(limit)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@app.get("/search/albums")
async def search_albums(
    query: str = Query(..., min_length=1),
    limit: int = Query(default=10, le=50),
    _: str = Depends(verify_api_key)
):
    """Search albums by name"""
    async with get_db() as conn:
        results = await conn.fetch("""
            SELECT a.album_id, a.name as album_name, 
                   ar.name as artist_name, a.cover_art, a.release_date
            FROM albums a
            JOIN artists ar ON a.artist_id = ar.artist_id
            WHERE a.name ILIKE $1
            LIMIT $2
        """, f"%{query}%", limit)
        
        return [dict(r) for r in results]

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)