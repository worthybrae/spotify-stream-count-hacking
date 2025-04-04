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

class AuthorizationRequest(BaseModel):
    """Request model for getting authorization URL"""
    state: Optional[str] = None


class TokenRequest(BaseModel):
    """Request model for token exchange"""
    code: str


class RefreshTokenRequest(BaseModel):
    """Request model for refreshing access token"""
    refresh_token: str


class TokenResponse(BaseModel):
    """Response model for token operations"""
    access_token: str
    refresh_token: Optional[str] = None
    expires_in: int
    expires_at: Optional[int] = None
    token_type: str = "Bearer"


class UserProfile(BaseModel):
    """User profile information from Spotify"""
    id: str
    display_name: Optional[str] = None
    email: Optional[str] = None
    images: Optional[list] = None
    country: Optional[str] = None
    product: Optional[str] = None