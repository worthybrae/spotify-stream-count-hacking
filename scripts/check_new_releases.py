# scripts/check_new_releases.py
import asyncio
from backend.official_spotify import SpotifyOfficial
from backend.db import save_album, get_db
from backend.config import settings

async def save_artist_if_not_exists(conn, artist_id: str, artist_name: str):
    """Save artist if they don't already exist in the database"""
    await conn.execute("""
        INSERT INTO artists (artist_id, name)
        VALUES ($1, $2)
        ON CONFLICT (artist_id) DO UPDATE 
        SET name = $2
    """, artist_id, artist_name)

async def main():
    spotify = SpotifyOfficial()
    new_releases = await spotify.get_new_releases(limit=50)
    
    async with get_db() as conn:
        for album in new_releases:
            try:
                # First ensure artist exists
                await save_artist_if_not_exists(
                    conn,
                    artist_id=album.artist_id,
                    artist_name=album.artist_name
                )
                
                # Then save album
                await save_album(
                    album_id=album.album_id,
                    artist_id=album.artist_id,
                    name=album.album_name,
                    cover_art=album.cover_art,
                    release_date=album.release_date
                )
                print(f"Saved album: {album.album_name} by {album.artist_name}")
                
            except Exception as e:
                print(f"Error processing album {album.album_name}: {str(e)}")
                continue

if __name__ == "__main__":
    asyncio.run(main())