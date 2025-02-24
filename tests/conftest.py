# tests/conftest.py
import pytest
import asyncio
from backend.unofficial_token_manager import TokenManager
from backend.unofficial_spotify import SpotifyPartner
from backend.official_spotify import SpotifyOfficial
from tests.mock_spotify_data import SAMPLE_ALBUM, SAMPLE_TRACK

@pytest.fixture
def event_loop():
    """Create an instance of the default event loop for each test case."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture
def token_manager():
    """Provide a token manager instance"""
    return TokenManager()

@pytest.fixture
def spotify_partner(token_manager):
    """Provide a SpotifyPartner instance"""
    return SpotifyPartner(token_manager)

@pytest.fixture
def spotify_official():
    """Provide SpotifyOfficial instance"""
    return SpotifyOfficial()

@pytest.fixture
def mock_album():
    """Provide sample album data"""
    return SAMPLE_ALBUM

@pytest.fixture
def mock_track():
    """Provide sample track data"""
    return SAMPLE_TRACK