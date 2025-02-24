# tests/test_integration.py
import pytest
from backend.official_spotify import SpotifyOfficial
from backend.unofficial_spotify import SpotifyPartner
from backend.unofficial_token_manager import TokenManager
from backend.db import get_db
from datetime import datetime

@pytest.mark.asyncio
async def test_full_release_flow():
    """
    Integration test with optimized batch operations
    """
    spotify_official = SpotifyOfficial()
    token_manager = TokenManager()
    spotify_partner = SpotifyPartner(token_manager)
    
    created_records = {
        'artists': set(),
        'albums': set(),
        'tracks': set(),
        'streams': set()
    }
    
    try:
        # 1. Get new releases
        releases = await spotify_official.get_new_releases(limit=1)
        assert len(releases) > 0, "No new releases found"
        
        new_release = releases[0]
        print(f"Testing with album: {new_release.album_name} by {new_release.artist_name}")
        
        # 2. Get tracks for the album
        album_response = await spotify_partner.get_album_tracks(new_release.album_id)
        assert len(album_response.tracks) > 0, "No tracks found in album"

        async with get_db() as conn:
            # 3. Batch insert artist, album, tracks, and streams
            await conn.execute("""
                INSERT INTO artists (artist_id, name)
                VALUES ($1, $2)
                ON CONFLICT (artist_id) DO NOTHING
            """, new_release.artist_id, new_release.artist_name)
            created_records['artists'].add(new_release.artist_id)

            await conn.execute("""
                INSERT INTO albums (album_id, artist_id, name, cover_art, release_date)
                VALUES ($1, $2, $3, $4, $5)
                ON CONFLICT (album_id) DO NOTHING
            """, new_release.album_id, new_release.artist_id, new_release.album_name, 
                new_release.cover_art, new_release.release_date)
            created_records['albums'].add(new_release.album_id)

            # Batch insert tracks with album_id
            track_records = [
                (track.track_id, track.name, new_release.artist_id, new_release.album_id)
                for track in album_response.tracks
            ]
            await conn.executemany("""
                INSERT INTO tracks (track_id, name, artist_id, album_id)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (track_id) DO NOTHING
            """, track_records)
            created_records['tracks'].update(t.track_id for t in album_response.tracks)

            # Batch insert stream counts
            stream_records = [
                (track.track_id, track.playcount, datetime.now())
                for track in album_response.tracks
            ]
            await conn.executemany("""
                INSERT INTO streams (track_id, play_count, timestamp)
                VALUES ($1, $2, $3)
            """, stream_records)
            created_records['streams'].update(t.track_id for t in album_response.tracks)

            # 4. Verify data with efficient queries
            # Check artist and album
            saved_data = await conn.fetchrow("""
                SELECT a.name as artist_name, al.name as album_name, 
                       COUNT(DISTINCT t.track_id) as track_count,
                       COUNT(DISTINCT s.track_id) as stream_count
                FROM artists a
                JOIN albums al ON a.artist_id = al.artist_id
                LEFT JOIN tracks t ON al.album_id = t.album_id
                LEFT JOIN streams s ON t.track_id = s.track_id
                WHERE a.artist_id = $1 AND al.album_id = $2
                GROUP BY a.name, al.name
            """, new_release.artist_id, new_release.album_id)

            assert saved_data is not None
            assert saved_data['artist_name'] == new_release.artist_name
            assert saved_data['album_name'] == new_release.album_name
            assert saved_data['track_count'] == len(album_response.tracks)
            assert saved_data['stream_count'] == len(album_response.tracks)

    finally:
        # Clean up all created records in a single transaction
        async with get_db() as conn:
            if created_records['streams']:
                await conn.execute(
                    "DELETE FROM streams WHERE track_id = ANY($1)",
                    list(created_records['streams'])
                )
            
            if created_records['tracks']:
                await conn.execute(
                    "DELETE FROM tracks WHERE track_id = ANY($1)",
                    list(created_records['tracks'])
                )
            
            if created_records['albums']:
                await conn.execute(
                    "DELETE FROM albums WHERE album_id = ANY($1)",
                    list(created_records['albums'])
                )
            
            if created_records['artists']:
                await conn.execute(
                    "DELETE FROM artists WHERE artist_id = ANY($1)",
                    list(created_records['artists'])
                )