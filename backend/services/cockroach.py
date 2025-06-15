# services/cockroach.py
from contextlib import asynccontextmanager
from datetime import datetime
from typing import Dict, List

import asyncpg
from config import settings
from models import DatabaseAlbum, DatabaseStream, DatabaseTrack, StreamResponse


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
        async with get_db() as conn:
            async with conn.transaction():
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

    # 2. Insert Track query
    async def insert_track(self, track: DatabaseTrack):
        """Insert track using the provided template"""
        async with get_db() as conn:
            async with conn.transaction():
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

    # 3. Insert Stream query
    async def insert_stream(self, stream: DatabaseStream):
        """Insert stream using the provided template"""
        async with get_db() as conn:
            async with conn.transaction():
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
    async def fetch_album_data(self, album_id: str) -> List[StreamResponse]:
        """Fetch album data using the provided template"""
        async with get_db() as conn:
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

            # Then get all tracks and their stream counts from the past week
            results = await conn.fetch(
                """
                SELECT
                    t.track_id,
                    t.name as track_name,
                    t.album_id,
                    s.play_count,
                    s.timestamp
                FROM tracks t
                LEFT JOIN streams s ON s.track_id = t.track_id
                WHERE t.album_id = $1
                AND (s.timestamp IS NULL OR s.timestamp >= CURRENT_DATE - INTERVAL '7 days')
                ORDER BY t.track_id, s.timestamp DESC
                """,
                album_id,
            )

            # Create StreamResponse objects for each stream record
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
                    timestamp=r["timestamp"] or datetime.now(),
                )
                streams.append(StreamResponse.from_database(stream, track, album))

            return streams

    # Composite operations using the individual query templates
    async def save_complete_album(self, streams: List[StreamResponse]) -> Dict:
        """Save a complete album with its tracks and stream counts using the provided templates"""
        if not streams:
            return {"status": "error", "message": "No streams to save"}

        async with get_db() as conn:
            async with conn.transaction():
                # Insert album
                album = DatabaseAlbum(
                    album_id=streams[0].album_id,
                    name=streams[0].album_name,
                    artist_name=streams[0].artist_name,
                    cover_art=streams[0].cover_art,
                    release_date=datetime.strptime(
                        streams[0].timestamp.split("T")[0], "%Y-%m-%d"
                    ).date(),
                )
                await self.insert_album(album)

                # Insert tracks and streams
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

                return {
                    "album_id": streams[0].album_id,
                    "tracks_saved": len(streams),
                    "streams_saved": len(streams),
                }

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

    async def fetch_top_tracks(self) -> List[StreamResponse]:
        async with get_db() as conn:
            results = await conn.fetch(
                """
                with starting_streams as (
                    select
                        album_id,
                        track_id,
                        timestamp::date as stream_recorded_at,
                        max(play_count) as daily_play_count
                    from
                        streams
                    where
                        timestamp between CURRENT_DATE - interval '7 days' and CURRENT_DATE and
                        play_count > 0
                    group by
                        album_id,
                        track_id,
                        stream_recorded_at
                ), enriched_streams as (
                    select
                        *,
                        min(daily_play_count) over (partition by album_id, track_id) as start_streams,
                        max(daily_play_count) over (partition by album_id, track_id) as end_streams
                    from
                        starting_streams
                ), top_streams as (
                    select
                        album_id,
                        track_id,
                        max(end_streams) / max(start_streams) - 1 as pct_change
                    from
                        enriched_streams
                    group by
                        album_id,
                        track_id
                    order by
                        pct_change desc
                    limit
                        5
                )
                select
                    t.name as track_name,
                    ss.album_id,
                    ss.track_id,
                    ss.stream_recorded_at,
                    ss.daily_play_count as play_count,
                    a.name as album_name,
                    a.cover_art,
                    a.release_date,
                    a.artist_name
                from
                    starting_streams ss
                left join
                    albums a
                on
                    a.album_id = ss.album_id
                left join
                    tracks t
                on t.track_id = ss.track_id
                where
                    ss.track_id in (select track_id from top_streams);
                """
            )
            return [
                StreamResponse.from_database(
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
                )
                for row in results
            ]
