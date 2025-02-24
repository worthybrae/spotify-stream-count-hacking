# scripts/update_streams.py
import asyncio
from backend.unofficial_token_manager import TokenManager
from backend.unofficial_spotify import SpotifyPartner
from backend.db import save_stream_count, get_db

async def save_track_if_not_exists(conn, track_id: str, track_name: str, artist_id: str):
    """Save track if it doesn't already exist in the database"""
    await conn.execute("""
        INSERT INTO tracks (track_id, name, artist_id)
        VALUES ($1, $2, $3)
        ON CONFLICT (track_id) DO UPDATE 
        SET name = $2, artist_id = $3
    """, track_id, track_name, artist_id)

async def save_artist_if_not_exists(conn, artist_id: str, artist_name: str):
    """Save artist if they don't already exist in the database"""
    await conn.execute("""
        INSERT INTO artists (artist_id, name)
        VALUES ($1, $2)
        ON CONFLICT (artist_id) DO UPDATE 
        SET name = $2
    """, artist_id, artist_name)

async def main():
    token_manager = TokenManager()
    spotify = SpotifyPartner(token_manager)
    
    async with get_db() as conn:
        # Get all tracks from your DB
        tracks = await conn.fetch("SELECT track_id FROM tracks")
        
        for track in tracks:
            try:
                # Get current track info
                data = await spotify.get_track_info(track['track_id'])
                
                # Ensure artist exists before saving track
                await save_artist_if_not_exists(
                    conn,
                    artist_id=data['artist_id'],
                    artist_name=data['artist_name']
                )
                
                # Ensure track exists/is updated
                await save_track_if_not_exists(
                    conn,
                    track_id=data['track_id'],
                    track_name=data['name'],
                    artist_id=data['artist_id']
                )
                
                # Save stream count
                await save_stream_count(
                    track_id=data['track_id'],
                    play_count=data['playcount']
                )
                print(f"Updated stream count for track: {data['name']}")
                
            except Exception as e:
                print(f"Error processing track {track['track_id']}: {str(e)}")
                continue

if __name__ == "__main__":
    asyncio.run(main())