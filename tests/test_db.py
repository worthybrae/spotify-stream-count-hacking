# tests/test_db.py
import pytest
from backend.db import save_album, save_stream_count, get_track_history, get_db
from datetime import datetime

@pytest.mark.asyncio
async def test_save_album(mock_album):
    """Test saving an album to the database"""
    # First create the artist
    async with get_db() as conn:
        await conn.execute("""
            INSERT INTO artists (artist_id, name)
            VALUES ($1, $2)
            ON CONFLICT (artist_id) DO NOTHING
        """, mock_album['artists'][0]['id'], mock_album['artists'][0]['name'])
    
    # Then save the album
    await save_album(
        album_id=mock_album['id'],
        artist_id=mock_album['artists'][0]['id'],
        name=mock_album['name'],
        cover_art=mock_album['images'][0]['url'],
        release_date=datetime.strptime(mock_album['release_date'], '%Y-%m-%d')
    )

@pytest.mark.asyncio
async def test_save_stream_count(mock_track):
    """Test saving a stream count"""
    # First create required records
    async with get_db() as conn:
        # Create artist if needed
        await conn.execute("""
            INSERT INTO artists (artist_id, name)
            VALUES ($1, $2)
            ON CONFLICT (artist_id) DO NOTHING
        """, 'test_artist_id', mock_track['artist_name'])
        
        # Create track if needed
        await conn.execute("""
            INSERT INTO tracks (track_id, name, artist_id)
            VALUES ($1, $2, $3)
            ON CONFLICT (track_id) DO NOTHING
        """, mock_track['track_id'], mock_track['name'], 'test_artist_id')
    
    # Then save stream count
    await save_stream_count(
        track_id=mock_track['track_id'],
        play_count=mock_track['playcount']
    )

@pytest.mark.asyncio
async def test_get_track_history(mock_track):
    """Test retrieving track history"""
    # First save some data
    await save_stream_count(
        track_id=mock_track['track_id'],
        play_count=mock_track['playcount']
    )
    
    # Then retrieve it
    history = await get_track_history(mock_track['track_id'], limit=1)
    assert len(history) > 0
    assert history[0]['track_id'] == mock_track['track_id']

@pytest.fixture(autouse=True)
async def cleanup_db():
    """Cleanup test data after each test"""
    yield  # Run the test
    async with get_db() as conn:
        # Clean up test data
        await conn.execute("DELETE FROM streams WHERE track_id LIKE 'test_%'")
        await conn.execute("DELETE FROM albums WHERE album_id LIKE 'test_%'")
        await conn.execute("DELETE FROM tracks WHERE track_id LIKE 'test_%'")