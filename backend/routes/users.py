# routes/tracks.py
import traceback

from fastapi import APIRouter, HTTPException
from routes.dependencies import get_database_service

router = APIRouter()


@router.get("/{user_id}")
async def get_user_profile(user_id: str):
    """
    Get a user's top tracks with pagination.

    Args:
        user_id: User ID to get top tracks for
        access_token: Spotify access token
        force: If True, fetch from Spotify even if data exists in database
        limit: Maximum number of tracks to return (default: 50)
        offset: Number of tracks to skip for pagination (default: 0)

    Returns:
        Paginated list of user's top tracks with stream history
    """
    try:
        # Get services
        db_service = get_database_service()

        # Search in database with pagination
        db_results = await db_service.fetch_user_profile(user_id)

        # Return results
        return db_results

    except Exception as e:
        err_trace = traceback.format_exc()
        print(f"Error fetching top tracks: {err_trace}")
        raise HTTPException(
            status_code=500, detail=f"Failed to get top tracks: {str(e)}"
        )
