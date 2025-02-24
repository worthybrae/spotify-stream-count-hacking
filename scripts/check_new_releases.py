import asyncio
from backend.official_spotify import SpotifyOfficial
from backend.db import save_album
from backend.config import settings

async def main():
    spotify = SpotifyOfficial()
    # Get new releases using the async method
    new_releases = await spotify.get_new_releases(limit=50)
    
    for album in new_releases:
        # Access the fields as attributes since it's a Pydantic model
        await save_album(
            album_id=album.album_id,
            artist_id=album.artist_id,
            name=album.album_name,
            cover_art=album.cover_art,
            release_date=album.release_date
        )
        print(f"Saved album: {album.album_name} by {album.artist_name}")

if __name__ == "__main__":
    asyncio.run(main())