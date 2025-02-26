# services/update_streams.py
import asyncio
from datetime import datetime
from services.database import get_db, DatabaseService
from services.unofficial_spotify import TokenManager, UnofficialSpotifyService

class StreamUpdateService:
    """
    Service to handle updating stream counts for all albums in the database
    """
    
    @staticmethod
    async def process_albums():
        """
        Process all albums in database and update their stream counts
        """
        token_manager = TokenManager()
        spotify = UnofficialSpotifyService(token_manager)
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
                    await DatabaseService.save_album(
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
                        await DatabaseService.batch_save_tracks(conn, tracks_batch)
                        print(f"Updated {len(tracks_batch)} tracks for album: {album['album_name']}")
                    
                    if streams_batch:
                        await DatabaseService.batch_save_stream_counts(conn, streams_batch)
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
        
        return {
            "processed_count": processed_count,
            "error_count": error_count,
            "albums_count": len(albums),
            "timestamp": datetime.now().isoformat()
        }

# Function to be called from main.py or other modules
async def process_albums():
    """
    Wrapper function to process all albums
    Returns stats about the update process
    """
    return await StreamUpdateService.process_albums()

# For standalone execution
async def main():
    """
    Main function for running the stream update as a standalone script
    """
    print(f"Starting stream count update at {datetime.now()}")
    result = await process_albums()
    print(f"Completed stream count update at {datetime.now()}")
    print(f"Stats: {result}")

if __name__ == "__main__":
    asyncio.run(main())