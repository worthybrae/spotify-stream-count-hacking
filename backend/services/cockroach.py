# services/cockroach.py
from contextlib import asynccontextmanager
from datetime import datetime
from typing import Dict, List

import asyncpg
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
    Service class for database operations using provided query templates
    """

    # 1. Insert Album query
    async def insert_album(
        self,
        conn,
        album_id: str,
        artist_id: str,
        name: str,
        cover_art: str,
        release_date: datetime,
        artist_name: str,
    ):
        """Insert album using the provided template"""
        await conn.execute(
            """
            INSERT INTO albums (
                album_id,
                artist_id,
                name,
                cover_art,
                release_date,
                artist_name
            )
            VALUES (
                $1,
                $2,
                $3,
                $4,
                $5,
                $6
            )
            ON CONFLICT (
                album_id
            )
            DO UPDATE SET
                artist_id = $2,
                name = $3,
                cover_art = $4,
                release_date = $5,
                artist_name = $6
        """,
            album_id,
            artist_id,
            name,
            cover_art,
            release_date,
            artist_name,
        )

    # 2. Insert Track query
    async def insert_track(
        self, conn, track_id: str, name: str, artist_id: str, album_id: str
    ):
        """Insert track using the provided template"""
        await conn.execute(
            """
            INSERT INTO tracks (
                track_id,
                name,
                artist_id,
                album_id
            )
            VALUES (
                $1,
                $2,
                $3,
                $4
            )
            ON CONFLICT (
                track_id
            )
            DO UPDATE
            SET
                name = $2,
                artist_id = $3,
                album_id = $4
        """,
            track_id,
            name,
            artist_id,
            album_id,
        )

    # 3. Insert Stream query
    async def insert_stream(self, conn, track_id: str, play_count: int, album_id: str):
        """Insert stream using the provided template"""
        await conn.execute(
            """
            INSERT INTO streams (
                track_id,
                play_count,
                album_id
            )
            VALUES (
                $1,
                $2,
                $3
            )
            ON CONFLICT (
                track_id,
                play_count,
                album_id
            )
            DO NOTHING
        """,
            track_id,
            play_count,
            album_id,
        )

    # 4. Insert User Top Track query
    async def insert_user_top_track(
        self, conn, user_id: str, track_id: str, position: int
    ):
        """Insert user top track using the provided template"""
        await conn.execute(
            """
            INSERT INTO user_top_tracks (
                user_id,
                track_id,
                position
            )
            VALUES (
                $1,
                $2,
                $3
            )
        """,
            user_id,
            track_id,
            position,
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
    async def search_albums(self, query: str, limit: int = 10) -> List[Dict]:
        """Search albums using the provided template"""
        async with get_db() as conn:
            results = await conn.fetch(
                """
                SELECT album_id,
                       artist_name,
                       name AS album_name,
                       cover_art,
                       release_date
                FROM   albums
                WHERE  name LIKE $1
                LIMIT  $2
            """,
                f"%{query}%",
                limit,
            )

            return [dict(r) for r in results]

    # 7. Fetch Album Data query
    async def fetch_album_data(self, album_id: str) -> List[Dict]:
        """Fetch album data using the provided template"""
        async with get_db() as conn:
            results = await conn.fetch(
                """
                SELECT s.timestamp :: DATE as stream_recorded_at,
                       t.name            AS track_name,
                       a.name            AS album_name,
                       a.cover_art,
                       a.release_date,
                       a.artist_name,
                       max(s.play_count) AS play_count
                FROM   streams s
                       left join tracks t
                              ON t.track_id = s.track_id
                       left join albums a
                              ON a.album_id = t.album_id
                WHERE  s.album_id = $1
                       AND t.album_id = $1
                       AND a.album_id = $1
                GROUP  BY 1,
                          2,
                          3,
                          4,
                          5,
                          6
                ORDER  BY 3,
                          2,
                          1
            """,
                album_id,
            )

            return [dict(r) for r in results]

    # 8. Fetch User Profile query
    async def fetch_user_profile(self, user_id: str) -> List[Dict]:
        """Fetch user profile using the provided template"""
        async with get_db() as conn:
            results = await conn.fetch(
                """
                with top_tracks as (
                    select
                        track_id,
                        position,
                        created_at::date as top_track_at,
                        min(created_at::date) over (partition by track_id) as first_added_at
                    from
                        user_top_tracks
                    where
                        user_id = $1
                ), enriched_tracks as (
                    select
                        s.timestamp::date as stream_recorded_at,
                        t.name as track_name,
                        t.track_id,
                        a.name as album_name,
                        a.cover_art,
                        a.release_date,
                        a.artist_name,
                        max(s.play_count) AS play_count
                    from
                        streams s
                    left join
                        tracks t
                    on
                        s.track_id = t.track_id
                    left join
                        albums a
                    on
                        t.album_id = a.album_id
                    where
                        s.track_id in (select distinct track_id from top_tracks) and
                        t.track_id in (select distinct track_id from top_tracks)
                    group by
                        1,
                        2,
                        3,
                        4,
                        5,
                        6,
                        7
                )
                select
                    et.album_name,
                    et.artist_name,
                    et.track_name,
                    et.play_count,
                    tt.position,
                    et.cover_art,
                    et.release_date,
                    tt.top_track_at,
                    tt.first_added_at,
                    et.stream_recorded_at
                from
                    enriched_tracks et
                left join
                    top_tracks tt
                on
                    et.track_id = tt.track_id and
                    et.stream_recorded_at = tt.top_track_at
            """,
                user_id,
            )

            return [dict(r) for r in results]

    # Composite operations using the individual query templates

    async def save_complete_album(
        self, album_data: Dict, tracks_data: List[Dict], stream_data: List[Dict]
    ) -> Dict:
        """Save a complete album with its tracks and stream counts using the provided templates"""
        async with get_db() as conn:
            async with conn.transaction():
                # Insert album using template
                await self.insert_album(
                    conn,
                    album_data["album_id"],
                    album_data["artist_id"],
                    album_data["album_name"],
                    album_data.get("cover_art", ""),
                    album_data["release_date"],
                    album_data["artist_name"],
                )

                # Insert tracks using template
                for track in tracks_data:
                    await self.insert_track(
                        conn,
                        track["track_id"],
                        track["name"],
                        album_data["artist_id"],
                        album_data["album_id"],
                    )

                # Insert streams using template
                for stream in stream_data:
                    await self.insert_stream(
                        conn,
                        stream["track_id"],
                        stream["play_count"],
                        album_data["album_id"],
                    )

                return {
                    "album_id": album_data["album_id"],
                    "artist_id": album_data["artist_id"],
                    "tracks_count": len(tracks_data),
                    "streams_count": len(stream_data),
                }

    async def save_user_top_tracks(self, user_id: str, tracks_data: List[Dict]) -> Dict:
        """Save a user's top tracks using the provided templates"""
        if not tracks_data:
            return {"tracks_saved": 0, "albums_to_fetch": []}

        # Collect album IDs to check which need to be fetched
        album_ids_to_check = []

        async with get_db() as conn:
            # Insert user top tracks using template
            for track in tracks_data:
                await self.insert_user_top_track(
                    conn, user_id, track["track_id"], track["position"]
                )

                # Add album ID to check list if available
                if "album_id" in track and track["album_id"]:
                    album_ids_to_check.append(track["album_id"])

        # Check which albums don't exist
        albums_to_fetch = []
        for album_id in set(album_ids_to_check):
            exists = await self.check_album_exists(album_id)
            if not exists:
                albums_to_fetch.append(album_id)

        return {"tracks_saved": len(tracks_data), "albums_to_fetch": albums_to_fetch}

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
