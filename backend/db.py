# backend/db.py
import asyncpg
from contextlib import asynccontextmanager
from datetime import datetime
from backend.config import settings

@asynccontextmanager
async def get_db():
    conn = await asyncpg.connect(settings.DATABASE_URL)
    try:
        yield conn
    finally:
        await conn.close()

async def save_album(album_id: str, artist_id: str, name: str, 
                    cover_art: str, release_date: datetime):
    async with get_db() as conn:
        await conn.execute("""
            INSERT INTO albums (album_id, artist_id, name, cover_art, release_date)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (album_id) DO UPDATE 
            SET name = $3, cover_art = $4, release_date = $5
        """, album_id, artist_id, name, cover_art, release_date)

async def save_stream_count(track_id: str, play_count: int):
    async with get_db() as conn:
        await conn.execute("""
            INSERT INTO streams (track_id, play_count, timestamp)
            VALUES ($1, $2, $3)
        """, track_id, play_count, datetime.now())

async def get_track_history(track_id: str, limit: int = 30):
    try:
        async with get_db() as conn:
            results = await conn.fetch("""
                SELECT 
                    track_id as "track_id",
                    play_count as "playcount",
                    timestamp as "timestamp"
                FROM streams 
                WHERE track_id = $1 
                ORDER BY timestamp DESC 
                LIMIT $2
            """, track_id, limit)
            return [dict(r) for r in results] if results else []
    except Exception as e:
        print(f"Database error in get_track_history: {str(e)}")
        raise