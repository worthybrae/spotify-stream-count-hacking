# backend/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from contextlib import asynccontextmanager
import asyncio
import traceback
from datetime import datetime
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.middleware.trustedhost import TrustedHostMiddleware

# Import routes
from routes.albums import router as albums_router
from routes.search import router as search_router
from routes.streams import router as streams_router
from routes.auth import router as auth_router

# Import the process_albums function from update_streams service
from services.update_streams import process_albums

# Define the scheduled task function
async def update_stream_counts():
    print(f"Starting scheduled stream count update at {datetime.now()}")
    try:
        result = await process_albums()
        print(f"Completed scheduled stream count update at {datetime.now()}")
        print(f"Stats: {result}")
        return result
    except Exception as e:
        error_details = traceback.format_exc()
        print(f"Error in scheduled stream count update: {str(e)}")
        print(f"Detailed error: {error_details}")
        return {"status": "error", "error": str(e)}

# Non-async wrapper function for the scheduler
def run_update_stream_counts():
    """
    Creates a new event loop to run our async function in a synchronous context.
    This is needed because APScheduler doesn't natively support coroutines.
    """
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        return loop.run_until_complete(update_stream_counts())
    finally:
        loop.close()

# Set up the scheduler
scheduler = BackgroundScheduler()
# Run at 10PM UTC (5PM EST) to match your GitHub Actions schedule
trigger = CronTrigger(hour=22, minute=0)
# Use the non-async wrapper instead of the coroutine directly
scheduler.add_job(run_update_stream_counts, trigger, id='update_stream_counts')

# Define the lifespan context manager for FastAPI
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Start the scheduler when the app starts
    print(f"Starting scheduler at {datetime.now()}")
    scheduler.start()
    yield
    # Shut down the scheduler when the app stops
    print(f"Shutting down scheduler at {datetime.now()}")
    scheduler.shutdown()

# Create the FastAPI app with the lifespan
app = FastAPI(
    title="Spotify Analytics API", 
    description="API for tracking Spotify album and track stream counts over time",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "https://streamclout.io", "*"],  # Update with your frontend URL in production
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

app.add_middleware(
    TrustedHostMiddleware, 
    allowed_hosts=["*"] 
)

class ProxyHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        # Get the IP from X-Forwarded-For, X-Real-IP, etc.
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            # Log forwarded IP for debugging
            print(f"Original client host: {request.client.host}")
            print(f"Forwarded for: {forwarded_for}")
        
        response = await call_next(request)
        return response

app.add_middleware(ProxyHeadersMiddleware)

# Include routers
app.include_router(albums_router, prefix="/albums", tags=["Albums"])
app.include_router(search_router, prefix="/search", tags=["Search"])
app.include_router(streams_router, prefix="/streams", tags=["Streams"])
app.include_router(auth_router, prefix="/auth", tags=["Auth"])

# Add a simple health check endpoint
@app.get("/", tags=["Health"])
async def health_check():
    return {
        "status": "healthy", 
        "service": "Spotify Analytics API",
        "version": "1.0.0"
    }

# Manual trigger endpoint for the scheduled task
@app.post("/admin/trigger-update", tags=["Admin"])
async def trigger_update():
    """
    Manually trigger the stream count update job.
    Requires API key authentication (handled in the router).
    """
    try:
        # Create a background task to run the update
        task = asyncio.create_task(update_stream_counts())
        return {
            "status": "update triggered", 
            "timestamp": datetime.now().isoformat(),
            "message": "Update is running in the background"
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}

# Add an endpoint to check the status of the last update
@app.get("/admin/last-update", tags=["Admin"])
async def get_last_update():
    """
    Get information about the last update run.
    """
    # In a production system, you'd store this in the database
    # For now, just get the next run time from the scheduler
    job = scheduler.get_job('update_stream_counts')
    next_run = job.next_run_time if job else None
    
    return {
        "next_scheduled_update": next_run.isoformat() if next_run else None,
        "scheduler_running": scheduler.running
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)