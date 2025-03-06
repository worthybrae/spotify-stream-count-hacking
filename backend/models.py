# backend/models.py
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, date


class Album(BaseModel):
    album_id: str
    artist_id: str
    name: str
    cover_art: str
    release_date: datetime
    artist_name: str

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

class StreamCount(BaseModel):
    track_id: str
    playcount: int
    timestamp: Optional[datetime] = None

class NewRelease(BaseModel):
    album_id: str
    album_name: str
    cover_art: str
    artist_name: str
    artist_id: str
    release_date: date

class TrackCreate(BaseModel):
    track_id: str
    name: str
    album_id: str
    artist_id: str
    playcount: int

class StreamHistoryCreate(BaseModel):
    streamHistory: List[StreamCount]

class AlbumSaveRequest(BaseModel):
    album: NewRelease
    streamHistory: List[StreamCount]
    tracks: List[Track]

class AlbumWithTracksResponse(BaseModel):
    album: dict
    tracks: List[dict]
    total_streams: int

class StreamsAddRequest(BaseModel):
    album_id: str
    streams: List[StreamCount]

class ApiKey(BaseModel):
    api_key: str
    ip_address: str
    created_at: Optional[datetime] = None
    is_active: bool = True

class RequestLog(BaseModel):
    ip_address: str
    api_key: Optional[str] = None
    endpoint: Optional[str] = None