# services/auth.py
from datetime import datetime
import secrets
import string
from typing import Optional, List, Dict
from services.database import get_db
from config import settings  # Import settings to access API_KEY env var
import traceback

class ApiKeyService:
    """Service for managing API keys and request logging"""
    
    @staticmethod
    def generate_api_key(length: int = 32) -> str:
        """Generate a secure random API key"""
        alphabet = string.ascii_letters + string.digits
        return ''.join(secrets.choice(alphabet) for _ in range(length))
    
    @staticmethod
    async def create_api_key(ip_address: str) -> Dict:
        """Create a new API key for the given IP address"""
        api_key = ApiKeyService.generate_api_key()
        
        try:
            async with get_db() as conn:
                # Check if IP already has an active key
                existing = await conn.fetchrow(
                    "SELECT api_key FROM api_keys WHERE ip_address = $1 AND is_active = true",
                    ip_address
                )
                
                if existing:
                    # If IP already has an active key, return it instead of creating a new one
                    api_key_info = await ApiKeyService.get_api_key_for_ip(ip_address)
                    return api_key_info
                
                # First, deactivate any existing keys for this IP
                await conn.execute(
                    """
                    UPDATE api_keys
                    SET is_active = false
                    WHERE ip_address = $1
                    """,
                    ip_address
                )
                
                # Create new key
                created_at = datetime.now()
                await conn.execute(
                    """
                    INSERT INTO api_keys (api_key, ip_address, created_at, is_active) 
                    VALUES ($1, $2, $3, $4)
                    """,
                    api_key, ip_address, created_at, True
                )
                
                return {
                    "api_key": api_key,
                    "ip_address": ip_address,
                    "created_at": created_at,
                    "is_active": True
                }
        except Exception as e:
            print(f"Error creating API key: {str(e)}")
            print(traceback.format_exc())
            raise
    
    @staticmethod
    async def regenerate_api_key(ip_address: str) -> Dict:
        """
        Regenerate an API key for the given IP address.
        Deactivates any existing keys and creates a new one.
        
        Args:
            ip_address: The IP address to create a new key for
            
        Returns:
            Dict with the new API key info
        """
        try:
            async with get_db() as conn:
                # First deactivate all existing keys for this IP
                await conn.execute(
                    """
                    UPDATE api_keys
                    SET is_active = false
                    WHERE ip_address = $1
                    """,
                    ip_address
                )
                
                # Generate a new API key
                api_key = ApiKeyService.generate_api_key()
                created_at = datetime.now()
                
                # Create new key
                await conn.execute(
                    """
                    INSERT INTO api_keys (api_key, ip_address, created_at, is_active) 
                    VALUES ($1, $2, $3, $4)
                    """,
                    api_key, ip_address, created_at, True
                )
                
                # Return the new key info
                return {
                    "api_key": api_key,
                    "ip_address": ip_address,
                    "created_at": created_at,
                    "is_active": True
                }
        except Exception as e:
            print(f"Error regenerating API key: {str(e)}")
            print(traceback.format_exc())
            raise
    
    @staticmethod
    async def deactivate_api_keys_for_ip(ip_address: str) -> int:
        """
        Deactivate all API keys for an IP address
        
        Args:
            ip_address: The IP address to deactivate keys for
            
        Returns:
            Number of keys deactivated
        """
        try:
            async with get_db() as conn:
                print(f"Deactivating API keys for IP: {ip_address}")
                
                result = await conn.execute(
                    """
                    UPDATE api_keys
                    SET is_active = false
                    WHERE ip_address = $1 AND is_active = true
                    """,
                    ip_address
                )
                
                # Extract the number of rows updated
                # The format is typically like "UPDATE 3"
                try:
                    # Get the number of rows updated from the string
                    rows_updated = int(result.split()[1]) if result and ' ' in result else 0
                    print(f"Deactivated {rows_updated} API keys for IP: {ip_address}")
                    return rows_updated
                except (IndexError, ValueError):
                    print(f"Could not parse result: {result}")
                    # If we can't parse the result, try to count the rows manually
                    count = await conn.fetchval(
                        "SELECT COUNT(*) FROM api_keys WHERE ip_address = $1 AND is_active = false",
                        ip_address
                    )
                    return count or 0
                
        except Exception as e:
            print(f"Error deactivating API keys: {str(e)}")
            print(traceback.format_exc())
            return 0
    
    @staticmethod
    async def get_api_key_for_ip(ip_address: str) -> Optional[Dict]:
        """Get the active API key for an IP address"""
        try:
            async with get_db() as conn:
                # Debug log
                print(f"Looking up API key for IP: {ip_address}")
                
                result = await conn.fetchrow(
                    """
                    SELECT api_key, ip_address, created_at, is_active
                    FROM api_keys 
                    WHERE ip_address = $1 AND is_active = true
                    ORDER BY created_at DESC
                    LIMIT 1
                    """,
                    ip_address
                )
                
                if result:
                    print(f"Found API key for IP: {ip_address}")
                    return dict(result)
                
                print(f"No API key found for IP: {ip_address}")
                return None
        except Exception as e:
            print(f"Error getting API key for IP: {str(e)}")
            print(traceback.format_exc())
            return None
    
    @staticmethod
    async def validate_api_key(api_key: str, ip_address: str) -> bool:
        """Validate if an API key is valid and active"""
        try:
            # Debug logging for key validation
            print(f"Validating API key: '{api_key}' for IP: '{ip_address}'")
            
            # Special case: if the API key matches the admin key from env vars, always allow it
            if api_key == settings.API_KEY:
                print(f"✅ Admin API key matched successfully")
                return True
                
            # For regular API keys, check the database
            async with get_db() as conn:
                result = await conn.fetchrow(
                    """
                    SELECT is_active FROM api_keys 
                    WHERE api_key = $1 AND ip_address = $2
                    """,
                    api_key, ip_address
                )
                
                is_valid = result and result['is_active']
                if is_valid:
                    print(f"✅ User API key validated successfully for IP: {ip_address}")
                else:
                    # Extra debugging for invalid keys
                    # Check if the key exists at all
                    key_exists = await conn.fetchrow(
                        "SELECT ip_address FROM api_keys WHERE api_key = $1",
                        api_key
                    )
                    
                    if key_exists:
                        wrong_ip = key_exists['ip_address']
                        print(f"❌ API key exists but is registered to different IP: {wrong_ip}")
                    else:
                        print(f"❌ API key does not exist in database")
                
                return is_valid
                    
        except Exception as e:
            print(f"❌ Error validating API key: {str(e)}")
            print(traceback.format_exc())
            # Return False for safety in case of errors
            return False
    
    @staticmethod
    async def log_request(ip_address: str, api_key: Optional[str] = None, endpoint: Optional[str] = None) -> None:
        """Log an API request"""
        try:
            async with get_db() as conn:
                await conn.execute(
                    """
                    INSERT INTO request_logs (ip_address, api_key, endpoint)
                    VALUES ($1, $2, $3)
                    """,
                    ip_address, api_key, endpoint
                )
        except Exception as e:
            print(f"Error logging API request: {str(e)}")
            print(traceback.format_exc())
            # Don't raise to prevent failed logging from breaking the API
    
    @staticmethod
    async def get_request_count(ip_address: str, api_key: str, minutes: int = 60) -> int:
        try:
            # Skip counting for admin key
            admin_key = getattr(settings, 'API_KEY', None)
            if admin_key and api_key == admin_key:
                return 0
                
            async with get_db() as conn:
                # Only count requests to specific protected endpoints
                # or endpoints that start with /albums/, /streams/, etc.
                result = await conn.fetchrow(
                    """SELECT COUNT(*) as count FROM request_logs 
                    WHERE ip_address = $1 
                    AND timestamp > now() - INTERVAL '60 minutes'
                    AND (endpoint LIKE '/albums/%' OR endpoint LIKE '/streams/%')
                    """,
                    ip_address
                )
                
                return result['count'] if result else 0
        except Exception as e:
            print(f"Error getting request count: {str(e)}")
            return 0
    
    @staticmethod
    async def get_recent_requests(ip_address: str, minutes: int = 60) -> List[Dict]:
        """Get recent requests from an IP address in the past X minutes"""
        try:
            async with get_db() as conn:
                # Fix: use a proper interval expression
                results = await conn.fetch(
                    "SELECT endpoint, timestamp FROM request_logs WHERE ip_address = $1 AND timestamp > now() - INTERVAL '" + str(minutes) + " minutes' ORDER BY timestamp DESC LIMIT 20",
                    ip_address
                )
                
                return [dict(row) for row in results]
        except Exception as e:
            print(f"Error getting recent requests: {str(e)}")
            print(traceback.format_exc())
            return []