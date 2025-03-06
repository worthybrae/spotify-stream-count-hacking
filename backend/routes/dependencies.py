# routes/dependencies.py
from fastapi import Request, Depends, HTTPException
from fastapi.security.api_key import APIKeyHeader
from services.unofficial_spotify import TokenManager, UnofficialSpotifyService
from services.official_spotify import OfficialSpotifyService
from services.database import DatabaseService
from services.auth import ApiKeyService
from config import settings
import traceback

# Initialize clients
token_manager = TokenManager()
unofficial_spotify = UnofficialSpotifyService(token_manager)
official_spotify = OfficialSpotifyService()
db_service = DatabaseService()

API_KEY_HEADER = APIKeyHeader(name="X-API-Key")

def get_client_ip(request: Request) -> str:
    """
    Extract client IP address from request, handling proxy forwarding
    """
    # Try to get IP from headers first (for proxied environments)
    forwarded_for = request.headers.get('X-Forwarded-For')
    if forwarded_for:
        # Take the first IP in the chain
        client_ip = forwarded_for.split(',')[0].strip()
        print(f"Using X-Forwarded-For IP: {client_ip}")
        return client_ip
        
    # Fall back to request.client.host
    client_ip = request.client.host
    print(f"Using request client host: {client_ip}")
    return client_ip

async def verify_api_key(request: Request, api_key: str = Depends(API_KEY_HEADER)):
    """
    Dependency for verifying API key in protected routes.
    Also logs requests and enforces rate limiting.
    """
    try:
        # Get client IP (handle proxy forwarding if present)
        client_ip = get_client_ip(request)
        endpoint = request.url.path
        
        print(f"Verifying API key for IP: {client_ip}, endpoint: {endpoint}")
        print(f"Received API key: {api_key}")
        
        # IMPORTANT: First check if this is the admin API key
        # Skip database validation for admin key
        if api_key == settings.API_KEY:
            print(f"✅ Admin key validation passed for endpoint: {endpoint}")
            try:
                # Still try to log the request, but don't fail if it doesn't work
                await ApiKeyService.log_request(client_ip, api_key, endpoint)
            except Exception as log_error:
                print(f"Warning: Failed to log request: {str(log_error)}")
            
            # Allow the request to proceed
            return api_key
            
        # For regular API keys, validate against database
        try:
            # Try to log the request
            await ApiKeyService.log_request(client_ip, api_key, endpoint)
        except Exception as log_error:
            print(f"Warning: Failed to log request: {str(log_error)}")
        
        # First get the API key for this IP to make debugging easier
        ip_key_info = await ApiKeyService.get_api_key_for_ip(client_ip)
        if ip_key_info:
            print(f"Found stored API key for IP {client_ip}: {ip_key_info['api_key']}")
            if ip_key_info['api_key'] != api_key:
                print(f"❌ API key mismatch: Provided {api_key} != Stored {ip_key_info['api_key']}")
        else:
            print(f"❌ No API key found for IP: {client_ip}")
        
        # Validate API key
        is_valid = await ApiKeyService.validate_api_key(api_key, client_ip)
        
        if not is_valid:
            print(f"❌ Invalid API key: {api_key} for IP: {client_ip}")
            raise HTTPException(status_code=403, detail="Invalid API key")
        
        # Get request count for rate limiting
        try:
            request_count = await ApiKeyService.get_request_count(client_ip, api_key, minutes=60)
            print(f"Request count for IP {client_ip}: {request_count}/10 in the last hour")
            
            # Rate limit: 10 requests per hour for regular users
            if request_count > 10:
                print(f"❌ Rate limit exceeded for IP: {client_ip}, count: {request_count}")
                raise HTTPException(status_code=429, detail="Rate limit exceeded (10 requests per hour)")
        except Exception as rate_error:
            print(f"Warning: Failed to check rate limits: {str(rate_error)}")
        
        return api_key
        
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        # Log any other errors
        print(f"❌ Error in API key verification: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail="API key verification failed")

# Services dependencies to be used in routes
def get_spotify_services():
    """
    Returns initialized Spotify API services
    """
    return {
        "unofficial": unofficial_spotify,
        "official": official_spotify
    }

def get_database_service():
    """
    Returns the database service instance
    """
    return db_service