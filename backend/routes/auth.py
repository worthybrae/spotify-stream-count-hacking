# routes/auth.py
from fastapi import APIRouter, HTTPException, Request, Depends, Header, Query
from services.auth import ApiKeyService
from fastapi.security.api_key import APIKeyHeader
import traceback
from typing import Optional
from pydantic import BaseModel
from config import settings

router = APIRouter(include_in_schema=False)
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

@router.post("/api-keys/regenerate", status_code=201)
async def regenerate_api_key(request: Request, api_key_request: ApiKeyRequest = None):
    """Regenerate API key for an IP address (deactivates old key, creates new one)"""
    try:
        # Get client IP
        client_ip = None
        
        # If IP was provided in the request, use that
        if api_key_request and api_key_request.client_ip:
            client_ip = api_key_request.client_ip
            print(f"Using provided client IP from request body: {client_ip}")
        else:
            # Otherwise get it from the request headers/client
            client_ip = get_client_ip(request)
        
        print(f"Regenerating API key for IP: {client_ip}")
        
        # Use the simplified regenerate method
        api_key_data = await ApiKeyService.regenerate_api_key(client_ip)
        print(f"Regenerated API key for IP: {client_ip}")
        
        return api_key_data
    except Exception as e:
        err_trace = traceback.format_exc()
        print(f"Error regenerating API key: {err_trace}")
        raise HTTPException(status_code=500, detail=f"Failed to regenerate API key: {str(e)}")

@router.delete("/api-keys")
async def delete_api_key(
    request: Request, 
    client_ip: Optional[str] = Query(None, description="Optional client IP to delete key for")
):
    """Delete API key for an IP address"""
    try:
        # Get client IP
        ip_to_use = client_ip or get_client_ip(request)
        
        print(f"Deleting API key for IP: {ip_to_use}")
        
        # Deactivate all keys for this IP
        count = await ApiKeyService.deactivate_api_keys_for_ip(ip_to_use)
        
        if count == 0:
            print(f"No active API keys found for IP: {ip_to_use}")
            raise HTTPException(status_code=404, detail="No active API key found for this IP address")
        
        print(f"Deleted {count} API keys for IP: {ip_to_use}")
        
        return {"success": True, "message": f"Deleted {count} API keys for IP: {ip_to_use}"}
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        err_trace = traceback.format_exc()
        print(f"Error deleting API key: {err_trace}")
        raise HTTPException(status_code=500, detail=f"Failed to delete API key: {str(e)}")

@router.get("/api-keys/requests")
async def get_api_key_requests(
    request: Request, 
    client_ip: Optional[str] = Query(None, description="Optional client IP to get requests for")
):
    """Get only the request logs for an IP address (for refreshing request data)"""
    try:
        # Get client IP
        ip_to_use = client_ip or get_client_ip(request)
        
        print(f"Getting request logs for IP: {ip_to_use}")
        
        # Get recent requests for this IP (past hour)
        recent_requests = await ApiKeyService.get_recent_requests(ip_to_use, minutes=60)
        print(f"Retrieved {len(recent_requests)} recent requests for IP: {ip_to_use}")
        
        return {"requests": recent_requests}
    except Exception as e:
        err_trace = traceback.format_exc()
        print(f"Error fetching request logs: {err_trace}")
        raise HTTPException(status_code=500, detail=f"Failed to get request logs: {str(e)}")

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
