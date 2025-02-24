# backend/models.py
from pydantic import BaseModel
from typing import List
from datetime import datetime, date


class Artist(BaseModel):
    artist_id: str
    name: str

class Album(BaseModel):
    album_id: str
    artist_id: str
    name: str
    cover_art: str
    release_date: datetime

class Track(BaseModel):
    track_id: str
    name: str
    playcount: int
    artist_name: str

class AlbumResponse(BaseModel):
    album_id: str
    album_name: str
    artist_id: str
    artist_name: str
    tracks: List[Track]

class StreamCount(BaseModel):
    track_id: str
    playcount: int
    timestamp: datetime

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