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
                    distinct album_id, 
                    
                FROM tracks
                ORDER BY album_id DESC
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

    @staticmethod
    async def get_user_top_tracks(user_id: str, limit: int = 50, offset: int = 0) -> List[Dict]:
        """
        Get a user's top tracks with pagination
        
        Args:
            user_id: User ID to get top tracks for
            limit: Maximum number of tracks to return
            offset: Number of tracks to skip
        Returns:
            List of enriched track details with stream history
        """
        async with get_db() as conn:
            # First get the list of top tracks for the user ordered by created_at
            top_tracks = await conn.fetch("""
                SELECT
                    utt.track_id,
                    t.name,
                    utt.position,
                    t.album_id,
                    a.name as album_name,
                    a.cover_art,
                    a.release_date,
                    a.artist_id,
                    a.artist_name,
                    utt.created_at
                FROM user_top_tracks utt
                JOIN tracks t ON utt.track_id = t.track_id
                JOIN albums a ON t.album_id = a.album_id
                WHERE utt.user_id = $1
                ORDER BY utt.created_at DESC, utt.position ASC
                LIMIT $2 OFFSET $3
            """, user_id, limit, offset)
            
            if not top_tracks:
                return []
            
            # Extract track_ids to get stream data
            track_ids = [t['track_id'] for t in top_tracks]
            
            # Get stream data for these tracks
            stream_data = await conn.fetch("""
                WITH streamsdata AS (
                    SELECT
                        track_id, 
                        timestamp::DATE as day, 
                        max(play_count) as plays
                    FROM streams
                    WHERE track_id = ANY($1) 
                    AND timestamp >= CURRENT_DATE - INTERVAL '8 days'
                    GROUP BY track_id, day
                )
                SELECT
                    track_id,
                    day,
                    COALESCE(plays, 0) as playcount
                FROM streamsdata
                ORDER BY track_id, day
            """, track_ids)
            
            # Create a dictionary to map track_id to its stream data
            track_streams = {}
            for stream in stream_data:
                track_id = stream['track_id']
                if track_id not in track_streams:
                    track_streams[track_id] = []
                track_streams[track_id].append({
                    'day': stream['day'],
                    'playcount': stream['playcount']
                })
            
            # Combine top tracks with their stream data
            result = []
            for track in top_tracks:
                track_dict = dict(track)
                track_id = track_dict['track_id']
                # Add stream history or empty array if no streams found
                track_dict['stream_history'] = track_streams.get(track_id, [])
                result.append(track_dict)
            
            return result
        
    @staticmethod
    async def get_user_clout_by_day(user_id: str) -> List[Dict]:
        """
        Calculate user's cumulative clout by day based on their top tracks' play count growth
        
        Args:
            user_id: User ID to calculate clout for
            
        Returns:
            List of cumulative clout scores with associated date
        """
        async with get_db() as conn:
            results = await conn.fetch("""
                WITH earliest_tracks AS (
                    -- Get earliest date each track was added to user's top tracks
                    SELECT 
                        track_id,
                        MIN(created_at::DATE) as first_added_date
                    FROM user_top_tracks
                    WHERE user_id = $1
                    GROUP BY track_id
                ),
                track_streams AS (
                    -- Get all streams for these tracks
                    SELECT
                        s.track_id, 
                        s.timestamp::DATE as day, 
                        MAX(s.play_count) as plays,
                        et.first_added_date
                    FROM streams s
                    JOIN earliest_tracks et ON s.track_id = et.track_id
                    GROUP BY s.track_id, s.timestamp::DATE, et.first_added_date
                    ORDER BY s.track_id, day
                ),
                daily_growth AS (
                    -- Calculate daily growth percentages, ensuring first day is 0
                    SELECT
                        ts.track_id,
                        ts.day,
                        ts.plays,
                        ts.first_added_date,
                        LAG(ts.plays, 1) OVER (PARTITION BY ts.track_id ORDER BY ts.day) as prev_plays,
                        CASE
                            -- If this is the first day the track was added, growth is 0
                            WHEN ts.day = ts.first_added_date THEN 0
                            -- If no previous plays data, growth is 0
                            WHEN LAG(ts.plays, 1) OVER (PARTITION BY ts.track_id ORDER BY ts.day) IS NULL THEN 0
                            -- If previous plays was 0, handle division by zero
                            WHEN LAG(ts.plays, 1) OVER (PARTITION BY ts.track_id ORDER BY ts.day) = 0 THEN 
                                CASE WHEN ts.plays > 0 THEN 100 ELSE 0 END
                            -- Normal case: calculate percentage growth
                            ELSE 
                                ((ts.plays - LAG(ts.plays, 1) OVER (PARTITION BY ts.track_id ORDER BY ts.day)) * 100.0 / 
                                LAG(ts.plays, 1) OVER (PARTITION BY ts.track_id ORDER BY ts.day))
                        END as growth_percent
                    FROM track_streams ts
                ),
                valid_growth AS (
                    -- Filter to only include days on or after the track was first added
                    SELECT
                        day,
                        track_id,
                        growth_percent
                    FROM daily_growth
                    WHERE day >= first_added_date
                ),
                daily_clout AS (
                    -- Calculate daily clout by summing growth percentages
                    SELECT
                        day,
                        SUM(growth_percent) as daily_clout
                    FROM valid_growth
                    GROUP BY day
                    ORDER BY day
                )
                -- Calculate cumulative clout
                SELECT
                    day,
                    SUM(daily_clout) OVER (ORDER BY day ROWS UNBOUNDED PRECEDING) as clout
                FROM daily_clout
                ORDER BY day
            """, user_id)
            
            return [
                {
                    'day': row['day'],
                    'clout': float(row['clout'])
                } 
                for row in results
            ]

    @staticmethod
    async def save_user_top_tracks(user_id: str, tracks_data: List[Dict]) -> Dict:
        """
        Save a user's top tracks and ensure albums exist in the database
        
        Args:
            user_id: User ID to save top tracks for
            tracks_data: List of track details including position
            
        Returns:
            Summary of saved tracks and albums to fetch
        """
        if not tracks_data:
            return {"tracks_saved": 0, "albums_to_fetch": []}
        
        # Collect album IDs for checking
        album_ids = set()
        values = []
        for track in tracks_data:
            if track.get('album_id'):
                album_ids.add(track['album_id'])
            values.append((user_id, track['track_id'], track['position']))
        
        # Albums that need to be fetched
        albums_to_fetch = []
        
        async with get_db() as conn:
            # Insert user top tracks
            
            await conn.executemany("""
                INSERT INTO user_top_tracks (user_id, track_id, position)
                VALUES ($1, $2, $3)
            """, values)
            
            # Check which albums don't exist in our database
            for album_id in album_ids:
                album_exists = await conn.fetchval(
                    "SELECT EXISTS(SELECT 1 FROM albums WHERE album_id = $1)",
                    album_id
                )
                
                if not album_exists:
                    albums_to_fetch.append(album_id)
        
        return {
            "tracks_saved": len(values),
            "albums_to_fetch": albums_to_fetch
        }
    
    @staticmethod
    async def get_user_top_tracks_dates(user_id: str) -> List[str]:
        """
        Get all distinct dates when a user's top tracks were created in the past 7 days
        
        Args:
            user_id: User ID to get top track dates for
            
        Returns:
            List of distinct dates when top tracks were created for this user in the past 7 days
        """
        async with get_db() as conn:
            results = await conn.fetch("""
                SELECT DISTINCT 
                    date(created_at) as created_date
                FROM user_top_tracks
                WHERE user_id = $1
                AND created_at >= CURRENT_DATE - INTERVAL '30 days'
                ORDER BY created_date DESC
            """, user_id)
            
            return [str(r['created_date']) for r in results]
        
    @staticmethod
    async def get_user_clout_by_track(user_id: str) -> List[Dict]:
        """
        Calculate user's clout by track based on play count growth
        
        Args:
            user_id: User ID to calculate track-level clout for
            
        Returns:
            List of tracks with their clout scores and stream history
        """
        async with get_db() as conn:
            results = await conn.fetch("""
                WITH earliest_tracks AS (
                    -- Get earliest date each track was added to user's top tracks
                    SELECT 
                        track_id,
                        MIN(created_at::DATE) as first_added_date
                    FROM user_top_tracks
                    WHERE user_id = $1
                    GROUP BY track_id
                ),
                track_streams AS (
                    -- Get all streams for these tracks
                    SELECT
                        s.track_id, 
                        t.name as track_name,
                        a.artist_name,
                        a.album_id,
                        a.name as album_name,
                        a.cover_art,
                        s.timestamp::DATE as day, 
                        MAX(s.play_count) as plays,
                        et.first_added_date
                    FROM streams s
                    JOIN earliest_tracks et ON s.track_id = et.track_id
                    JOIN tracks t ON s.track_id = t.track_id
                    JOIN albums a ON t.album_id = a.album_id
                    GROUP BY s.track_id, t.name, a.artist_name, a.album_id, a.name, a.cover_art, s.timestamp::DATE, et.first_added_date
                    ORDER BY s.track_id, day
                ),
                daily_growth AS (
                    -- Calculate daily growth percentages by track
                    SELECT
                        ts.track_id,
                        ts.track_name,
                        ts.artist_name,
                        ts.album_id,
                        ts.album_name,
                        ts.cover_art,
                        ts.day,
                        ts.plays,
                        ts.first_added_date,
                        LAG(ts.plays, 1) OVER (PARTITION BY ts.track_id ORDER BY ts.day) as prev_plays,
                        CASE
                            -- If this is the first day the track was added, growth is 0
                            WHEN ts.day = ts.first_added_date THEN 0
                            -- If no previous plays data, growth is 0
                            WHEN LAG(ts.plays, 1) OVER (PARTITION BY ts.track_id ORDER BY ts.day) IS NULL THEN 0
                            -- If previous plays was 0, handle division by zero
                            WHEN LAG(ts.plays, 1) OVER (PARTITION BY ts.track_id ORDER BY ts.day) = 0 THEN 
                                CASE WHEN ts.plays > 0 THEN 100 ELSE 0 END
                            -- Normal case: calculate percentage growth
                            ELSE 
                                ((ts.plays - LAG(ts.plays, 1) OVER (PARTITION BY ts.track_id ORDER BY ts.day)) * 100.0 / 
                                LAG(ts.plays, 1) OVER (PARTITION BY ts.track_id ORDER BY ts.day))
                        END as growth_percent
                    FROM track_streams ts
                ),
                valid_growth AS (
                    -- Filter to only include days on or after the track was first added
                    SELECT
                        track_id,
                        track_name,
                        artist_name,
                        album_id,
                        album_name,
                        cover_art,
                        day,
                        growth_percent
                    FROM daily_growth
                    WHERE day >= first_added_date
                ),
                track_daily_clout AS (
                    -- Group by track and day to get daily clout for each track
                    SELECT
                        track_id,
                        track_name,
                        artist_name,
                        album_id,
                        album_name,
                        cover_art,
                        day,
                        SUM(growth_percent) as daily_clout
                    FROM valid_growth
                    GROUP BY track_id, track_name, artist_name, album_id, album_name, cover_art, day
                    ORDER BY track_id, day
                )
                -- Calculate cumulative clout per track
                SELECT
                    track_id,
                    track_name,
                    artist_name,
                    album_id,
                    album_name,
                    cover_art,
                    day,
                    daily_clout,
                    SUM(daily_clout) OVER (PARTITION BY track_id ORDER BY day ROWS UNBOUNDED PRECEDING) as cumulative_clout
                FROM track_daily_clout
                ORDER BY track_id, day
            """, user_id)
            
            # Process results to group by track_id
            track_clout = {}
            for row in results:
                track_id = row['track_id']
                
                if track_id not in track_clout:
                    track_clout[track_id] = {
                        'track_id': track_id,
                        'track_name': row['track_name'],
                        'artist_name': row['artist_name'],
                        'album_id': row['album_id'],
                        'album_name': row['album_name'],
                        'cover_art': row['cover_art'],
                        'clout_history': []
                    }
                
                track_clout[track_id]['clout_history'].append({
                    'day': row['day'],
                    'daily_clout': float(row['daily_clout']),
                    'cumulative_clout': float(row['cumulative_clout'])
                })
            
            return list(track_clout.values())