# scripts/update_streams.py
import asyncio
from backend.unofficial_token_manager import TokenManager
from backend.unofficial_spotify import SpotifyPartner
from backend.db import save_stream_count, get_db

async def save_track_if_not_exists(conn, track_id: str, track_name: str, artist_id: str, album_id: str):
    """Save track if it doesn't already exist in the database"""
    await conn.execute("""
        INSERT INTO tracks (track_id, name, artist_id, album_id)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (track_id) DO UPDATE 
        SET name = $2, artist_id = $3, album_id = $4
    """, track_id, track_name, artist_id, album_id)

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
    processed_count = 0
    error_count = 0
    
    async with get_db() as conn:
        # Get ALL albums we've saved, instead of just 50
        albums = await conn.fetch("""
            SELECT album_id, artist_id 
            FROM albums 
            ORDER BY release_date DESC
        """)
        
        print(f"Found {len(albums)} albums to process")
        
        for album in albums:
            try:
                # Get tracks for each album
                album_data = await spotify.get_album_tracks(album['album_id'])
                
                # Process each track
                for track in album_data.tracks:
                    try:
                        # Ensure artist exists
                        await save_artist_if_not_exists(
                            conn,
                            artist_id=album['artist_id'],
                            artist_name=track.artist_name
                        )
                        
                        # Save/update track
                        await save_track_if_not_exists(
                            conn,
                            track_id=track.track_id,
                            track_name=track.name,
                            artist_id=album['artist_id'],
                            album_id=album['album_id']
                        )
                        
                        # Save stream count
                        await save_stream_count(
                            track_id=track.track_id,
                            play_count=track.playcount
                        )
                        
                        processed_count += 1
                        print(f"Updated stream count for track: {track.name} (Playcount: {track.playcount})")
                        
                    except Exception as e:
                        error_count += 1
                        print(f"Error processing track {track.name}: {str(e)}")
                        continue
                
                # Add a small delay between albums to avoid rate limiting
                await asyncio.sleep(1)
                
            except Exception as e:
                error_count += 1
                print(f"Error processing album {album['album_id']}: {str(e)}")
                continue
    
    print(f"\nProcessing complete!")
    print(f"Successfully processed {processed_count} tracks")
    print(f"Encountered {error_count} errors")

if __name__ == "__main__":
    asyncio.run(main())