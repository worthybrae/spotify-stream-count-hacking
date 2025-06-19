# services/cockroach.py
import logging
import traceback
from contextlib import asynccontextmanager
from datetime import datetime
from typing import Dict, List

import asyncpg
from config import settings
from models import DatabaseAlbum, DatabaseStream, DatabaseTrack, StreamResponse

logger = logging.getLogger(__name__)


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
    Service class for database operations using provided query templates
    """

    # 1. Insert Album query
    async def insert_album(self, album: DatabaseAlbum):
        """Insert album using the provided template"""
        logger.info(f"[DB] Inserting album: {album}")
        async with get_db() as conn:
            async with conn.transaction():
                try:
                    await conn.execute(
                        """
                        INSERT INTO albums (
                            album_id,
                            name,
                            artist_name,
                            cover_art,
                            release_date
                        )
                        VALUES (
                            $1,
                            $2,
                            $3,
                            $4,
                            $5
                        )
                        ON CONFLICT (
                            album_id
                        )
                        DO UPDATE SET
                            name = $2,
                            artist_name = $3,
                            cover_art = $4,
                            release_date = $5
                    """,
                        album.album_id,
                        album.name,
                        album.artist_name,
                        album.cover_art,
                        album.release_date,
                    )
                    logger.info(f"[DB] Album inserted/updated: {album.album_id}")
                except Exception:
                    logger.error(
                        f"[DB][EXCEPTION] Error inserting album: {album}\n{traceback.format_exc()}"
                    )
                    raise

    # 2. Insert Track query
    async def insert_track(self, track: DatabaseTrack):
        """Insert track using the provided template"""
        logger.info(f"[DB] Inserting track: {track}")
        async with get_db() as conn:
            async with conn.transaction():
                try:
                    await conn.execute(
                        """
                        INSERT INTO tracks (
                            track_id,
                            name,
                            album_id
                        )
                        VALUES (
                            $1,
                            $2,
                            $3
                        )
                        ON CONFLICT (
                            track_id
                        )
                        DO UPDATE
                        SET
                            name = $2,
                            album_id = $3
                    """,
                        track.track_id,
                        track.track_name,
                        track.album_id,
                    )
                    logger.info(f"[DB] Track inserted/updated: {track.track_id}")
                except Exception:
                    logger.error(
                        f"[DB][EXCEPTION] Error inserting track: {track}\n{traceback.format_exc()}"
                    )
                    raise

    # 3. Insert Stream query
    async def insert_stream(self, stream: DatabaseStream):
        """Insert stream using the provided template"""
        logger.info(f"[DB] Inserting stream: {stream}")
        async with get_db() as conn:
            async with conn.transaction():
                try:
                    await conn.execute(
                        """
                        INSERT INTO streams (
                            track_id,
                            play_count,
                            album_id,
                            timestamp
                        )
                        VALUES (
                            $1,
                            $2,
                            $3,
                            $4
                        )
                        ON CONFLICT (
                            track_id,
                            play_count,
                            album_id
                        )
                        DO NOTHING
                    """,
                        stream.track_id,
                        stream.play_count,
                        stream.album_id,
                        stream.timestamp,
                    )
                    logger.info(
                        f"[DB] Stream inserted: {stream.track_id} play_count={stream.play_count} album_id={stream.album_id}"
                    )
                except Exception:
                    logger.error(
                        f"[DB][EXCEPTION] Error inserting stream: {stream}\n{traceback.format_exc()}"
                    )
                    raise

    # 5. Check Album Existence query
    async def check_album_exists(self, album_id: str) -> bool:
        """Check if album exists using the provided template"""
        async with get_db() as conn:
            result = await conn.fetchval(
                """
                SELECT album_id
                FROM   albums
                WHERE  album_id = $1
                LIMIT  10
            """,
                album_id,
            )
            return result is not None

    # 6. Search Albums query
    async def search_albums(self, query: str, limit: int = 10) -> List[DatabaseAlbum]:
        """Search albums using the provided template"""
        async with get_db() as conn:
            results = await conn.fetch(
                """
                SELECT album_id,
                       artist_name,
                       name,
                       cover_art,
                       release_date::date
                FROM   albums
                WHERE  name LIKE $1
                LIMIT  $2
            """,
                f"%{query}%",
                limit,
            )

            return [DatabaseAlbum(**dict(r)) for r in results]

    # 7. Fetch Album Data query
    async def fetch_album_data(
        self, album_id: str, time_period: str = "7d"
    ) -> List[StreamResponse]:
        """Fetch album data using the provided template with percentage change calculation"""
        async with get_db() as conn:
            # Convert time_period to days as string for SQL
            days = "7" if time_period == "7d" else "30"

            # First get the album data
            album_result = await conn.fetchrow(
                """
                SELECT album_id,
                       name,
                       artist_name,
                       cover_art,
                       release_date::date
                FROM albums
                WHERE album_id = $1
                """,
                album_id,
            )

            if not album_result:
                return []

            album = DatabaseAlbum(**dict(album_result))

            # Get all tracks with their percentage changes over the specified period
            results = await conn.fetch(
                """
                with latest_streams as (
                    select
                        album_id,
                        track_id,
                        timestamp::date as stream_recorded_at,
                        max(play_count) as daily_play_count
                    from
                        streams
                    where
                        album_id = $1
                        and timestamp between CURRENT_DATE - ($2 || ' days')::interval and CURRENT_DATE
                        and play_count > 0
                    group by
                        album_id,
                        track_id,
                        stream_recorded_at
                ), track_metrics as (
                    select
                        album_id,
                        track_id,
                        min(daily_play_count) as start_streams,
                        max(daily_play_count) as end_streams,
                        max(stream_recorded_at) as latest_date
                    from
                        latest_streams
                    group by
                        album_id,
                        track_id
                ), track_changes as (
                    select
                        album_id,
                        track_id,
                        end_streams as current_streams,
                        latest_date,
                        case
                            when start_streams > 0 then
                                ((end_streams::float / start_streams::float) - 1) * 100
                            else 0
                        end as pct_change
                    from
                        track_metrics
                )
                select
                    t.name as track_name,
                    t.track_id,
                    t.album_id,
                    coalesce(ls.daily_play_count, 0) as play_count,
                    coalesce(ls.stream_recorded_at, CURRENT_DATE) as stream_recorded_at,
                    coalesce(tc.pct_change, 0.0) as pct_change
                from
                    tracks t
                left join
                    latest_streams ls on ls.track_id = t.track_id
                left join
                    track_changes tc on tc.track_id = t.track_id
                where
                    t.album_id = $1
                order by
                    t.track_id, ls.stream_recorded_at asc
                """,
                album_id,
                days,
            )

            # Create StreamResponse objects with percentage changes
            streams = []
            for r in results:
                track = DatabaseTrack(
                    track_id=r["track_id"],
                    track_name=r["track_name"],
                    album_id=r["album_id"],
                )
                stream = DatabaseStream(
                    track_id=r["track_id"],
                    album_id=r["album_id"],
                    play_count=r["play_count"] or 0,
                    timestamp=r["stream_recorded_at"] or datetime.now(),
                )
                streams.append(
                    StreamResponse.from_database_with_pct_change(
                        stream,
                        track,
                        album,
                        pct_change=r["pct_change"] or 0.0,
                        time_period=time_period,
                    )
                )

            return streams

    # Composite operations using the individual query templates
    async def save_complete_album(self, streams: List[StreamResponse]) -> Dict:
        """Save a complete album with its tracks and stream counts using the provided templates"""
        logger.info(f"[DB] save_complete_album called with {len(streams)} streams")
        if not streams:
            logger.error("[DB] No streams to save")
            return {"status": "error", "message": "No streams to save"}
        async with get_db() as conn:
            async with conn.transaction():
                try:
                    album = DatabaseAlbum(
                        album_id=streams[0].album_id,
                        name=streams[0].album_name,
                        artist_name=streams[0].artist_name,
                        cover_art=streams[0].cover_art,
                        release_date=streams[0].release_date
                        if isinstance(streams[0].release_date, datetime)
                        else datetime.strptime(
                            streams[0].release_date, "%Y-%m-%dT%H:%M:%SZ"
                        ),
                    )
                    await self.insert_album(album)
                    for stream in streams:
                        track = DatabaseTrack(
                            track_id=stream.track_id,
                            track_name=stream.track_name,
                            album_id=stream.album_id,
                        )
                        await self.insert_track(track)
                        db_stream = DatabaseStream(
                            track_id=stream.track_id,
                            album_id=stream.album_id,
                            play_count=stream.stream_count,
                            timestamp=datetime.strptime(
                                stream.timestamp, "%Y-%m-%dT%H:%M:%SZ"
                            ),
                        )
                        await self.insert_stream(db_stream)
                    logger.info(
                        f"[DB] save_complete_album finished for album_id={album.album_id}"
                    )
                    return {
                        "album_id": streams[0].album_id,
                        "tracks_saved": len(streams),
                        "streams_saved": len(streams),
                        "status": "success",
                    }
                except Exception as e:
                    logger.error(
                        f"[DB][EXCEPTION] save_complete_album failed: {e}\n{traceback.format_exc()}"
                    )
                    return {"status": "error", "message": str(e)}

    # Additional utility operations

    async def get_all_albums(self, limit: int = 50, offset: int = 0) -> List[Dict]:
        """Get all albums with pagination"""
        async with get_db() as conn:
            results = await conn.fetch(
                """
                SELECT
                    distinct album_id
                FROM tracks
                ORDER BY album_id DESC
                LIMIT $1 OFFSET $2
            """,
                limit,
                offset,
            )

            return [dict(r) for r in results]

    async def fetch_top_tracks(self, time_period: str = "7d") -> List[StreamResponse]:
        async with get_db() as conn:
            # Convert time_period to days as string for SQL
            days = "7" if time_period == "7d" else "30"

            results = await conn.fetch(
                """
                with latest_streams as (
                    select
                        album_id,
                        track_id,
                        timestamp::date as stream_recorded_at,
                        max(play_count) as daily_play_count
                    from
                        streams
                    where
                        timestamp between CURRENT_DATE - ($1 || ' days')::interval and CURRENT_DATE and
                        play_count > 0
                    group by
                        album_id,
                        track_id,
                        stream_recorded_at
                ), track_metrics as (
                    select
                        album_id,
                        track_id,
                        min(daily_play_count) as start_streams,
                        max(daily_play_count) as end_streams,
                        max(stream_recorded_at) as latest_date
                    from
                        latest_streams
                    group by
                        album_id,
                        track_id
                ), track_changes as (
                    select
                        album_id,
                        track_id,
                        end_streams as current_streams,
                        latest_date,
                        case
                            when start_streams > 0 then
                                ((end_streams::float / start_streams::float) - 1) * 100
                            else 0
                        end as pct_change
                    from
                        track_metrics
                ), top_tracks as (
                    select
                        album_id,
                        track_id,
                        pct_change
                    from
                        track_changes
                    order by
                        pct_change desc
                    limit 5
                )
                select
                    t.name as track_name,
                    ls.album_id,
                    ls.track_id,
                    ls.stream_recorded_at,
                    ls.daily_play_count as play_count,
                    tc.pct_change,
                    a.name as album_name,
                    a.cover_art,
                    a.release_date,
                    a.artist_name
                from
                    latest_streams ls
                join
                    top_tracks tt on tt.track_id = ls.track_id
                left join
                    track_changes tc on tc.track_id = ls.track_id
                left join
                    albums a on a.album_id = ls.album_id
                left join
                    tracks t on t.track_id = ls.track_id
                order by
                    tc.pct_change desc, ls.stream_recorded_at asc
                """,
                days,
            )
            return [
                StreamResponse.from_database_with_pct_change(
                    DatabaseStream(
                        track_id=row["track_id"],
                        album_id=row["album_id"],
                        play_count=row["play_count"] or 0,
                        timestamp=row["stream_recorded_at"] or datetime.now(),
                    ),
                    DatabaseTrack(
                        track_id=row["track_id"],
                        track_name=row["track_name"],
                        album_id=row["album_id"],
                    ),
                    DatabaseAlbum(
                        album_id=row["album_id"],
                        name=row["album_name"],
                        artist_name=row["artist_name"],
                        cover_art=row["cover_art"],
                        release_date=row["release_date"],
                    ),
                    pct_change=row["pct_change"] or 0.0,
                    time_period=time_period,
                )
                for row in results
            ]
