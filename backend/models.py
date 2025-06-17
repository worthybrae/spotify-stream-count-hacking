# backend/models.py
from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class DatabaseStream(BaseModel):
    """Model for stream data as stored in the database"""

    track_id: str
    album_id: str
    play_count: int
    timestamp: datetime


class DatabaseTrack(BaseModel):
    """Model for track data as stored in the database"""

    track_id: str
    track_name: str
    album_id: str


class DatabaseAlbum(BaseModel):
    """Model for album data as stored in the database"""

    album_id: str
    name: str
    artist_name: str
    cover_art: str
    release_date: datetime


class StreamResponse(BaseModel):
    """Model for stream data in API responses"""

    track_id: str
    track_name: str
    album_id: str
    album_name: str
    artist_name: str
    stream_count: int
    timestamp: str
    cover_art: str
    release_date: datetime

    @classmethod
    def from_database(
        cls, stream: DatabaseStream, track: DatabaseTrack, album: DatabaseAlbum
    ) -> "StreamResponse":
        """Create a StreamResponse from database models"""
        return cls(
            track_id=stream.track_id,
            track_name=track.track_name,
            album_id=album.album_id,
            album_name=album.name,
            artist_name=album.artist_name,
            stream_count=stream.play_count,
            timestamp=stream.timestamp.strftime("%Y-%m-%dT%H:%M:%SZ"),
            cover_art=album.cover_art,
            release_date=album.release_date,
        )


# DEPRECATED FOR NOW
class UserProfile(BaseModel):
    """User profile information from Spotify"""

    id: str
    display_name: Optional[str] = None
    email: Optional[str] = None
    images: Optional[list] = None
    country: Optional[str] = None
    product: Optional[str] = None
