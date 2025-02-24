# backend/spotify_partner.py
from typing import Dict
import httpx
import json
from urllib.parse import quote
from fastapi import HTTPException
from unofficial_token_manager import TokenManager
from models import AlbumResponse, Track

class SpotifyPartner:
    def __init__(self, token_manager: TokenManager):
        self.base_url = "https://api-partner.spotify.com/pathfinder/v1/query"
        self.token_manager = token_manager
        self.client = httpx.AsyncClient()

    async def _get_headers(self) -> Dict[str, str]:
        """Get headers with current tokens"""
        client_token, bearer_token = await self.token_manager.get_tokens()
        return {
            "accept": "application/json",
            "authorization": f"Bearer {bearer_token}",
            "client-token": client_token,
            "app-platform": "WebPlayer",
            "spotify-app-version": "1.2.59.53.gb992eb8d"
        }

    def _build_album_query(self, album_id: str) -> str:
        """Build GraphQL query URL for album data"""
        variables = {
            "uri": f"spotify:album:{album_id}",
            "locale": "",
            "offset": 0,
            "limit": 50
        }
        
        extensions = {
            "persistedQuery": {
                "version": 1,
                "sha256Hash": "1a33c76ec27fc5cca497d8503c656cdea3641779300d33d5964a9858c87caafe"
            }
        }

        query_params = {
            "operationName": "getAlbum",
            "variables": json.dumps(variables),
            "extensions": json.dumps(extensions)
        }

        params = "&".join(f"{k}={quote(v)}" for k, v in query_params.items())
        return f"{self.base_url}?{params}"

    async def get_album_tracks(self, album_id: str) -> AlbumResponse:
        """Get track details for an album including play counts"""
        url = self._build_album_query(album_id)
        headers = await self._get_headers()
        
        try:
            response = await self.client.get(url, headers=headers)
            response.raise_for_status()
            data = response.json()
            
            album_data = data["data"]["albumUnion"]
            artist_data = album_data["artists"]["items"][0]
            
            tracks = [
                Track(
                    track_id=item["track"]["uri"].split(":")[-1],
                    name=item["track"]["name"],
                    playcount=int(item["track"]["playcount"]),
                    artist_name=item["track"]["artists"]["items"][0]["profile"]["name"]
                )
                for item in album_data["tracksV2"]["items"]
            ]
            
            return AlbumResponse(
                album_id=album_data["uri"].split(":")[-1],
                album_name=album_data["name"],
                artist_id=artist_data["id"],
                artist_name=artist_data["profile"]["name"],
                tracks=tracks
            )
            
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to fetch album tracks: {str(e)}"
            )

    async def get_track_info(self, track_id: str) -> Dict:
        """Get individual track information including play count"""
        variables = {
            "uri": f"spotify:track:{track_id}",
            "locale": "",
        }
        
        extensions = {
            "persistedQuery": {
                "version": 1,
                "sha256Hash": "6c41f39bac32b7b03665680dd1f18774821c33ca113c52a33bc2d7c66f2ae720"
            }
        }

        query_params = {
            "operationName": "getTrack",
            "variables": json.dumps(variables),
            "extensions": json.dumps(extensions)
        }

        params = "&".join(f"{k}={quote(v)}" for k, v in query_params.items())
        url = f"{self.base_url}?{params}"
        
        headers = await self._get_headers()
        
        try:
            response = await self.client.get(url, headers=headers)
            response.raise_for_status()
            data = response.json()
            
            track_data = data["data"]["trackUnion"]
            return {
                "track_id": track_id,
                "name": track_data["name"],
                "playcount": int(track_data["playcount"]),
                "artist_name": track_data["artists"]["items"][0]["profile"]["name"]
            }
            
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to fetch track info: {str(e)}"
            )