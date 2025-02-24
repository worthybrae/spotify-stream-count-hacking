# tests/test_spotify_partner.py
import pytest
from urllib.parse import unquote
from backend.unofficial_spotify import SpotifyPartner

@pytest.mark.asyncio
async def test_get_headers(spotify_partner):
    """Test header generation"""
    headers = await spotify_partner._get_headers()
    assert "authorization" in headers
    assert "client-token" in headers
    assert headers["app-platform"] == "WebPlayer"

@pytest.mark.asyncio
async def test_build_album_query(spotify_partner):
    """Test album query construction"""
    album_id = "test_album_id"
    query_url = spotify_partner._build_album_query(album_id)
    decoded_url = unquote(query_url)
    assert "spotify:album:test_album_id" in decoded_url
    assert "operationName=getAlbum" in decoded_url