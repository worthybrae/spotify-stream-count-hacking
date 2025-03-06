# routes/auth.py
from fastapi import APIRouter, HTTPException, Request, Depends, Header, Query
from services.auth import ApiKeyService
from fastapi.security.api_key import APIKeyHeader
import traceback
from typing import Optional
from pydantic import BaseModel
from config import settings

router = APIRouter()
API_KEY_HEADER = APIKeyHeader(name="X-API-Key")

# Define request model for creating API keys
class ApiKeyRequest(BaseModel):
    client_ip: Optional[str] = None

def get_client_ip(request: Request) -> str:
    """
    Extract client IP address from request, handling proxy forwarding
    """
    # Try to get IP from headers first (for proxied environments)
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        client_ip = forwarded_for.split(',')[0].strip()
        print(f"Using X-Forwarded-For IP: {client_ip}")
        return client_ip
        
    # Fall back to request.client.host
    client_ip = request.client.host
    print(f"Using request client host: {client_ip}")
    return client_ip

@router.post("/api-keys", status_code=201)
async def create_api_key(request: Request, api_key_request: ApiKeyRequest = None):
    """Create a new API key for the specified IP address or requesting IP"""
    try:
        # Get client IP - simplify this logic
        client_ip = None
        
        # If IP was provided in the request, use that
        if api_key_request and api_key_request.client_ip:
            client_ip = api_key_request.client_ip
            print(f"Using provided client IP from request body: {client_ip}")
        else:
            # Otherwise get it from the request headers/client
            client_ip = get_client_ip(request)
        
        print(f"Creating API key for IP: {client_ip}")
        
        # Check if IP already has an API key
        existing_key = await ApiKeyService.get_api_key_for_ip(client_ip)
        if existing_key:
            print(f"IP {client_ip} already has an API key, returning existing key")
            return existing_key
        
        # Create new key
        api_key_data = await ApiKeyService.create_api_key(client_ip)
        print(f"Created new API key for IP: {client_ip}")
        return api_key_data
    except Exception as e:
        err_trace = traceback.format_exc()
        print(f"Error creating API key: {err_trace}")
        raise HTTPException(status_code=500, detail=f"Failed to create API key: {str(e)}")

@router.get("/api-keys/info")
async def get_api_key_info(
    request: Request, 
    client_ip: Optional[str] = Query(None, description="Optional client IP to lookup")
):
    """Get info about the API key for the specified IP address or requesting IP"""
    try:
        # Use the utility function to get client IP
        ip_to_use = client_ip or get_client_ip(request)
        
        print(f"Getting API key info for IP: {ip_to_use}")
        
        api_key_info = await ApiKeyService.get_api_key_for_ip(ip_to_use)
        
        if not api_key_info:
            print(f"No API key found for IP: {ip_to_use}")
            raise HTTPException(status_code=404, detail="No API key found for this IP address")
        
        print(f"Found API key for IP: {ip_to_use}")
        
        # Get recent requests for this IP (past hour)
        recent_requests = await ApiKeyService.get_recent_requests(ip_to_use, minutes=60)
        print(f"Retrieved {len(recent_requests)} recent requests for IP: {ip_to_use}")
        
        # Include request data with the API key info
        api_key_info['requests'] = recent_requests
        
        return api_key_info
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        err_trace = traceback.format_exc()
        print(f"Error fetching API key info: {err_trace}")
        raise HTTPException(status_code=500, detail=f"Failed to get API key info: {str(e)}")

@router.get("/test-key")
async def test_api_key(request: Request, api_key: str = Depends(API_KEY_HEADER)):
    """
    Test endpoint to verify API key is working properly.
    Returns information about the key and its rate limit status.
    """
    # Get client IP using the utility function
    ip_to_use = get_client_ip(request)
    endpoint = "/auth/test-key"
    
    # Log the request
    await ApiKeyService.log_request(ip_to_use, api_key, endpoint)
    
    # Validate API key
    is_valid = await ApiKeyService.validate_api_key(api_key, ip_to_use)
    if not is_valid:
        print(f"Test endpoint: Invalid API key: {api_key} for IP: {ip_to_use}")
        raise HTTPException(status_code=403, detail="Invalid API key for this IP address")
    
    # Get request count for rate limiting
    request_count = await ApiKeyService.get_request_count(ip_to_use, api_key, minutes=60)
    
    # Check if this is the admin API key
    admin_key = getattr(settings, 'API_KEY', None)
    is_admin_key = admin_key and api_key == admin_key
    
    return {
        "status": "success",
        "message": "API key is valid",
        "ip_address": ip_to_use,
        "requests_last_hour": request_count,
        "is_admin_key": is_admin_key,
        "rate_limit": "unlimited" if is_admin_key else "10 requests per hour",
        "remaining_requests": "unlimited" if is_admin_key else max(0, 10 - request_count)
    }