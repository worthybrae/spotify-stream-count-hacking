# services/database.py
import logging
from datetime import datetime, timedelta
from typing import List, Optional

from models import Stream

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("database_service")


class DatabaseService:
    """
    Service for handling database operations for album and track data.
    Currently using in-memory storage, but can be extended to use a real database.
    """

    def __init__(self):
        # In-memory storage for album data
        self.album_cache = {}
        # Cache expiration time (24 hours)
        self.cache_expiration = timedelta(hours=24)

    async def fetch_album_data(self, album_id: str) -> Optional[List[Stream]]:
        """
        Fetch album data from the database/cache.
        Returns None if data is not found or expired.
        """
        if album_id not in self.album_cache:
            logger.info(f"No cached data found for album {album_id}")
            return None

        album_data = self.album_cache[album_id]
        if not self._is_cache_valid(album_data["timestamp"]):
            logger.info(f"Cache expired for album {album_id}")
            del self.album_cache[album_id]
            return None

        logger.info(f"Returning cached data for album {album_id}")
        return album_data["streams"]

    async def save_complete_album(self, streams: List[Stream]) -> dict:
        """
        Save complete album data to the database/cache.
        """
        if not streams:
            return {"status": "error", "message": "No streams to save"}

        album_id = streams[0].album_id
        self.album_cache[album_id] = {"streams": streams, "timestamp": datetime.now()}

        return {
            "status": "success",
            "message": f"Saved {len(streams)} tracks for album {album_id}",
            "album_id": album_id,
        }

    def _is_cache_valid(self, timestamp: datetime) -> bool:
        """Check if the cached data is still valid"""
        return datetime.now() - timestamp < self.cache_expiration
