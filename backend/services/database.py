# services/database.py
import asyncpg
from contextlib import asynccontextmanager
from datetime import datetime
from typing import List, Dict, Any, Optional
from config import settings

@asynccontextmanager
async def get_db():
    """Database connection context manager"""
    conn = await asyncpg.connect(settings.DATABASE_URL)
    try:
        yield conn
    finally:
        await conn.close()

class DatabaseService:
    """
    Service class for database operations related to albums, tracks, and streams
    """
    # Verified
    @staticmethod
    async def search_albums_by_name(query: str, limit: int = 20) -> List[Dict]:
        """
        Search for albums by name
        
        Args:
            query: Search query string
            limit: Maximum number of results to return
            
        Returns:
            List of album details matching the search query
        """
        async with get_db() as conn:
            results = await conn.fetch("""
                SELECT 
                    album_id, 
                    name as album_name, 
                    cover_art, 
                    release_date,
                    artist_id,
                    artist_name
                FROM albums
                WHERE name ILIKE $1
                ORDER BY release_date DESC
                LIMIT $2
            """, f"%{query}%", limit)
            
            return [dict(r) for r in results]
    # Verified
    @staticmethod
    async def get_album_with_tracks_and_streams(album_id: str) -> Optional[Dict]:
        """
        Get complete album data including all tracks and their latest stream counts
        
        Args:
            album_id: Spotify album ID
            
        Returns:
            Dict with album details, tracks, and their stream counts,
            or None if the album wasn't found
        """
        async with get_db() as conn:
            # Get album details
            album = await conn.fetchrow("""
                SELECT 
                    album_id,
                    name as album_name,
                    cover_art,
                    release_date,
                    artist_id,
                    artist_name
                FROM albums
                WHERE album_id = $1
            """, album_id)
            
            if not album:
                return None
                
            # Get tracks with their latest stream counts
            tracks = await conn.fetch("""
                WITH streamsdata AS (
                    SELECT
                        track_id, timestamp::DATE as day, max(play_count) as plays
                    FROM streams
                    WHERE album_id = $1 AND timestamp >= CURRENT_DATE - INTERVAL '8 days'
                    GROUP BY track_id, day
                ), tracksdata AS (
                    SELECT
                        track_id,
                        name
                    FROM tracks
                    WHERE album_id = $1                      
                )
                SELECT 
                    s.track_id,
                    t.name,
                    s.day,
                    COALESCE(s.plays, 0) as playcount
                FROM streamsdata s
                LEFT JOIN tracksdata t ON t.track_id = s.track_id
                ORDER BY t.name, s.day
            """, album_id)
            
            return {
                "album": dict(album),
                "tracks": [dict(t) for t in tracks]
            }
    # Verified
    @staticmethod
    async def get_all_albums(limit: int = 50, offset: int = 0) -> List[Dict]:
        """
        Get all albums with pagination
        
        Args:
            limit: Maximum number of albums to return
            offset: Number of albums to skip
            
        Returns:
            List of album details
        """
        async with get_db() as conn:
            results = await conn.fetch("""
                SELECT 
                    album_id, 
                    name as album_name, 
                    artist_id,
                    artist_name,
                    cover_art, 
                    release_date
                FROM albums
                ORDER BY release_date DESC
                LIMIT $1 OFFSET $2
            """, limit, offset)
            
            return [dict(r) for r in results]
    # Verified
    @staticmethod
    async def save_album(conn, album_id: str, artist_id: str, name: str, 
                       cover_art: str, release_date: datetime, artist_name: str):
        """Save album if it doesn't already exist in the database"""
        await conn.execute("""
            INSERT INTO albums (album_id, artist_id, name, cover_art, release_date, artist_name)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (album_id) DO UPDATE 
            SET artist_id = $2, name = $3, cover_art = $4, release_date = $5, artist_name = $6
        """, album_id, artist_id, name, cover_art, release_date, artist_name)
    # Verified
    @staticmethod
    async def batch_save_tracks(conn, tracks_data: List[Dict[str, Any]]) -> int:
        """
        Batch save multiple tracks at once
        
        Args:
            conn: Database connection
            tracks_data: List of dicts with keys: track_id, name, artist_id, album_id
            
        Returns:
            Number of tracks saved
        """
        if not tracks_data:
            return 0
            
        # Prepare values for executemany
        values = [
            (item['track_id'], item['name'], item['artist_id'], item['album_id'])
            for item in tracks_data
        ]
        
        # Execute batch insert
        await conn.executemany("""
            INSERT INTO tracks (track_id, name, artist_id, album_id)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (track_id) DO UPDATE 
            SET name = $2, artist_id = $3, album_id = $4
        """, values)
        
        return len(values)
    # Verified
    @staticmethod
    async def batch_save_stream_counts(conn, stream_data_list: List[Dict[str, Any]]) -> int:
        """
        Batch save multiple stream counts at once
        
        Args:
            conn: Database connection
            stream_data_list: List of dicts with keys: track_id, play_count, album_id
        
        Returns:
            Number of records inserted
        """
        if not stream_data_list:
            return 0
            
        # Prepare values for executemany
        values = [
            (item['track_id'], item['play_count'], item['album_id']) 
            for item in stream_data_list
        ]
        
        # Execute batch insert
        await conn.executemany("""
            INSERT INTO streams (track_id, play_count, album_id)
            VALUES ($1, $2, $3)
            ON CONFLICT (track_id, play_count, album_id) DO NOTHING
        """, values)
        
        return len(values)
    # Verified
    @staticmethod
    async def save_complete_album(album_data: Dict, tracks_data: List[Dict], stream_data: List[Dict]) -> Dict:
        """
        Save a complete album with its tracks, and stream counts
        
        Args:
            album_data: Dict with album and artist details
            tracks_data: List of track details
            stream_data: List of stream counts
            
        Returns:
            Dict with summary of saved records
        """
        async with get_db() as conn:
            async with conn.transaction():
                # Save album
                await DatabaseService.save_album(
                    conn,
                    album_data['album_id'],
                    album_data['artist_id'],
                    album_data['album_name'],
                    album_data.get('cover_art', ''),
                    album_data['release_date'],
                    album_data['artist_name']
                )
                
                # Prepare tracks data
                track_batch = [
                    {
                        'track_id': track['track_id'],
                        'name': track['name'],
                        'artist_id': album_data['artist_id'],
                        'album_id': album_data['album_id']
                    }
                    for track in tracks_data
                ]
                
                # Save tracks
                tracks_count = await DatabaseService.batch_save_tracks(conn, track_batch)
                
                # Prepare streams data 
                stream_batch = [
                    {
                        'track_id': stream['track_id'],
                        'play_count': stream['play_count'],
                        'album_id': album_data['album_id']
                    }
                    for stream in stream_data
                ]
                
                # Save streams
                streams_count = await DatabaseService.batch_save_stream_counts(conn, stream_batch)
                
                return {
                    'album_id': album_data['album_id'],
                    'artist_id': album_data['artist_id'],
                    'tracks_count': tracks_count,
                    'streams_count': streams_count
                }

    