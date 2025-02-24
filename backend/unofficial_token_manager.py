# backend/unofficial_token_manager.py
from typing import Tuple
import httpx
import json
import time
import platform
import uuid
import re
from fastapi import HTTPException

class TokenManager:
    def __init__(self):
        self.client_token = None
        self.bearer_token = None
        self.bearer_expiry = 0
        self.token_expiry = 0
        self.token_refresh = 0
        self.client = httpx.AsyncClient()
        
    def _generate_device_id(self) -> str:
        return uuid.uuid4().hex
    
    async def _fetch_bearer_token(self) -> Tuple[str, int]:
        """Fetch Bearer token from album page"""
        url = "https://open.spotify.com/album/0HFmXICO7WgVoqLAXc7Rhw"
        
        headers = {
            "accept": "text/html,application/xhtml+xml",
            "accept-language": "en-US,en;q=0.9",
            "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
        }
        
        try:
            response = await self.client.get(url, headers=headers)
            response.raise_for_status()
            
            session_match = re.search(r'<script id="session".*?({.*?})</script>', 
                                    response.text, re.DOTALL)
            if not session_match:
                raise ValueError("Could not find session data")
                
            session_data = json.loads(session_match.group(1))
            return (
                session_data["accessToken"],
                int(session_data["accessTokenExpirationTimestampMs"])
            )
            
        except Exception as e:
            raise HTTPException(
                status_code=500, 
                detail=f"Failed to fetch Bearer token: {str(e)}"
            )

    async def _fetch_client_token(self) -> None:
        """Fetch client token from Spotify"""
        url = "https://clienttoken.spotify.com/v1/clienttoken"
        
        payload = {
            "client_data": {
                "client_version": "1.2.59.53.gb992eb8d",
                "client_id": "d8a5ed958d274c2e8ee717e6a4b0971d",
                "js_sdk_data": {
                    "device_brand": "Apple",
                    "device_model": "unknown",
                    "os": platform.system().lower(),
                    "os_version": platform.release(),
                    "device_id": self._generate_device_id(),
                    "device_type": "computer"
                }
            }
        }
        
        headers = {
            "accept": "application/json",
            "content-type": "application/json",
            "origin": "https://open.spotify.com",
            "referer": "https://open.spotify.com/"
        }

        try:
            response = await self.client.post(url, json=payload, headers=headers)
            response.raise_for_status()
            data = response.json()
            
            self.client_token = data["granted_token"]["token"]
            current_time = time.time()
            self.token_expiry = current_time + data["granted_token"]["expires_after_seconds"]
            self.token_refresh = current_time + data["granted_token"]["refresh_after_seconds"]
            
        except Exception as e:
            raise HTTPException(
                status_code=500, 
                detail=f"Failed to fetch client token: {str(e)}"
            )

    async def get_tokens(self) -> Tuple[str, str]:
        """Get valid client and bearer tokens, refreshing if necessary"""
        current_time = time.time()
        
        if not self.client_token or current_time >= self.token_refresh:
            await self._fetch_client_token()
            
        if not self.bearer_token or current_time * 1000 >= self.bearer_expiry:
            self.bearer_token, self.bearer_expiry = await self._fetch_bearer_token()
        
        return self.client_token, self.bearer_token