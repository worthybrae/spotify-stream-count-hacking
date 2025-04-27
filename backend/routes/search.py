# routes/search.py
import traceback

from fastapi import APIRouter, HTTPException, Query
from routes.dependencies import get_database_service, get_spotify_services

router = APIRouter()


@router.get("/albums")
async def search_albums(
    query: str = Query(..., min_length=1),
    limit: int = Query(default=10, le=50),
    force_spotify: bool = Query(
        False, description="Force search on Spotify even if results found in database"
    ),
):
    """
    Search albums by name in database. If no results or force_spotify=True, search Spotify API.
    """
    try:
        # Get services
        db_service = get_database_service()
        spotify_services = get_spotify_services()
        official_spotify = spotify_services["official"]

        # If not forcing Spotify, try database first
        if not force_spotify:
            # First search in database
            db_results = await db_service.search_albums(query)

            # If we have results, return them
            if db_results and len(db_results) > 0:
                return db_results

        # If we're forcing Spotify search or nothing was found in the database, search Spotify
        try:
            spotify_results = await official_spotify.search_albums(query, limit)

            # Convert to same format as db results
            return [
                {
                    "album_id": album.album_id,
                    "album_name": album.album_name,
                    "artist_name": album.artist_name,
                    "artist_id": album.artist_id,
                    "cover_art": album.cover_art,
                    "release_date": album.release_date,
                }
                for album in spotify_results
            ]
        except Exception as e:
            err_trace = traceback.format_exc()
            print(f"Error searching Spotify API: {err_trace}")
            raise HTTPException(
                status_code=500, detail=f"Failed to search Spotify API: {str(e)}"
            )

    except Exception as e:
        err_trace = traceback.format_exc()
        print(f"Error searching albums: {err_trace}")
        raise HTTPException(
            status_code=500, detail=f"Failed to search albums: {str(e)}"
        )
