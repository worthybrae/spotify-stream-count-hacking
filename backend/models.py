# backend/models.py
from pydantic import BaseModel
from typing import List, Optional
from datetime import date


class Track(BaseModel):
    track_id: str
    name: str
    playcount: int
    artist_name: Optional[str] = None  # Made optional for flexibility

class AlbumResponse(BaseModel):
    album_id: str
    album_name: str
    artist_id: str
    artist_name: str
    tracks: List[Track]
    total_streams: Optional[int] = 0
    cover_art: Optional[str] = ""
    release_date: Optional[str] = None

class NewRelease(BaseModel):
    album_id: str
    album_name: str
    cover_art: str
    artist_name: str
    artist_id: str
    release_date: date
