# scripts/update_streams.py
import asyncio
from backend.unofficial_token_manager import TokenManager
from backend.unofficial_spotify import SpotifyPartner
from backend.db import save_stream_count, get_db
from backend.config import settings

async def main():
    token_manager = TokenManager()
    spotify = SpotifyPartner(token_manager)
    
    async with get_db() as conn:
        # Get all tracks from your DB
        tracks = await conn.fetch("SELECT track_id FROM tracks")
        
        for track in tracks:
            try:
                data = await spotify.get_track_info(track['track_id'])
                await save_stream_count(
                    track_id=track['track_id'],
                    play_count=data['playcount']
                )
            except Exception as e:
                print(f"Error processing track {track['track_id']}: {str(e)}")
                continue

if __name__ == "__main__":
    asyncio.run(main())