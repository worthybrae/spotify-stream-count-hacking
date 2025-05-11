# backend/models.py
from datetime import date
from typing import Optional, Union

from pydantic import BaseModel


class Stream(BaseModel):
    track_id: str
    album_id: str
    album_name: str
    track_name: str
    artist_name: str
    cover_art: str
    release_date: Union[str, date]
    play_count: int
    stream_recorded_at: Union[str, date]


class AlbumRecord(BaseModel):
    album_id: str
    album_name: str
    artist_name: str
    cover_art: str
    release_date: Union[str, date]


class TrackRecord(BaseModel):
    track_id: str
    track_name: str
    album_id: str


class StreamRecord(BaseModel):
    album_id: str
    track_id: str
    play_count: int


# DEPRECATED FOR NOW
class UserProfile(BaseModel):
    """User profile information from Spotify"""

    id: str
    display_name: Optional[str] = None
    email: Optional[str] = None
    images: Optional[list] = None
    country: Optional[str] = None
    product: Optional[str] = None
