# scripts/check_new_releases.py
import asyncio
from backend.official_spotify import SpotifyOfficial
from backend.db import save_album
from backend.config import settings
from datetime import datetime

async def main():
    spotify = SpotifyOfficial()
    # Get new releases using the async method
    new_releases = await spotify.get_new_releases(limit=50)
    
    for album in new_releases:
        await save_album(
            album_id=album['id'],
            artist_id=album['artists'][0]['id'],
            name=album['name'],
            cover_art=album['images'][0]['url'],
            release_date=datetime.strptime(album['release_date'], '%Y-%m-%d')
        )

if __name__ == "__main__":
    asyncio.run(main())