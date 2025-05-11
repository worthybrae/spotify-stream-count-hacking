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
                return [album.model_dump() for album in db_results]

        # If we're forcing Spotify search or nothing was found in the database, search Spotify
        try:
            spotify_results = await official_spotify.search_albums(query, limit)
            return [album.model_dump() for album in spotify_results]

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


@router.get("/top-tracks")
async def top_tracks():
    """
    Search albums by name in database. If no results or force_spotify=True, search Spotify API.
    """
    try:
        # Get services
        db_service = get_database_service()

        # First search in database
        db_results = await db_service.fetch_top_tracks()

        return [stream.model_dump() for stream in db_results]
    except Exception as e:
        err_trace = traceback.format_exc()
        print(f"Error fetching top tracks: {err_trace}")
        raise HTTPException(
            status_code=500, detail=f"Failed to find top tracks: {str(e)}"
        )
