# routes/streams.py
from fastapi import APIRouter, HTTPException, Depends
import traceback

from models import StreamsAddRequest
from services.database import get_db
from routes.dependencies import verify_api_key, get_database_service

router = APIRouter()

@router.post("/", status_code=201)
async def add_streams(
    data: StreamsAddRequest,
    _: str = Depends(verify_api_key)
):
    """
    Add new stream counts for tracks in an album.
    """
    try:
        # Get services
        db_service = get_database_service()
        
        async with get_db() as conn:
            # Prepare streams data
            stream_data = [
                {
                    "track_id": stream.track_id,
                    "play_count": stream.playcount,
                    "album_id": data.album_id
                } for stream in data.streams
            ]
            
            # Save streams
            count = await db_service.batch_save_stream_counts(conn, stream_data)
            
            return {
                "status": "success",
                "message": f"Added {count} stream records for album {data.album_id}",
                "count": count
            }
    
    except Exception as e:
        err_trace = traceback.format_exc()
        print(f"Error adding streams: {err_trace}")
        raise HTTPException(status_code=500, detail=f"Failed to add streams: {str(e)}")

@router.get("/track/{track_id}")
async def get_track_streams(
    track_id: str,
    limit: int = 30,
    _: str = Depends(verify_api_key)
):
    """
    Get a track's stream count history
    """
    try:
        # Get services
        db_service = get_database_service()
        
        result = await db_service.get_track_with_stream_history(track_id, limit)
        if not result:
            raise HTTPException(status_code=404, detail=f"Track {track_id} not found")
        return result
    except HTTPException:
        raise
    except Exception as e:
        err_trace = traceback.format_exc()
        print(f"Error getting track stream history: {err_trace}")
        raise HTTPException(status_code=500, detail=f"Failed to get track stream history: {str(e)}")