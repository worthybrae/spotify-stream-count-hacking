# tasks.py
from celery_init import app
from services.cockroach import DatabaseService
from services.unofficial_spotify import TokenManager, UnofficialSpotifyService
import asyncio
from datetime import datetime

# Singleton class for tracking album position
class AlbumTracker:
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(AlbumTracker, cls).__new__(cls)
            cls._instance.current_offset = 0
            cls._instance.batch_size = 50
            cls._instance.lock = asyncio.Lock()
        return cls._instance
    
    async def get_next_batch(self):
        """Get the next batch of albums with offset and limit"""
        async with self.lock:
            result = {
                "offset": self.current_offset,
                "limit": self.batch_size
            }
            self.current_offset += self.batch_size
            return result
    
    def reset(self):
        """Reset the position counter"""
        self.current_offset = 0

# Singleton class for database service
class DatabaseServiceSingleton:
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(DatabaseServiceSingleton, cls).__new__(cls)
            cls._instance.service = DatabaseService()
        return cls._instance
    
    def get_service(self):
        return self.service

# Singleton class for Spotify service
class SpotifyServiceSingleton:
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(SpotifyServiceSingleton, cls).__new__(cls)
            cls._instance.token_manager = TokenManager()
            cls._instance.service = UnofficialSpotifyService(cls._instance.token_manager)
        return cls._instance
    
    def get_service(self):
        return self.service

# Initialize the singleton instances
album_tracker = AlbumTracker()
db_singleton = DatabaseServiceSingleton()
spotify_singleton = SpotifyServiceSingleton()

# Task 1: Fetch a batch of albums (first box in diagram)
@app.task
def fetch_albums_batch():
    """Fetch a batch of albums from database and distribute work"""
    return asyncio.run(_fetch_albums_batch_async())

async def _fetch_albums_batch_async():
    """Async implementation of the album batch fetching"""
    # Get next batch parameters from the singleton tracker
    batch_params = await album_tracker.get_next_batch()
    
    # Get database service from singleton
    db_service = db_singleton.get_service()
    albums = await db_service.get_all_albums(
        limit=batch_params["limit"],
        offset=batch_params["offset"]
    )
    
    # If no albums found, reset tracker and return
    if not albums:
        print('No more albums to process, resetting tracker')
        album_tracker.reset()
        return {"status": "complete", "message": "No more albums to process"}
    
    # For each album, create a task to fetch metrics
    for album in albums:
        fetch_album_metrics.delay(album)
    
    # Add this to chain the next batch automatically
    # This is the key fix - schedule the next batch processing
    fetch_albums_batch.delay()
    
    return {
        "status": "processing",
        "batch": batch_params,
        "albums_count": len(albums)
    }

# Task 2: Fetch metrics for a single album (middle boxes in diagram)
@app.task(rate_limit="200/m")
def fetch_album_metrics(album):
    """Fetch metrics for an album from Spotify API"""
    return asyncio.run(_fetch_album_metrics_async(album))

async def _fetch_album_metrics_async(album):
    """Async implementation of the metrics fetching"""
    # Get Spotify service from singleton
    spotify = spotify_singleton.get_service()
    
    try:
        # Get album data from Spotify API
        album_data = await spotify.get_album_tracks(album["album_id"])
        
        # Prepare data for the next task
        result = {
            "album_id": album_data.album_id,
            "album_name": album_data.album_name,
            "artist_id": album.artist_id,
            "artist_name": album.artist_name,
            "tracks": []
        }
        
        # Add cover art and release date if available
        if hasattr(album_data, "cover_art"):
            result["cover_art"] = album_data.cover_art
        
        if hasattr(album_data, "release_date"):
            result["release_date"] = album_data.release_date
        
        # Process tracks
        for track in album_data.tracks:
            result["tracks"].append({
                "track_id": track.track_id,
                "name": track.name,
                "playcount": track.playcount
            })
        
        # Chain to upload task
        upload_album_metrics.delay(result)
        
        return {
            "album_id": album["album_id"],
            "status": "success",
            "tracks_count": len(result["tracks"])
        }
    
    except Exception as e:
        return {
            "album_id": album["album_id"],
            "status": "error",
            "error": str(e)
        }

# Task 3: Upload album metrics to database (bottom boxes in diagram)
@app.task
def upload_album_metrics(album_data):
    """Upload album metrics to database"""
    return asyncio.run(_upload_album_metrics_async(album_data))

async def _upload_album_metrics_async(album_data):
    """Async implementation of metrics uploading"""
    db_service = db_singleton.get_service()
    
    try:
        # Prepare album info
        album_info = {
            "album_id": album_data["album_id"],
            "album_name": album_data["album_name"],
            "artist_id": album_data["artist_id"],
            "artist_name": album_data["artist_name"],
            "cover_art": album_data.get("cover_art", ""),
            "release_date": album_data.get("release_date", datetime.now())
        }
        
        # Convert string date to datetime if needed
        if isinstance(album_info["release_date"], str):
            try:
                album_info["release_date"] = datetime.strptime(album_info["release_date"], "%Y-%m-%d")
            except:
                album_info["release_date"] = datetime.now()
        
        # Prepare tracks and streams data
        tracks = []
        streams = []
        
        for track in album_data["tracks"]:
            # Track data
            tracks.append({
                "track_id": track["track_id"],
                "name": track["name"],
                "artist_id": album_data["artist_id"],
                "album_id": album_data["album_id"]
            })
            
            # Stream data
            streams.append({
                "track_id": track["track_id"],
                "play_count": track["playcount"],
                "album_id": album_data["album_id"]
            })
        
        # Save to database
        result = await db_service.save_complete_album(album_info, tracks, streams)
        
        return {
            "album_id": album_data["album_id"],
            "status": "uploaded",
            "tracks_count": len(tracks)
        }
    
    except Exception as e:
        return {
            "album_id": album_data["album_id"],
            "status": "error",
            "error": str(e)
        }