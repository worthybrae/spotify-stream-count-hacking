# tests/test_scripts_local.py
import asyncio
from datetime import datetime
from backend.db import save_album, save_stream_count
from tests.mock_spotify_data import SAMPLE_ALBUM, SAMPLE_TRACK

async def test_save_new_release():
    """Test saving a new release without real Spotify API"""
    try:
        await save_album(
            album_id=SAMPLE_ALBUM['id'],
            artist_id=SAMPLE_ALBUM['artists'][0]['id'],
            name=SAMPLE_ALBUM['name'],
            cover_art=SAMPLE_ALBUM['images'][0]['url'],
            release_date=datetime.strptime(SAMPLE_ALBUM['release_date'], '%Y-%m-%d')
        )
        print("✅ Successfully saved test album to database")
    except Exception as e:
        print(f"❌ Failed to save test album: {str(e)}")

async def test_save_stream_count():
    """Test saving stream count without real Spotify API"""
    try:
        await save_stream_count(
            track_id=SAMPLE_TRACK['track_id'],
            play_count=SAMPLE_TRACK['playcount']
        )
        print("✅ Successfully saved test stream count to database")
    except Exception as e:
        print(f"❌ Failed to save test stream count: {str(e)}")

if __name__ == "__main__":
    print("Running local tests with mock data...")
    asyncio.run(test_save_new_release())
    asyncio.run(test_save_stream_count())