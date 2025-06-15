# backend/main.py
import os
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates

# Import routes
from routes.albums import router as albums_router
from routes.monitor import router as monitor_router
from routes.search import router as search_router
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.middleware.trustedhost import TrustedHostMiddleware

# Set up templates
templates_directory = Path(__file__).parent / "templates"
templates = Jinja2Templates(directory=str(templates_directory))

# Create templates directory if it doesn't exist
os.makedirs(str(templates_directory), exist_ok=True)

# Create the FastAPI app with the lifespan
app = FastAPI(
    title="StreamClout API",
    description="""
    API to get historical Spotify streaming data for any album and track.

    ## Example Usage
    ```bash
    curl http://localhost:8000/albums/6rqhFgbbKwnb9MLmUQDhG6
    ```

    ## Data Sources
    The API uses multiple data sources to provide comprehensive streaming data:
    1. Local Database (Primary source for historical data)
    2. Unofficial Spotify API (Secondary source for real-time data)
    3. Official Spotify API (Fallback source with limited data)
    """,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://streamclout.io",
        "*",
    ],  # Update with your frontend URL in production
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

app.add_middleware(TrustedHostMiddleware, allowed_hosts=["*"])


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
app.include_router(
    monitor_router, prefix="/monitor", tags=["Monitoring"], include_in_schema=False
)


# Update the health check endpoint to include service status and show dashboard
@app.get("/", response_class=HTMLResponse, tags=["Health"], include_in_schema=False)
async def health_check(request: Request):
    from services.monitor import monitor

    # Run a check of all services
    await monitor.check_all_services()

    # Get service status summary
    status_summary = monitor.get_status_summary()

    # Pass the data to the template
    return templates.TemplateResponse(
        "status.html",
        {
            "request": request,
            "api_name": "streamclout.io api",
            "version": "1.0.0",
            "status_data": status_summary,
        },
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
