# backend/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.middleware.trustedhost import TrustedHostMiddleware

# Import routes
from routes.albums import router as albums_router
from routes.search import router as search_router
from routes.auth import router as auth_router

# Create the FastAPI app with the lifespan
app = FastAPI(
    title="streamclout.io api", 
    description="api to get historical Spotify streaming data for any album and track",
    version="1.0.0"
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
app.include_router(auth_router, prefix="/auth", tags=["Auth"])

# Add a simple health check endpoint
@app.get("/", tags=["Health"])
async def health_check():
    return {
        "status": "healthy", 
        "service": "streamclout.io api",
        "version": "1.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)