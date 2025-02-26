# scripts/update_streams.py
import asyncio
from backend.unofficial_spotify import SpotifyPartner, TokenManager
from backend.db import batch_save_stream_counts, batch_save_tracks, save_album, get_db
from datetime import datetime

async def process_albums():
    """Process all albums in database and update their stream counts"""
    token_manager = TokenManager()
    spotify = SpotifyPartner(token_manager)
    processed_count = 0
    error_count = 0
    
    async with get_db() as conn:
        # Get ALL albums we've saved
        albums = await conn.fetch("""
            SELECT album_id, artist_id, name as album_name, artist_name 
            FROM albums 
            ORDER BY release_date DESC
        """)
        
        print(f"Found {len(albums)} albums to process")
        
        for album in albums:
            try:
                # Get tracks for each album
                album_data = await spotify.get_album_tracks(album['album_id'])
                album_id = album['album_id']
                
                # Prepare batch data structures
                tracks_batch = []
                streams_batch = []
                
                # Process each track
                for track in album_data.tracks:
                    try:
                        # Prepare track data for batch saving
                        tracks_batch.append({
                            'track_id': track.track_id,
                            'name': track.name,
                            'artist_id': album['artist_id'],
                            'album_id': album_id
                        })
                        
                        # Prepare stream data for batch saving
                        streams_batch.append({
                            'track_id': track.track_id,
                            'play_count': track.playcount,
                            'album_id': album_id
                        })
                        
                        processed_count += 1
                        
                    except Exception as e:
                        error_count += 1
                        print(f"Error processing track {track.track_id}: {str(e)}")
                        continue
                
                # Update album info (in case anything has changed)
                release_date = datetime.now()
                if hasattr(album_data, "release_date") and album_data.release_date:
                    try:
                        release_date = datetime.strptime(album_data.release_date, "%Y-%m-%d")
                    except Exception as e:
                        print(f"Error parsing release date: {e}")
                
                cover_art = ""
                if hasattr(album_data, "cover_art") and album_data.cover_art:
                    cover_art = album_data.cover_art
                
                # Update album info
                await save_album(
                    conn,
                    album_id=album_id,
                    artist_id=album['artist_id'],
                    name=album['album_name'],
                    cover_art=cover_art,
                    release_date=release_date,
                    artist_name=album['artist_name']
                )
                
                # Batch save tracks and streams
                if tracks_batch:
                    await batch_save_tracks(conn, tracks_batch)
                    print(f"Updated {len(tracks_batch)} tracks for album: {album['album_name']}")
                
                if streams_batch:
                    await batch_save_stream_counts(conn, streams_batch)
                    print(f"Updated {len(streams_batch)} stream records for album: {album['album_name']}")
                
                # Add a small delay between albums to avoid rate limiting
                await asyncio.sleep(1)
                
            except Exception as e:
                error_count += 1
                print(f"Error processing album {album['album_id']}: {str(e)}")
                continue
    
    print(f"\nProcessing complete!")
    print(f"Successfully processed {processed_count} tracks")
    print(f"Encountered {error_count} errors")

async def main():
    await process_albums()

if __name__ == "__main__":
    asyncio.run(main())