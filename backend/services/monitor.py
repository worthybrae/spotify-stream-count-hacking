# services/monitor.py
import asyncio
from datetime import datetime
from typing import Any, Dict

from services.cockroach import get_db
from services.official_spotify import OfficialSpotifyService
from services.unofficial_spotify import TokenManager, UnofficialSpotifyService


class ServiceMonitor:
    """
    Service for monitoring the health of all application services
    and providing status information.
    """

    def __init__(self):
        """Initialize the service monitor"""
        self.services = {
            "cockroach_db": {
                "name": "CockroachDB",
                "status": "unknown",
                "last_checked": None,
                "error": None,
            },
            "official_spotify": {
                "name": "Official Spotify API",
                "status": "unknown",
                "last_checked": None,
                "error": None,
            },
            "unofficial_spotify": {
                "name": "Unofficial Spotify API",
                "status": "unknown",
                "last_checked": None,
                "error": None,
            },
        }
        self.token_manager = TokenManager()
        self.official_spotify = OfficialSpotifyService()
        self.unofficial_spotify = UnofficialSpotifyService(self.token_manager)

    async def test_cockroach_connection(self) -> Dict[str, Any]:
        """
        Test CockroachDB connection by attempting to connect and execute a simple query

        Returns:
            Dict with test result information
        """
        service_info = self.services["cockroach_db"].copy()
        service_info["last_checked"] = datetime.now().isoformat()

        try:
            async with get_db() as conn:
                # Execute a simple query to test connection
                result = await conn.fetchval("SELECT 1")

                if result == 1:
                    service_info["status"] = "healthy"
                    service_info["error"] = None
                else:
                    service_info["status"] = "degraded"
                    service_info["error"] = "Database returned unexpected result"
        except Exception as e:
            service_info["status"] = "unhealthy"
            service_info["error"] = str(e)

        # Update the service info
        self.services["cockroach_db"] = service_info
        return service_info

    async def test_official_spotify(self) -> Dict[str, Any]:
        """
        Test Official Spotify API by attempting to search for a popular album

        Returns:
            Dict with test result information
        """
        service_info = self.services["official_spotify"].copy()
        service_info["last_checked"] = datetime.now().isoformat()

        try:
            # Search for a very popular album that's unlikely to disappear
            test_query = "Thriller Michael Jackson"
            albums = await self.official_spotify.search_albums(test_query, limit=1)

            if albums and len(albums) > 0:
                service_info["status"] = "healthy"
                service_info["error"] = None
            else:
                service_info["status"] = "degraded"
                service_info["error"] = (
                    "API returned no results for a common search query"
                )
        except Exception as e:
            service_info["status"] = "unhealthy"
            service_info["error"] = str(e)

        # Update the service info
        self.services["official_spotify"] = service_info
        return service_info

    async def test_unofficial_spotify(self) -> Dict[str, Any]:
        """
        Test Unofficial Spotify API by attempting to fetch tokens with the token manager

        Returns:
            Dict with test result information
        """
        service_info = self.services["unofficial_spotify"].copy()
        service_info["last_checked"] = datetime.now().isoformat()

        try:
            # Try to get tokens
            client_token, bearer_token = await self.token_manager.get_tokens()

            if client_token and bearer_token:
                service_info["status"] = "healthy"
                service_info["error"] = None
            else:
                service_info["status"] = "degraded"
                service_info["error"] = "Failed to obtain valid tokens"
        except Exception as e:
            service_info["status"] = "unhealthy"
            service_info["error"] = str(e)

        # Update the service info
        self.services["unofficial_spotify"] = service_info
        return service_info

    async def check_all_services(self) -> Dict[str, Dict[str, Any]]:
        """
        Run tests for all services and return their status

        Returns:
            Dict mapping service keys to their status information
        """
        # Run all tests concurrently
        await asyncio.gather(
            self.test_cockroach_connection(),
            self.test_official_spotify(),
            self.test_unofficial_spotify(),
        )

        return self.services

    def get_status_summary(self) -> Dict[str, Any]:
        """
        Get a summary of all service statuses

        Returns:
            Dict with overall status and individual service statuses
        """
        # Count services by status
        status_counts = {"healthy": 0, "degraded": 0, "unhealthy": 0, "unknown": 0}

        for service in self.services.values():
            status = service["status"]
            status_counts[status] = status_counts.get(status, 0) + 1

        # Determine overall status
        overall_status = "healthy"
        if status_counts["unhealthy"] > 0:
            overall_status = "unhealthy"
        elif status_counts["degraded"] > 0:
            overall_status = "degraded"
        elif status_counts["unknown"] > 0:
            overall_status = "unknown"

        return {
            "overall_status": overall_status,
            "last_checked": max(
                [s["last_checked"] for s in self.services.values() if s["last_checked"]]
            )
            if any(s["last_checked"] for s in self.services.values())
            else None,
            "services": self.services,
        }


# Create a singleton instance of the monitor
monitor = ServiceMonitor()
