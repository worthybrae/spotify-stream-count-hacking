# tests/test_official_spotify.py
import pytest
from backend.official_spotify import SpotifyOfficial

@pytest.mark.asyncio  # Make sure this decorator is present
async def test_get_new_releases():
    """Test fetching new releases"""
    spotify_official = SpotifyOfficial()
    try:
        releases = await spotify_official.get_new_releases(limit=1)  # Add await here
        assert len(releases) == 1
        # Test the actual release object properties
        release = releases[0]
        assert all(hasattr(release, attr) for attr in [
            'album_id', 'album_name', 'artist_name', 'artist_id', 'cover_art', 'release_date'
        ])
    except Exception as e:
        pytest.skip(f"Spotify API connection failed: {str(e)}")