# services/supabase_service.py
from typing import Dict, Optional, Any
from datetime import datetime
from supabase import create_client
from config import settings


class SupabaseService:
    """
    Service for interacting with Supabase database
    to manage Users and Tokens tables for the Spotify API integration
    """
    
    def __init__(self):
        """Initialize the Supabase client with credentials from settings"""
        self.client = create_client(
            settings.SUPABASE_URL,
            settings.SUPABASE_KEY
        )
    
    async def insert_token(self, 
                         user_id: str,
                         access_token: str,
                         refresh_token: str,
                         expires_at: int) -> Dict:
        """
        Insert a new token into the Tokens table
        
        Args:
            user_id: The id from auth.users
            access_token: Spotify access token
            refresh_token: Spotify refresh token
            expires_at: Token expiration timestamp
            
        Returns:
            The inserted token data
        """
        try:
            token_data = {
                'user_id': user_id,
                'access_token': access_token,
                'refresh_token': refresh_token,
                'expires_at': expires_at,
                'created_at': datetime.now().isoformat()
            }
            
            response = self.client.table('Tokens') \
                .insert(token_data) \
                .execute()
                
            return response.data[0] if response.data else {}
        except Exception as e:
            print(f"Error inserting token: {str(e)}")
            raise
    
    async def get_latest_token(self, user_id: str) -> Optional[Dict]:
        """
        Get the latest token for a user
        
        Args:
            user_id: The id from auth.users
            
        Returns:
            Latest token data or None if not found
        """
        try:
            response = self.client.table('Tokens') \
                .select('*') \
                .eq('user_id', user_id) \
                .order('created_at', desc=True) \
                .limit(1) \
                .execute()
                
            return response.data[0] if response.data else None
        except Exception as e:
            print(f"Error getting latest token: {str(e)}")
            return None
    